import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendWelcomeEmail = async ({ name: userName, email: userEmail }) => {
    try {
      const welcomeResponse = await fetch("/api/notifications/user-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail
        })
      });

      if (!welcomeResponse.ok) {
        const errorBody = await welcomeResponse.json().catch(() => null);
        console.error(
          "Welcome email failed:",
          errorBody?.message || `HTTP ${welcomeResponse.status}`
        );
      }
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!termsAccepted) {
      setError("You must agree to the terms and conditions before creating an account.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // User already exists, just navigate
        navigate("/");
        return;
      }

      // Create new user profile with Google information
      const displayName = user.displayName || "";
      const nameParts = displayName.split(" ");
      
      await setDoc(userDocRef, {
        name: displayName,
        email: user.email,
        phoneNumber: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        authProvider: "google",
        status: "inactive",
        subscribedAt: null,
        subscriptionEndsAt: null,
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: "2026-04-28-user-v1",
        createdAt: serverTimestamp()
      });

      await sendWelcomeEmail({
        name: displayName,
        email: user.email
      });

      navigate("/");
    } catch (err) {
      console.error("Google sign-in error:", err);
      
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account with this email already exists. Please use email/password login or a different email.");
      } else {
        setError(err.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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

    if (!termsAccepted) {
      setError("You must agree to the terms and conditions before creating an account.");
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

      await sendWelcomeEmail({
        name,
        email
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
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: "2026-04-28-user-v1",
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
        
        {/* Google Sign-In Option */}
        <div className="reg-google-signin-section" style={{ marginBottom: "20px" }}>
          <label className="reg-terms-checkbox-row" htmlFor="register-terms-agree-google">
            <input
              id="register-terms-agree-google"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <span>I agree to the terms and conditions.</span>
          </label>
          
          <button
            type="button"
            className="reg-btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading || !termsAccepted}
            style={{
              width: "100%",
              padding: "10px 16px",
              marginTop: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #dadce0",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading || !termsAccepted ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading || !termsAccepted ? 0.6 : 1,
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading && termsAccepted) {
                e.target.style.backgroundColor = "#f8f8f8";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ffffff";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <hr style={{ flex: 1 }} />
          <span style={{ color: "#666", fontSize: "14px" }}>or continue with email</span>
          <hr style={{ flex: 1 }} />
        </div>

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
        <p className="reg-hint">
          Review terms: <Link to="/terms/user">User Terms and Conditions</Link>
        </p>
        <label className="reg-terms-checkbox-row" htmlFor="register-terms-agree">
          <input
            id="register-terms-agree"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <span>I agree to the terms and conditions.</span>
        </label>

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
