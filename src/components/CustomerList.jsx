import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { apiPost } from "../utils/apiClient";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

const CustomerList = ({
  vendorId,
  partnerLocationName,
  onPackagesDelivered,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [deliveringUserId, setDeliveringUserId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [packageQuantities, setPackageQuantities] = useState({});
  const [sortBy, setSortBy] = useState("name");

  const sortedUsers = useMemo(() => {
    const sorted = [...users];
    if (sortBy === "packageCount") {
      sorted.sort((a, b) => {
        if ((b.packageCount || 0) !== (a.packageCount || 0)) {
          return (b.packageCount || 0) - (a.packageCount || 0);
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    } else {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return sorted;
  }, [users, sortBy]);

  useEffect(() => {
    if (!vendorId) {
      setUsers([]);
      setLoading(false);
      return () => {};
    }

    // Drive the list from the packageCounts subcollection
    const unsubscribePackageCounts = onSnapshot(
      collection(db, "partners", vendorId, "packageCounts"),
      (snapshot) => {
        setError("");
        const usersList = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            packageCount: Number(d.data().count) || 0,
            totalReceived:
              Number(d.data().totalReceived) || Number(d.data().count) || 0,
            totalPickedUp: Number(d.data().totalPickedUp) || 0,
            holdForResubscribe: Boolean(d.data().holdForResubscribe),
          }))
          .filter((u) => u.packageCount > 0);

        setUsers(usersList);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Error fetching partner package counts:", snapshotError);
        setError("Unable to load active deliveries.");
        setLoading(false);
      },
    );

    return () => unsubscribePackageCounts();
  }, [vendorId]);

  // Fetch live user status from the users collection
  useEffect(() => {
    if (users.length === 0) return;
    let cancelled = false;
    const ids = users
      .filter((u) => !userDetails[u.id])
      .map((u) => u.id);
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => getDoc(doc(db, "users", id)))).then(
      (snaps) => {
        if (cancelled) return;
        const updates = {};
        snaps.forEach((snap) => {
          if (snap.exists()) updates[snap.id] = snap.data();
        });
        setUserDetails((prev) => ({ ...prev, ...updates }));
      },
      () => {},
    );
    return () => { cancelled = true; };
  }, [users, userDetails]);

  const toggleExpanded = async (userId) => {
    const isExpanding = !expandedUserIds.includes(userId);
    if (isExpanding) {
      setExpandedUserIds((prev) => [...prev, userId]);
      if (!userDetails[userId]) {
        try {
          const snap = await getDoc(doc(db, "users", userId));
          if (snap.exists()) {
            setUserDetails((prev) => ({ ...prev, [userId]: snap.data() }));
          }
        } catch (err) {
          console.error("Error fetching user details:", err);
        }
      }
    } else {
      setExpandedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleDeliverSelected = async () => {
    if (selectedUserIds.length === 0) {
      return;
    }

    const selectedUsers = users.filter((user) =>
      selectedUserIds.includes(user.id),
    );
    const totalPackages = selectedUsers.reduce(
      (sum, user) => sum + getNormalizedPackageQuantity(user.id),
      0,
    );

    const confirmed = window.confirm(
      `Deliver ${totalPackages} package(s) for ${selectedUsers.length} customer(s)?`,
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
          name: user.name || "",
          email: user.email || "",
          packageCount: getNormalizedPackageQuantity(user.id),
        }))
        .filter((recipient) => recipient.packageCount > 0);

      if (deliveryPayload.length > 0) {
        const response = await apiPost("/api/notifications/package-delivery", {
          partnerId: vendorId,
          partnerName: partnerLocationName,
          recipients: deliveryPayload,
        });

        if (!response.ok) {
          const responseText = await response.text();
          let body = null;

          try {
            body = responseText ? JSON.parse(responseText) : null;
          } catch (parseError) {
            body = null;
          }

          throw new Error(
            body?.message || responseText || "Package delivery update failed.",
          );
        }
      }

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
    // Priority: dynamic user details, then data cached in packageCounts
    const status = (userDetails[user.id]?.status || user.status || "")
      .trim()
      .toLowerCase();
    if (status === "active" || status === "member") return "#d4edda";
    if (status === "trial") return "#fff6bf";
    return "#ffd9d9";
  };

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const updatePackageQuantity = (userId, value) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: value,
    }));
  };

  const finalizePackageQuantity = (userId) => {
    const quantity = packageQuantities[userId];
    if (
      quantity !== undefined &&
      (quantity === "" || isNaN(quantity) || quantity < 1)
    ) {
      setPackageQuantities((current) => ({
        ...current,
        [userId]: "1",
      }));
    }
  };

  const getNormalizedPackageQuantity = (userId) => {
    const user = users.find((u) => u.id === userId);
    const maxQuantity = user?.packageCount || 0;
    const raw = packageQuantities[userId];
    const quantity = raw !== undefined ? Number(raw) : maxQuantity;
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
            textTransform: "uppercase",
          }}
        >
          Active Deliveries
        </div>
        <h2 style={{ margin: "8px 0 0" }}> Packages Checked In</h2>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={() => setSortBy("name")}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: sortBy === "name" ? "#111" : "#fff",
            color: sortBy === "name" ? "#fff" : "#111",
            transition: "all 0.2s",
          }}
        >
          Sort by Name
        </button>
        <button
          type="button"
          onClick={() => setSortBy("packageCount")}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: sortBy === "packageCount" ? "#111" : "#fff",
            color: sortBy === "packageCount" ? "#fff" : "#111",
            transition: "all 0.2s",
          }}
        >
          Sort by Packages
        </button>
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
          marginBottom: 16,
        }}
      >
        {deliveringUserId
          ? "Delivering..."
          : `Mark Selected as Delivered (${selectedUserIds.length})`}
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : users.length === 0 ? (
        <p>
          No customers currently have packages checked in at this partner
          location.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sortedUsers.map((user) => (
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
                background: getCustomerBackgroundColor(user),
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
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
                        fontSize: "0.9em",
                      }}
                    >
                      {expandedUserIds.includes(user.id) ? "Hide Info" : "Info"}
                    </button>
                  </div>
                </div>

                {expandedUserIds.includes(user.id) && (
                  <div style={{ marginTop: 12 }}>
                    <div>
                      Subscription Status:{" "}
                      {userDetails[user.id]?.status ||
                        user.status ||
                        "loading..."}
                    </div>
                    <div>
                      Email:{" "}
                      {userDetails[user.id]?.email || user.email || "No email"}
                    </div>
                    <div>Phone: {userDetails[user.id]?.phoneNumber || "—"}</div>
                    <div>
                      Address: {userDetails[user.id]?.streetAddress || "—"}
                      {userDetails[user.id]?.city
                        ? `, ${userDetails[user.id].city}`
                        : ""}
                      {userDetails[user.id]?.state
                        ? `, ${userDetails[user.id].state}`
                        : ""}
                      {userDetails[user.id]?.zipCode
                        ? ` ${userDetails[user.id].zipCode}`
                        : ""}
                    </div>
                    <div>User ID: {user.id}</div>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    color: "#444",
                    fontSize: 14,
                  }}
                >
                  <div>Packages Waiting: {user.packageCount || 0}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginLeft: 16,
                }}
              >
                <label
                  style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}
                >
                  Deliver now
                </label>
                <input
                  type="number"
                  min="1"
                  max={user.packageCount || 0}
                  step="1"
                  value={
                    packageQuantities[user.id] ?? String(user.packageCount || 1)
                  }
                  onChange={(event) =>
                    updatePackageQuantity(user.id, event.target.value)
                  }
                  onBlur={() => finalizePackageQuantity(user.id)}
                  style={{
                    width: 50,
                    padding: 6,
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
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
