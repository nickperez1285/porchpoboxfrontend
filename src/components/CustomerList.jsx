
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const CustomerList = ({ vendorId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          packageCount: packageCounts[doc.id] || 0
        }));

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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customers</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <strong >
                <div> Name: {user.name || "Unnamed user"} </div>
                <div style={{ float: "right" }}>{user.packageCount || 0}
                  : PKGS</div>
              </strong>
              <div>Email: {user.email || "No email"}</div>
              <div>Phone: {user.phoneNumber || "No phone number"}</div>
              <div>
                Address: {user.streetAddress || "No street address"}
                {user.city ? `, ${user.city}` : ""}
                {user.state ? `, ${user.state}` : ""}
                {user.zipCode ? ` ${user.zipCode}` : ""}
              </div>
              <div>User ID: {user.id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerList;
