import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        if (profileSnapshot.exists()) {
          setProfileData(profileSnapshot.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadProfile();
  }, [user.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <h2>User Profile</h2>
      <p>
        <strong>Name:</strong> {user.displayName || "Not provided"}
      </p>
      <p>
        <strong>Email:</strong> {user.email || "Not available"}
      </p>
      <p>
        <strong>Phone:</strong> {profileData?.phoneNumber || "Not provided"}
      </p>
      <p>
        <strong>Street Address:</strong> {profileData?.streetAddress || "Not provided"}
      </p>
      <p>
        <strong>City:</strong> {profileData?.city || "Not provided"}
      </p>
      <p>
        <strong>State:</strong> {profileData?.state || "Not provided"}
      </p>
      <p>
        <strong>Zip Code:</strong> {profileData?.zipCode || "Not provided"}
      </p>


      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link to="/">Home</Link>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
