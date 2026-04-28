import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  isPasswordValid,
  passwordRequirementsText
} from "../utils/passwordValidation";
import { RegPage, RegField, RegAlert } from "./RegFormPrimitives";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
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
        displayName: name
      });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        phoneNumber: phoneNumber,
        email: email,
        streetAddress: streetAddress,
        city: city,
        state: state,
        zipCode: zipCode,
        status: "inactive",
        subscribedAt: null,
        subscriptionEndsAt: null,
        createdAt: serverTimestamp()
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegPage
      title="Create account"
      subtitle="Join Porch P.O. Box with your contact details and mailing address."
    >
      <form className="reg-form" onSubmit={handleRegister} noValidate>
        <p className="reg-section-label">Account</p>
        <RegField
          id="reg-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <RegField
          id="reg-name"
          label="Full name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Jane Doe"
        />
        <RegField
          id="reg-phone"
          label="Phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          autoComplete="tel"
          placeholder="(555) 555-0100"
        />

        <hr className="reg-divider" />
        <p className="reg-section-label">Mailing address</p>
        <RegField
          id="reg-street"
          label="Street address"
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required
          autoComplete="street-address"
          placeholder="123 Main St"
        />
        <RegField
          id="reg-city"
          label="City"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          autoComplete="address-level2"
          placeholder="City"
        />
        <div className="reg-row-2">
          <RegField
            id="reg-state"
            label="State"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            autoComplete="address-level1"
            placeholder="ST"
          />
          <RegField
            id="reg-zip"
            label="ZIP code"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
            autoComplete="postal-code"
            placeholder="12345"
          />
        </div>

        <hr className="reg-divider" />
        <p className="reg-section-label">Password</p>
        <RegField
          id="reg-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Create a password"
        />
        <RegField
          id="reg-confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Re-enter password"
        />

        <p className="reg-hint">{passwordRequirementsText}</p>

        <RegAlert variant="error">{error}</RegAlert>

        <div className="reg-actions">
          <button type="submit" className="reg-btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>
    </RegPage>
  );
};

export default Register;
