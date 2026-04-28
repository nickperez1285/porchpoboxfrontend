import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { auth, db } from "../firebase";
import {
  isPasswordValid,
  passwordRequirementsText
} from "../utils/passwordValidation";
import StoreHoursScrollPicker, {
  DEFAULT_STORE_HOURS
} from "./StoreHoursScrollPicker";
import { RegPage, RegField, RegAlert } from "./RegFormPrimitives";

const VendorRegister = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [storeHours, setStoreHours] = useState(DEFAULT_STORE_HOURS);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isPasswordValid(password)) {
      setError(passwordRequirementsText);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: businessName
      });

      await setDoc(doc(db, "vendors", user.uid), {
        businessName,
        phoneNumber,
        email,
        streetAddress,
        city,
        state,
        zipCode,
        storeHours,
        approved: false,
        status: "pending",
        createdAt: serverTimestamp()
      });

      try {
        const notificationResponse = await fetch(
          `${API_BASE_URL}/api/notifications/vendor-registration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              business_name: businessName,
              businessName,
              vendor_email: email,
              email,
              phone_number: phoneNumber,
              phoneNumber,
              street_address: streetAddress,
              streetAddress,
              city,
              state,
              zip_code: zipCode,
              zipCode,
              store_hours: storeHours,
              storeHours
            })
          }
        );

        if (!notificationResponse.ok) {
          const errorBody = await notificationResponse.json().catch(() => null);
          throw new Error(
            errorBody?.message || "Partner notification email failed."
          );
        }
      } catch (emailError) {
        console.error("Partner notification email failed:", emailError);
        setError(emailError.message);
        setLoading(false);
        return;
      }

      navigate("/vendor/pending");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegPage
      title="Partner registration"
      subtitle="Tell us about your business. We will review your application before you can sign in."
    >
      <form className="reg-form" onSubmit={handleRegister} noValidate>
        <p className="reg-section-label">Business</p>
        <RegField
          id="vendor-business"
          label="Business name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          autoComplete="organization"
          placeholder="Your business name"
        />
        <RegField
          id="vendor-phone"
          label="Business phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          autoComplete="tel"
          placeholder="(555) 555-0100"
        />
        <RegField
          id="vendor-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="contact@yourbusiness.com"
        />

        <hr className="reg-divider" />
        <p className="reg-section-label">Location</p>
        <RegField
          id="vendor-street"
          label="Street address"
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required
          autoComplete="street-address"
        />
        <RegField
          id="vendor-city"
          label="City"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          autoComplete="address-level2"
        />
        <div className="reg-row-2">
          <RegField
            id="vendor-state"
            label="State"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            autoComplete="address-level1"
            placeholder="ST"
          />
          <RegField
            id="vendor-zip"
            label="ZIP code"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
            autoComplete="postal-code"
          />
        </div>

        <StoreHoursScrollPicker value={storeHours} onChange={setStoreHours} />

        <hr className="reg-divider" />
        <p className="reg-section-label">Password</p>
        <RegField
          id="vendor-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <RegField
          id="vendor-confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <p className="reg-hint">{passwordRequirementsText}</p>

        <RegAlert variant="error">{error}</RegAlert>

        <div className="reg-actions">
          <button type="submit" className="reg-btn-primary" disabled={loading}>
            {loading ? "Creating partner…" : "Submit application"}
          </button>
        </div>
      </form>
    </RegPage>
  );
};

export default VendorRegister;
