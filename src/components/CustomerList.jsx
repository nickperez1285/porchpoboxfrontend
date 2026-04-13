
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const CustomerList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));

        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
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
  }, []);

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
              <strong>Name: {user.name || "Unnamed user"}</strong>
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
