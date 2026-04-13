import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const VendorProfile = ({ user, vendorProfile }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/vendor");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
      <h2>Vendor Profile</h2>
      <p>
        <strong>Business Name:</strong> {vendorProfile.businessName}
      </p>
      <p>
        <strong>Phone:</strong> {vendorProfile.phoneNumber || "Not provided"}
      </p>
      <p>
        <strong>Street Address:</strong> {vendorProfile.streetAddress || "Not provided"}
      </p>
      <p>
        <strong>City:</strong> {vendorProfile.city || "Not provided"}
      </p>
      <p>
        <strong>State:</strong> {vendorProfile.state || "Not provided"}
      </p>
      <p>
        <strong>Zip Code:</strong> {vendorProfile.zipCode || "Not provided"}
      </p>
      <p>
        <strong>Email:</strong> {user.email || vendorProfile.email}
      </p>
      <p>
        <strong>Vendor ID:</strong> {user.uid}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link to="/vendor">Vendor Portal</Link>
        <Link to="/vendor/profile/edit">Edit Email / Address</Link>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default VendorProfile;
