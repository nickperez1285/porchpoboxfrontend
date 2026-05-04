
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import API_BASE_URL from "../config/api";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc
} from "firebase/firestore";

const CustomerList = ({ vendorId, partnerLocationName, onPackagesDelivered }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState([]);
  const [deliveringUserId, setDeliveringUserId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [packageQuantities, setPackageQuantities] = useState({});

  useEffect(() => {
    if (!vendorId) {
      setUsers([]);
      setLoading(false);
      return () => {};
    }

    let usersSnapshotData = null;
    let packageCountsSnapshotData = null;

    const syncUsers = () => {
      if (!usersSnapshotData || !packageCountsSnapshotData) {
        return;
      }

      const packageCounts = Object.fromEntries(
        packageCountsSnapshotData.docs.map((entry) => [
          entry.id,
          {
            count: Number(entry.data().count) || 0,
            totalReceived: Number(entry.data().totalReceived) || Number(entry.data().count) || 0,
            totalPickedUp: Number(entry.data().totalPickedUp) || 0,
            holdForResubscribe: Boolean(entry.data().holdForResubscribe)
          }
        ])
      );

      const usersList = usersSnapshotData.docs
        .map((entry) => ({
          id: entry.id,
          ...entry.data(),
          packagesCheckedIn: Number(entry.data().packagesCheckedIn) || 0,
          packagesDelivered: Number(entry.data().packagesDelivered) || 0,
          packageCount: packageCounts[entry.id]?.count || 0,
          totalReceived: packageCounts[entry.id]?.totalReceived || 0,
          totalPickedUp: packageCounts[entry.id]?.totalPickedUp || 0,
          holdForResubscribe: packageCounts[entry.id]?.holdForResubscribe || false
        }))
        .filter(
          (user) =>
            user.packageCount > 0 ||
            (user.status !== "active" && user.holdForResubscribe)
        );

      setUsers(usersList);
      setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        usersSnapshotData = snapshot;
        setError("");
        syncUsers();
      },
      (snapshotError) => {
        console.error("Error fetching users:", snapshotError);
        setError("Unable to load customers. Check Firestore partner read permissions.");
        setLoading(false);
      }
    );

    const unsubscribePackageCounts = onSnapshot(
      collection(db, "partners", vendorId, "packageCounts"),
      (snapshot) => {
        packageCountsSnapshotData = snapshot;
        setError("");
        syncUsers();
      },
      (snapshotError) => {
        console.error("Error fetching partner package counts:", snapshotError);
        setError("Unable to load customers. Check Firestore partner read permissions.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribePackageCounts();
    };
  }, [vendorId]);

  const toggleExpanded = (userId) => {
    setExpandedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const handleDeliverSelected = async () => {
    if (selectedUserIds.length === 0) {
      return;
    }

    const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));
    const totalPackages = selectedUsers.reduce((sum, user) => sum + getNormalizedPackageQuantity(user.id), 0);

    const confirmed = window.confirm(
      `Deliver ${totalPackages} package(s) for ${selectedUsers.length} customer(s)?`
    );
    if (!confirmed) {
      return;
    }

    setDeliveringUserId("bulk");
    setError("");

    try {
      const deliveryPayload = selectedUsers
        .map((user) => ({
          id: user.id,
          packageCount: getNormalizedPackageQuantity(user.id)
        }))
        .filter((recipient) => recipient.packageCount > 0);

      if (deliveryPayload.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/notifications/package-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            partnerId: vendorId,
            partnerName: partnerLocationName,
            recipients: deliveryPayload
          })
        });

        if (!response.ok) {
          const responseText = await response.text();
          let body = null;

          try {
            body = responseText ? JSON.parse(responseText) : null;
          } catch (parseError) {
            body = null;
          }

          throw new Error(body?.message || responseText || "Package delivery update failed.");
        }
      }

      const deliveryPromises = selectedUsers.map(async (user) => {
          const packageCount = getNormalizedPackageQuantity(user.id);
          if (packageCount === 0) return;

          const packageCountRef = doc(db, "partners", vendorId, "packageCounts", user.id);

          await updateDoc(packageCountRef, {
            totalPickedUp: increment(packageCount)
          });

          const remainingCount = user.packageCount - packageCount;
          if (remainingCount <= 0) {
            await setDoc(
              packageCountRef,
              {
                count: 0,
                holdForResubscribe: user.status !== "active" && user.packageCount > 1
              },
              { merge: true }
            );
          } else {
            await updateDoc(packageCountRef, {
              count: increment(-packageCount)
            });
          }

          return packageCount;
        });
      await Promise.all(deliveryPromises);

      await updateDoc(doc(db, "partners", vendorId), {
        packageCheckInCount: increment(-totalPackages)
      });

      setSelectedUserIds([]);
      setPackageQuantities({});

      if (onPackagesDelivered) {
        onPackagesDelivered(totalPackages);
      }
    } catch (deliveryError) {
      console.error("Error delivering selected packages:", deliveryError);
      const errorDetail = deliveryError?.message || String(deliveryError);
      setError(`Unable to deliver packages. ${errorDetail}`);
    } finally {
      setDeliveringUserId("");
    }
  };

  const getCustomerBackgroundColor = (user) => {
    const isPaidUp = user.status === "active";
    const totalReceived = user.totalReceived || 0;

    if (isPaidUp || totalReceived === 0) {
      return "#ffffff"; // White: paid up or new/never used
    } else if (totalReceived === 1) {
      return "#fff6bf"; // Yellow: received one package
    } else {
      return "#ffd9d9"; // Red: not paid up and received more than one
    }
  };

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const updatePackageQuantity = (userId, value) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: value
    }));
  };

  const finalizePackageQuantity = (userId) => {
    const quantity = packageQuantities[userId];
    if (quantity !== undefined && (quantity === "" || isNaN(quantity) || quantity < 1)) {
      setPackageQuantities((current) => ({
        ...current,
        [userId]: "1"
      }));
    }
  };

  const getNormalizedPackageQuantity = (userId) => {
    const user = users.find((u) => u.id === userId);
    const maxQuantity = user?.packageCount || 0;
    const quantity = Number(packageQuantities[userId]) || 1;
    return Math.min(Math.max(1, quantity), maxQuantity);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            color: "#8a6a00",
            letterSpacing: 1,
            textTransform: "uppercase"
          }}
        >
          Active Deliveries
        </div>
        <h2 style={{ margin: "8px 0 0" }}> Packages Checked In</h2>
      </div>

      <button
        type="button"
        onClick={() => handleDeliverSelected()}
        disabled={selectedUserIds.length === 0 || deliveringUserId}
        style={{
          padding: "8px 16px",
          background: selectedUserIds.length === 0 ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: selectedUserIds.length === 0 ? "not-allowed" : "pointer",
          marginBottom: 16
        }}
      >
        {deliveringUserId ? "Delivering..." : `Deliver Selected (${selectedUserIds.length})`}
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : users.length === 0 ? (
        <p>No customers currently have packages checked in at this partner location.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                background: getCustomerBackgroundColor(user)
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{user.name || "Unnamed user"}</strong>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(user.id)}
                      style={{
                        padding: 0,
                        border: "none",
                        background: "none",
                        color: "#0b57d0",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "0.9em"
                      }}
                    >
                      {expandedUserIds.includes(user.id) ? "Hide Info" : "Info"}
                    </button>
                  </div>
                </div>

                    {expandedUserIds.includes(user.id) && (
                  <div style={{ marginTop: 12 }}>
                    <div>Subscription Status: {user.status || "inactive"}</div>
                    <div>Email: {user.email || "No email"}</div>
                    <div>Phone: {user.phoneNumber || "No phone number"}</div>
                    <div>
                      Address: {user.streetAddress || "No street address"}
                      {user.city ? `, ${user.city}` : ""}
                      {user.state ? `, ${user.state}` : ""}
                      {user.zipCode ? ` ${user.zipCode}` : ""}
                    </div>
                    <div>User ID: {user.id}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#444", fontSize: 14 }}>
                  <div>Packages Waiting: {user.packageCount || 0}</div>
                  <div>Total Received: {user.totalReceived || 0}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16 }}>
                <label style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                  Deliver now
                </label>
                <input
                  type="number"
                  min="1"
                  max={user.packageCount || 0}
                  step="1"
                  value={packageQuantities[user.id] ?? "1"}
                  onChange={(event) => updatePackageQuantity(user.id, event.target.value)}
                  onBlur={() => finalizePackageQuantity(user.id)}
                  style={{
                    width: 50,
                    padding: 6,
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none"
                  }}
                  aria-label={`Packages to deliver now for ${user.name || "user"}`}
                />
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleSelection(user.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerList;
