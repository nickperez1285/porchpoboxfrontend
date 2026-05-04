import { useState } from "react";
import API_BASE_URL from "../config/api";

export default function ReferralForm() {
  const [email, setEmail] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Sending...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          additionalInfo
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to send referral.");
      }

      setStatus("Referral submitted successfully.");
      setEmail("");
      setAdditionalInfo("");
    } catch (error) {
      setStatus(error.message || "Failed to send referral.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Referral Form</h1>
        <p style={styles.description}>
          Enter the referral email and any additional information to send it to Porch P.O. Box.
        </p>

        <input
          type="email"
          name="email"
          placeholder="Referral Email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={styles.input}
        />

        <textarea
          name="additionalInfo"
          placeholder="Additional information"
          rows={6}
          value={additionalInfo}
          onChange={(event) => setAdditionalInfo(event.target.value)}
          style={{ ...styles.input, resize: "vertical" }}
        />

        <button type="submit" style={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        {status && <p style={styles.status}>{status}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    background: "black",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem"
  },
  form: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  title: {
    textAlign: "center",
    margin: 0
  },
  description: {
    margin: 0,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 1.5
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer"
  },
  status: {
    textAlign: "center",
    fontSize: "0.9rem",
    margin: 0
  }
};
