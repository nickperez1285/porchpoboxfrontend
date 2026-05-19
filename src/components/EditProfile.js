import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { RegPage, RegField, RegAlert } from "./RegFormPrimitives";

const EditProfile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        if (profileSnapshot.exists()) {
          setProfileData(profileSnapshot.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user.uid]);

  // Initialize form values once profile data is loaded
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Update form values when profile data loads
  useEffect(() => {
    if (profileData) {
      setName(user.displayName || profileData.name || "");
      setEmail(user.email || profileData.email || "");
      setPhoneNumber(profileData.phoneNumber || "");
      setStreetAddress(profileData.streetAddress || "");
      setCity(profileData.city || "");
      setState(profileData.state || "");
      setZipCode(profileData.zipCode || "");
    }
  }, [profileData, user.displayName, user.email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
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
        nameLower: name.toLowerCase(),
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zipCode,
      });

      navigate("/profile");
    } catch (submitError) {
      console.error("Error updating user profile:", submitError);
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RegPage
      title="Edit Profile"
      subtitle="Update your account information and mailing address."
    >
      {loading ? (
        <p>Loading profile data...</p>
      ) : (
        <form onSubmit={handleSubmit} className="reg-form">
          <RegField
            id="edit-name"
            label="Full Name"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <RegField
            id="edit-email"
            label="Email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <RegField
            id="edit-phone"
            label="Phone Number"
            type="text"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
          />
          <RegField
            id="edit-street"
            label="Street Address"
            type="text"
            placeholder="Street Address"
            value={streetAddress}
            onChange={(event) => setStreetAddress(event.target.value)}
            required
          />
          <RegField
            id="edit-city"
            label="City"
            type="text"
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
          />
          <div className="reg-row-2">
            <RegField
              id="edit-state"
              label="State"
              type="text"
              placeholder="State"
              value={state}
              onChange={(event) => setState(event.target.value.toUpperCase())}
              maxLength={2}
              required
            />
            <RegField
              id="edit-zip"
              label="Zip Code"
              type="text"
              placeholder="Zip Code"
              value={zipCode}
              onChange={(event) =>
                setZipCode(event.target.value.replace(/\D/g, ""))
              }
              maxLength={5}
              required
            />
          </div>

          <RegAlert variant="error">{error}</RegAlert>

          <div className="reg-actions">
            <button type="submit" className="reg-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link to="/profile" className="reg-btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </RegPage>
  );
};

export default EditProfile;
