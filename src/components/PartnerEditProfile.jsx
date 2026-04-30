import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import StoreHoursScrollPicker, {
  DEFAULT_STORE_HOURS
} from "./StoreHoursScrollPicker";
import { RegPage, RegField, RegAlert } from "./RegFormPrimitives";

const PartnerEditProfile = ({ user, partnerProfile }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(user.email || partnerProfile.email || "");
  const [streetAddress, setStreetAddress] = useState(
    partnerProfile.streetAddress || ""
  );
  const [city, setCity] = useState(partnerProfile.city || "");
  const [state, setState] = useState(partnerProfile.state || "");
  const [zipCode, setZipCode] = useState(partnerProfile.zipCode || "");
  const [storeHours, setStoreHours] = useState(
    partnerProfile.storeHours || DEFAULT_STORE_HOURS
  );
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

      await updateDoc(doc(db, "partners", user.uid), {
        email,
        streetAddress,
        city,
        state,
        zipCode,
        storeHours
      });

      setSuccess("Partner profile updated.");
      navigate("/partner/profile");
    } catch (err) {
      console.error("Error updating partner profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegPage
      title="Edit partner profile"
      subtitle="Update your public contact details and store hours."
    >
      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <p className="reg-section-label">Contact</p>
        <RegField
          id="edit-vendor-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <hr className="reg-divider" />
        <p className="reg-section-label">Location</p>
        <RegField
          id="edit-vendor-street"
          label="Street address"
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required
          autoComplete="street-address"
        />
        <RegField
          id="edit-vendor-city"
          label="City"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          autoComplete="address-level2"
        />
        <div className="reg-row-2">
          <RegField
            id="edit-vendor-state"
            label="State"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            autoComplete="address-level1"
          />
          <RegField
            id="edit-vendor-zip"
            label="ZIP code"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
            autoComplete="postal-code"
          />
        </div>

        <StoreHoursScrollPicker value={storeHours} onChange={setStoreHours} />

        <RegAlert variant="error">{error}</RegAlert>
        <RegAlert variant="success">{success}</RegAlert>

        <div className="reg-actions">
          <button type="submit" className="reg-btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </button>
          <Link to="/partner/profile" className="reg-btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </RegPage>
  );
};

export default PartnerEditProfile;
