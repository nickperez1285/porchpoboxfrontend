import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { auth, db } from "../firebase";

const VendorRegister = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
        approved: false,
        status: "pending",
        createdAt: serverTimestamp()
      });

      try {
        await fetch(`${API_BASE_URL}/api/notifications/vendor-registration`, {
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
            zipCode
          })
        });
      } catch (emailError) {
        console.error("Vendor notification email failed:", emailError);
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
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
      <h2>Vendor Registration</h2>
      <form
        onSubmit={handleRegister}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="text"
          placeholder="Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating vendor..." : "Register Vendor"}
        </button>
      </form>
    </div>
  );
};

export default VendorRegister;
