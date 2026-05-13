import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
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
          getDocs(
            collection(db, "partners", partnerProfile.id, "packageCounts"),
          ),
        ]);

        const packageCounts = Object.fromEntries(
          packageCountsSnapshot.docs.map((entry) => [
            entry.id,
            {
              count: Number(entry.data().count) || 0,
              totalReceived:
                Number(entry.data().totalReceived) ||
                Number(entry.data().count) ||
                0,
              totalPickedUp: Number(entry.data().totalPickedUp) || 0,
            },
          ]),
        );

        setUsers(
          usersSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
            packagesCheckedIn: Number(entry.data().packagesCheckedIn) || 0,
            packagesDelivered: Number(entry.data().packagesDelivered) || 0,
            packageCount: packageCounts[entry.id]?.count || 0,
            totalReceived: packageCounts[entry.id]?.totalReceived || 0,
            totalPickedUp: packageCounts[entry.id]?.totalPickedUp || 0,
          })),
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
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(term),
    );
  }, [search, users]);

  const toggleExpanded = (userId) => {
    setExpandedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const getNormalizedPackageQuantity = (userId) =>
    Math.max(1, Number(packageQuantities[userId]) || 1);

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
    setPackageQuantities((current) => ({
      ...current,
      [userId]: current[userId] ?? "1",
    }));
  };

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id),
  );
  const totalSelectedPackages = selectedUsers.reduce(
    (sum, user) => sum + getNormalizedPackageQuantity(user.id),
    0,
  );

  const updatePackageQuantity = (userId, nextValue) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: nextValue,
    }));
  };

  const finalizePackageQuantity = (userId) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: String(getNormalizedPackageQuantity(userId)),
    }));
  };

  const getCustomerBackgroundColor = (user) => {
    if (user.status === "active") return "#d4edda";
    if (user.status === "trial") return "#fff6bf";
    return "#ffd9d9";
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/package-check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorName:
              partnerProfile.businessName ||
              partnerProfile.streetAddress ||
              "Your Porch P.O. Box Location",
            partnerId: partnerProfile.id,
            recipients: selectedUsers.map((user) => ({
              id: user.id,
              name: user.name || "Customer",
              email: user.email,
              packageCount: getNormalizedPackageQuantity(user.id),
            })),
          }),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        let body = null;

        try {
          body = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          body = null;
        }

        throw new Error(
          body?.message || responseText || "Package notification email failed.",
        );
      }

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
        <div
          style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16 }}
        >
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
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
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
                        {expandedUserIds.includes(user.id)
                          ? "Hide Info"
                          : "Info"}
                      </button>
                    </div>
                    {expandedUserIds.includes(user.id) && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: "0.9em",
                          color: "#444",
                        }}
                      >
                        <div>Email: {user.email || "Not provided"}</div>
                        <div>Phone: {user.phoneNumber || "Not provided"}</div>
                        <div>
                          Address: {user.streetAddress || "Not provided"}
                          {user.city ? `, ${user.city}` : ""}
                          {user.state ? `, ${user.state}` : ""}
                          {user.zipCode ? ` ${user.zipCode}` : ""}
                        </div>
                        <div>Total Received: {user.totalReceived}</div>
                        <div>Total Picked Up: {user.totalPickedUp}</div>
                        <div>Waiting: {user.packageCount}</div>
                        <div>Status: {user.status || "Unknown"}</div>
                      </div>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={packageQuantities[user.id] ?? "1"}
                      onChange={(event) =>
                        updatePackageQuantity(user.id, event.target.value)
                      }
                      onBlur={() => finalizePackageQuantity(user.id)}
                      style={{
                        width: 40,
                        padding: 8,
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        appearance: "none",
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
          CHECK IN PACKAGES
        </button>
        <button
          type="button"
          onClick={() => navigate("/partner")}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>

      {showConfirm && (() => {
        const inactiveSelected = selectedUsers.filter((u) => u.status !== "active" && u.status !== "trial");
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              zIndex: 9999
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 28,
                borderRadius: 16,
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 16px 48px rgba(0,0,0,0.2)"
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>Confirm Check-In</h3>
              <p style={{ margin: "0 0 16px", color: "#555", fontSize: 14 }}>
                You are about to check in <strong>{totalSelectedPackages} package{totalSelectedPackages !== 1 ? "s" : ""}</strong> for <strong>{selectedUsers.length} customer{selectedUsers.length !== 1 ? "s" : ""}</strong>.
              </p>

              {inactiveSelected.length > 0 && (
                <div style={{
                  background: "#fff3f3",
                  border: "1px solid #f5c2c2",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 20
                }}>
                  <div style={{ fontWeight: 700, color: "#c00", fontSize: 14, marginBottom: 8 }}>
                    ⚠️ Payment Required
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "#7a0000" }}>
                    The following customer{inactiveSelected.length !== 1 ? "s are" : " is"} <strong>inactive</strong> and require{inactiveSelected.length === 1 ? "s" : ""} payment to continue using the service:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {inactiveSelected.map((u) => (
                      <li key={u.id} style={{ fontSize: 13, color: "#7a0000", fontWeight: 600 }}>{u.name || u.email || "Unknown user"}</li>
                    ))}
                  </ul>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#a00" }}>
                    You may still accept their package, but please inform them that a subscription is needed.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: 14 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={submitting}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#121212", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  {submitting ? "Checking in..." : "Confirm Check-In"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PackageCheckIn;
