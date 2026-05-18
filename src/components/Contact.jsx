import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  // Ensure we don't have double slashes if the env var has a trailing one
  const getApiUrl = (path) => {
    const base = process.env.REACT_APP_API_URL || "";
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalizedBase}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      subject: "Contact Form Submission",
    };

    try {
      const response = await fetch(getApiUrl("/api/notifications/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("Message sent successfully!");
        e.currentTarget.reset();
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("Failed to send message. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Contact Us</h1>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          style={styles.input}
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          style={styles.input}
        />

        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows={5}
          style={{ ...styles.input, resize: "vertical" }}
        />

        <button type="submit" style={styles.button}>
          Send Message
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
    // background: "#f5f5f5",
    padding: "1rem",
  },
  form: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    textAlign: "center",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
  },
  status: {
    textAlign: "center",
    fontSize: "0.9rem",
  },
};
