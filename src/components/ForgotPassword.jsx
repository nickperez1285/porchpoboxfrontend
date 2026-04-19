import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "A password reset link has been sent to the email on file if that account exists."
      );
    } catch (resetError) {
      console.error("Error sending password reset email:", resetError);
      setError(resetError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "100px auto", textAlign: "center" }}>
      <h2>Forgot Password</h2>
      <p>Enter your email address and we will send you a link to create a new password.</p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
