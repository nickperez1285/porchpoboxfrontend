import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const EditProfile = ({ user, profileData }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user.displayName || profileData?.name || "");
  const [email, setEmail] = useState(user.email || profileData?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phoneNumber || "");
  const [streetAddress, setStreetAddress] = useState(profileData?.streetAddress || "");
  const [city, setCity] = useState(profileData?.city || "");
  const [state, setState] = useState(profileData?.state || "");
  const [zipCode, setZipCode] = useState(profileData?.zipCode || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
      }

      if (name !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      await updateDoc(doc(db, "users", user.uid), {
        name,
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zipCode
      });

      navigate("/profile");
    } catch (submitError) {
      console.error("Error updating user profile:", submitError);
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
      <h2>Edit Profile</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Street Address"
          value={streetAddress}
          onChange={(event) => setStreetAddress(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(event) => setState(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Zip Code"
          value={zipCode}
          onChange={(event) => setZipCode(event.target.value)}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link to="/profile">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
