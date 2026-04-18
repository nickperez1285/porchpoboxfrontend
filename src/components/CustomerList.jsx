
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  updateDoc
} from "firebase/firestore";

const CustomerList = ({ vendorId, onPackagesDelivered }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState([]);
  const [deliveringUserId, setDeliveringUserId] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [querySnapshot, packageCountsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          vendorId
            ? getDocs(collection(db, "vendors", vendorId, "packageCounts"))
            : Promise.resolve({ docs: [] })
        ]);

        const packageCounts = Object.fromEntries(
          packageCountsSnapshot.docs.map((entry) => [
            entry.id,
            entry.data().count || 0
          ])
        );

        const usersList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            packageCount: packageCounts[doc.id] || 0
          }))
          .filter((user) => user.packageCount > 0);

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Unable to load customers. Check Firestore vendor read permissions.");
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

    const confirmed = window.confirm("Would you like to mark packages as delivered?");
    if (!confirmed) {
      return;
    }

    setDeliveringUserId(user.id);
    setError("");

    try {
      await deleteDoc(doc(db, "vendors", vendorId, "packageCounts", user.id));
      await updateDoc(doc(db, "vendors", vendorId), {
        packageCheckInCount: increment(-user.packageCount)
      });

      setUsers((current) => current.filter((entry) => entry.id !== user.id));
      setExpandedUserIds((current) => current.filter((id) => id !== user.id));

      if (onPackagesDelivered) {
        onPackagesDelivered(user.packageCount);
      }
    } catch (deliveryError) {
      console.error("Error marking packages as delivered:", deliveryError);
      setError("Unable to mark packages as delivered.");
    } finally {
      setDeliveringUserId("");
    }
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
        <h2 style={{ margin: "8px 0 0" }}>Customers With Packages</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : users.length === 0 ? (
        <p>No customers currently have packages checked in at this vendor.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                background: "#fffdf9"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{user.name || "Unnamed user"}</strong>
                <button
                  type="button"
                  onClick={() => handleMarkDelivered(user)}
                  disabled={deliveringUserId === user.id}
                >
                  {deliveringUserId === user.id
                    ? "Updating..."
                    : `${user.packageCount || 0}: PKGS`}
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleExpanded(user.id)}
                style={{
                  marginTop: 8,
                  padding: 0,
                  border: "none",
                  background: "none",
                  color: "#0b57d0",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                {expandedUserIds.includes(user.id) ? "Hide Info" : "Info"}
              </button>

              {expandedUserIds.includes(user.id) && (
                <div style={{ marginTop: 12 }}>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerList;
