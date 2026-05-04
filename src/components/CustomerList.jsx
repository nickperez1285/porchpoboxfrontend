
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
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
    const fetchUsers = async () => {
      try {
        const [querySnapshot, packageCountsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          vendorId
            ? getDocs(collection(db, "partners", vendorId, "packageCounts"))
            : Promise.resolve({ docs: [] })
        ]);

        const packageCounts = Object.fromEntries(
          packageCountsSnapshot.docs.map((entry) => [
            entry.id,
            {
              count: Number(entry.data().count) || 0,
              totalReceived: Number(entry.data().totalReceived) || Number(entry.data().count) || 0,
              totalPickedUp: Number(entry.data().totalPickedUp) || 0,
              holdForResubscribe: Boolean(entry.data().holdForResubscribe)
            }
          ])
        );

        const usersList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            packageCount: packageCounts[doc.id]?.count || 0,
            totalReceived: packageCounts[doc.id]?.totalReceived || 0,
            totalPickedUp: packageCounts[doc.id]?.totalPickedUp || 0,
            holdForResubscribe: packageCounts[doc.id]?.holdForResubscribe || false
          }))
          .filter(
            (user) =>
              user.packageCount > 0 ||
              (user.status !== "active" && user.holdForResubscribe)
          );

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Unable to load customers. Check Firestore partner read permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [vendorId]);

  const toggleExpanded = (userId) => {
    setExpandedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const handleMarkDelivered = async (user) => {
    if (!vendorId || !user.packageCount) {
      return;
    }

    const packageCount = Number(user.packageCount) || 0;
    if (packageCount === 0) {
      return;
    }

    const shouldKeepRedStatus = user.status !== "active" && packageCount > 1;
    const confirmed = window.confirm(
      shouldKeepRedStatus
        ? "Would you like to mark packages as delivered?\n\nReminder: this customer is inactive and will not be able to use Porch P.O. Box again until they subscribe and make payment."
        : "Would you like to mark packages as delivered?"
    );
    if (!confirmed) {
      return;
    }

    setDeliveringUserId(user.id);
    setError("");

    try {
      const packageCountRef = doc(db, "partners", vendorId, "packageCounts", user.id);
      await updateDoc(packageCountRef, {
        totalPickedUp: increment(packageCount)
      });

      if (shouldKeepRedStatus) {
        await setDoc(
          doc(db, "partners", vendorId, "packageCounts", user.id),
          {
            count: 0,
            holdForResubscribe: true
          },
          { merge: true }
        );
      } else {
        await deleteDoc(doc(db, "partners", vendorId, "packageCounts", user.id));
      }

      await updateDoc(doc(db, "partners", vendorId), {
        packageCheckInCount: increment(-packageCount)
      });

      setUsers((current) =>
        current
          .map((entry) =>
            entry.id === user.id
              ? {
                ...entry,
                packageCount: 0,
                holdForResubscribe: shouldKeepRedStatus && entry.status !== "active"
              }
              : entry
          )
          .filter((entry) => entry.packageCount > 0 || entry.holdForResubscribe)
      );
      setExpandedUserIds((current) => current.filter((id) => id !== user.id));

      if (onPackagesDelivered) {
        onPackagesDelivered(packageCount);
      }
    } catch (deliveryError) {
      console.error("Error marking packages as delivered:", deliveryError);
      const errorDetail = deliveryError?.message || String(deliveryError);
      setError(`Unable to mark packages as delivered. ${errorDetail}`);
    } finally {
      setDeliveringUserId("");
    }
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
      const deliveryPromises = selectedUsers.map(async (user) => {
        const packageCount = getNormalizedPackageQuantity(user.id);
        if (packageCount === 0) return;

        const packageCountRef = doc(db, "partners", vendorId, "packageCounts", user.id);
        await updateDoc(packageCountRef, {
          totalPickedUp: increment(packageCount)
        });

        const remainingCount = user.packageCount - packageCount;
        if (remainingCount <= 0) {
          if (user.status !== "active" && user.packageCount > 1) {
            await setDoc(
              doc(db, "partners", vendorId, "packageCounts", user.id),
              {
                count: 0,
                holdForResubscribe: true
              },
              { merge: true }
            );
          } else {
            await deleteDoc(doc(db, "partners", vendorId, "packageCounts", user.id));
          }
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

      // Refresh the user list
      const [querySnapshot, packageCountsSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "partners", vendorId, "packageCounts"))
      ]);

      const packageCounts = Object.fromEntries(
        packageCountsSnapshot.docs.map((entry) => [
          entry.id,
          {
            count: Number(entry.data().count) || 0,
            totalReceived: Number(entry.data().totalReceived) || Number(entry.data().count) || 0,
            totalPickedUp: Number(entry.data().totalPickedUp) || 0,
            holdForResubscribe: Boolean(entry.data().holdForResubscribe)
          }
        ])
      );

      const usersList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          packageCount: packageCounts[doc.id]?.count || 0,
          totalReceived: packageCounts[doc.id]?.totalReceived || 0,
          totalPickedUp: packageCounts[doc.id]?.totalPickedUp || 0,
          holdForResubscribe: packageCounts[doc.id]?.holdForResubscribe || false
        }))
        .filter(
          (user) =>
            user.packageCount > 0 ||
            (user.status !== "active" && user.holdForResubscribe)
        );

      setUsers(usersList);
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
        <h2 style={{ margin: "8px 0 16px" }}> Packages Checked In</h2>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16 }}>
                <input
                  type="number"
                  min="1"
                  max={user.packageCount || 0}
                  step="1"
                  value={packageQuantities[user.id] ?? "1"}
                  onChange={(event) => updatePackageQuantity(user.id, event.target.value)}
                  onBlur={() => finalizePackageQuantity(user.id)}
                  style={{ width: 50, padding: 6 }}
                  aria-label={`Package count to deliver for ${user.name || "user"}`}
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
