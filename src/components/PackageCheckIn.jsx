import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, increment, setDoc, updateDoc } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { db } from "../firebase";
import PartnerStatusLegend from "./PartnerStatusLegend";

const PackageCheckIn = ({ partnerProfile, onPackagesCheckedIn }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [packageQuantities, setPackageQuantities] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [usersSnapshot, packageCountsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "partners", partnerProfile.id, "packageCounts"))
        ]);

        const packageCounts = Object.fromEntries(
          packageCountsSnapshot.docs.map((entry) => [
            entry.id,
            {
              count: Number(entry.data().count) || 0,
              totalReceived: Number(entry.data().totalReceived) || Number(entry.data().count) || 0,
              totalPickedUp: Number(entry.data().totalPickedUp) || 0
            }
          ])
        );

        setUsers(
          usersSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
            packagesCheckedIn: Number(entry.data().packagesCheckedIn) || 0,
            packagesDelivered: Number(entry.data().packagesDelivered) || 0,
            packageCount: packageCounts[entry.id]?.count || 0,
            totalReceived: packageCounts[entry.id]?.totalReceived || 0,
            totalPickedUp: packageCounts[entry.id]?.totalPickedUp || 0
          }))
        );
      } catch (loadError) {
        console.error("Error loading users for package check in:", loadError);
        setError("Unable to load users for package check in.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [partnerProfile.id]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(term)
    );
  }, [search, users]);

  const toggleExpanded = (userId) => {
    setExpandedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const getNormalizedPackageQuantity = (userId) =>
    Math.max(1, Number(packageQuantities[userId]) || 1);

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
    setPackageQuantities((current) => ({
      ...current,
      [userId]: current[userId] ?? "1"
    }));
  };

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));
  const totalSelectedPackages = selectedUsers.reduce(
    (sum, user) => sum + getNormalizedPackageQuantity(user.id),
    0
  );

  const updatePackageQuantity = (userId, nextValue) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: nextValue
    }));
  };

  const finalizePackageQuantity = (userId) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: String(getNormalizedPackageQuantity(userId))
    }));
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

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/package-check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vendorName: partnerProfile.businessName,
          partnerId: partnerProfile.id,
          recipients: selectedUsers.map((user) => ({
            id: user.id,
            name: user.name || "Customer",
            email: user.email,
            packageCount: getNormalizedPackageQuantity(user.id)
          }))
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

        throw new Error(
          body?.message || responseText || "Package notification email failed."
        );
      }

      // Update partner's total package check-in count
      const updatePartnerPromise = updateDoc(doc(db, "partners", partnerProfile.id), {
        packageCheckInCount: increment(totalSelectedPackages)
      });

      // Update each user's package counts
      const updatePackageCountsPromise = Promise.all(
        selectedUsers.map(async (user) => {
          const packageQuantity = getNormalizedPackageQuantity(user.id);
          const packageCountRef = doc(
            db,
            "partners",
            partnerProfile.id,
            "packageCounts",
            user.id
          );
          const existingSnapshot = await getDoc(packageCountRef);
          const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};
          const currentCount = Number(existingData.count) || 0;
          const currentTotalReceived = Number(existingData.totalReceived) || currentCount;
          const currentTotalPickedUp = Number(existingData.totalPickedUp) || 0;

          return setDoc(
            packageCountRef,
            {
              count: currentCount + packageQuantity,
              totalReceived: currentTotalReceived + packageQuantity,
              totalPickedUp: currentTotalPickedUp,
              name: user.name || "Unnamed user",
              email: user.email || ""
            },
            { merge: true }
          );
        })
      );

      // Wait for all updates to complete
      await Promise.all([updatePartnerPromise, updatePackageCountsPromise]);

      if (onPackagesCheckedIn) {
        await onPackagesCheckedIn();
      }

      navigate("/partner");
    } catch (submitError) {
      console.error("Error checking in packages:", submitError);
      setError(submitError.message);
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <h2>Package Check In</h2>
      <p>Selected packages: {totalSelectedPackages}</p>
      <PartnerStatusLegend />

      <input
        type="text"
        placeholder="Search users"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ width: "100%", maxWidth: 420, marginBottom: 16, padding: 10 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16 }}>
          {filteredUsers.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eee",
                    background: getCustomerBackgroundColor(user),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8
                  }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
                    <strong>{user.name || "Unnamed user"}</strong>
                    <button
                      onClick={() => toggleExpanded(user.id)}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "4px 8px",
                        background: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "0.8em"
                      }}
                    >
                      {expandedUserIds.includes(user.id) ? "Hide INFO" : "INFO"}
                    </button>
                  </div>
                  {expandedUserIds.includes(user.id) && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee", fontSize: "0.9em", background: "#f9f9f9", padding: 8, borderRadius: 4, zIndex: 1 }}>
                      <div><strong>Contact Information:</strong></div>
                      <div>Email: {user.email || "Not provided"}</div>
                      <div>Phone: {user.phone || "Not provided"}</div>
                      <div>Address: {user.address || "Not provided"}</div>
                      <div style={{ marginTop: 8 }}><strong>Check-in History:</strong></div>
                      <div>Total Packages Received: {user.totalReceived}</div>
                      <div>Total Packages Picked Up: {user.totalPickedUp}</div>
                      <div>Current Packages Waiting: {user.packageCount}</div>
                      <div>Status: {user.status || "Unknown"}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={packageQuantities[user.id] ?? "1"}
                      onChange={(event) => updatePackageQuantity(user.id, event.target.value)}
                      onBlur={() => finalizePackageQuantity(user.id)}
                      style={{
                        width: 40,
                        padding: 8,
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        appearance: "none"
                      }}
                      aria-label={`Package count for ${user.name || "user"}`}
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
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={totalSelectedPackages === 0 || submitting}
        >
          Check In Packages
        </button>
        <button type="button" onClick={() => navigate("/partner")} disabled={submitting}>
          Cancel
        </button>
      </div>

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, maxWidth: 420, width: "100%" }}>
            <p>You are about to check in {totalSelectedPackages} packages.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowConfirm(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={handleCheckIn} disabled={submitting}>
                {submitting ? "Sending..." : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageCheckIn;
