import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, increment, setDoc, updateDoc } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { db } from "../firebase";

const PackageCheckIn = ({ partnerProfile, onPackagesCheckedIn }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        setUsers(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data()
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
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(term)
    );
  }, [search, users]);

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

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
          recipients: selectedUsers.map((user) => ({
            name: user.name || "Customer",
            email: user.email
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

      await updateDoc(doc(db, "partners", partnerProfile.id), {
        packageCheckInCount: increment(selectedUsers.length)
      });

      await Promise.all(
        selectedUsers.map(async (user) => {
          const packageCountRef = doc(
            db,
            "partners",
            partnerProfile.id,
            "packageCounts",
            user.id
          );
          const existingCountSnapshot = await getDoc(packageCountRef);
          const existingCount = existingCountSnapshot.exists()
            ? existingCountSnapshot.data().count || 0
            : 0;

          return setDoc(
            packageCountRef,
            {
              count: existingCount + 1,
              name: user.name || "Unnamed user",
              email: user.email || ""
            },
            { merge: true }
          );
        })
      );

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
      <p>Selected packages: {selectedUserIds.length}</p>

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
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <div>
                    <strong>{user.name || "Unnamed user"}</strong>
                    <div>{user.email || "No email"}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleSelection(user.id)}
                  />
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
          disabled={selectedUserIds.length === 0 || submitting}
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
            <p>You are about to check in {selectedUserIds.length} packages.</p>
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
