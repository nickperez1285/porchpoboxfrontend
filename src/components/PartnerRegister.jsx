import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  isPasswordValid,
  passwordRequirementsText,
} from "../utils/passwordValidation";
import StoreHoursScrollPicker, {
  DEFAULT_STORE_HOURS,
} from "./StoreHoursScrollPicker";
import { RegPage, RegField, RegAlert } from "./RegFormPrimitives";

const PartnerRegister = () => {
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [wasReferred, setWasReferred] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address.";
    if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, "")))
      return "Phone number must have 10 digits.";
    if (!/^[A-Za-z]{2}$/.test(state.trim()))
      return "State must be a 2-letter abbreviation (e.g. CA).";
    if (!/^\d{5}$/.test(zipCode.trim()))
      return "ZIP code must be exactly 5 digits.";
    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

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

    if (!termsAccepted) {
      setError(
        "You must agree to the terms and conditions before creating an account.",
      );
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: businessName,
      });

      await setDoc(doc(db, "partners", user.uid), {
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
        referredBy:
          wasReferred === "yes" ? referralCode.trim().toUpperCase() : "",
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: "2026-04-28-partner-v1",
        createdAt: serverTimestamp(),
      });

      try {
        const idToken = await user.getIdToken();
        const notificationResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/notifications/vendor-registration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              businessName,
              email,
              phoneNumber,
              streetAddress,
              city,
              state,
              zipCode,
            }),
          },
        );

        if (!notificationResponse.ok) {
          const errorBody = await notificationResponse.json().catch(() => null);
          throw new Error(
            errorBody?.message || "Partner notification email failed.",
          );
        }
      } catch (emailError) {
        console.error("Partner notification email failed:", emailError);
        setError(emailError.message);
        setLoading(false);
        return;
      }

      navigate("/partner/pending");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegPage
      title="Become a partner"
      subtitle="Tell us about your business. We will review your application before you can sign in."
    >
      <form className="reg-form" onSubmit={handleRegister} noValidate>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#d4af37",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 16,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 8,
          }}
        >
          Business Details
        </div>
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

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#d4af37",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginTop: 32,
            marginBottom: 16,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 8,
          }}
        >
          Physical Location
        </div>
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
            onChange={(e) => setState(e.target.value.toUpperCase())}
            required
            autoComplete="address-level1"
            placeholder="ST"
            maxLength={2}
          />
          <RegField
            id="vendor-zip"
            label="ZIP code"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
            required
            autoComplete="postal-code"
            maxLength={5}
          />
        </div>

        <StoreHoursScrollPicker value={storeHours} onChange={setStoreHours} />

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#d4af37",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginTop: 32,
            marginBottom: 16,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 8,
          }}
        >
          Referral Info
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <label style={{ fontSize: 14, color: "#444" }}>
            Were you referred by someone?
          </label>
          <div style={{ display: "flex", gap: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <input
                type="radio"
                name="wasReferred"
                value="yes"
                checked={wasReferred === "yes"}
                onChange={() => setWasReferred("yes")}
              />
              Yes
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <input
                type="radio"
                name="wasReferred"
                value="no"
                checked={wasReferred === "no"}
                onChange={() => {
                  setWasReferred("no");
                  setReferralCode("");
                }}
              />
              No
            </label>
          </div>
          {wasReferred === "yes" && (
            <RegField
              id="referral-code"
              label="Referral Code"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. JA120525"
              autoComplete="off"
              maxLength={10}
            />
          )}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#d4af37",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginTop: 32,
            marginBottom: 16,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 8,
          }}
        >
          Security
        </div>
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

        <p
          style={{
            fontSize: 12,
            color: "#888",
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {passwordRequirementsText}
        </p>
        <p style={{ fontSize: 13, marginBottom: 16 }}>
          Review terms:{" "}
          <Link to="/terms/partner">Partner Terms and Conditions</Link>
        </p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 24,
          }}
          htmlFor="vendor-register-terms-agree"
        >
          <input
            id="vendor-register-terms-agree"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <span>I agree to the terms and conditions.</span>
        </label>

        <RegAlert variant="error">{error}</RegAlert>

        <div className="reg-actions">
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: "#121212",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "transform 0.1s",
            }}
          >
            {loading ? "Creating partner…" : "Submit application"}
          </button>
        </div>
      </form>
    </RegPage>
  );
};

export default PartnerRegister;
