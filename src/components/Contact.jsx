import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("Sending...");

    emailjs
      .send(
        "service_eg7azka",
        "template_jd2shuq",
        {
          name: e.target.name.value,
          email: e.target.email.value,
          message: e.target.message.value,
        },
        "Id1MelaGp_AdTTwf7"
      )
      .then(() => {
        setStatus("Message sent successfully!");
        e.target.reset();
      })
      .catch(() => {
        setStatus("Failed to send message. Please try again.");
      });
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
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
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
