import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const VendorEditProfile = ({ user, vendorProfile }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(user.email || vendorProfile.email || "");
  const [streetAddress, setStreetAddress] = useState(vendorProfile.streetAddress || "");
  const [city, setCity] = useState(vendorProfile.city || "");
  const [state, setState] = useState(vendorProfile.state || "");
  const [zipCode, setZipCode] = useState(vendorProfile.zipCode || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
      }

      await updateDoc(doc(db, "vendors", user.uid), {
        email,
        streetAddress,
        city,
        state,
        zipCode
      });

      setSuccess("Vendor profile updated.");
      navigate("/vendor/profile");
    } catch (err) {
      console.error("Error updating vendor profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
      <h2>Edit Vendor Profile</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Street Address"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Zip Code"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          required
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link to="/vendor/profile">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default VendorEditProfile;
