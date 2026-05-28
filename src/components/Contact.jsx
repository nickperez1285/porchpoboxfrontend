import { useState } from "react";
import { getApiUrl } from "../config/api";
import "./Contact.css";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return;

    setStatus("Sending...");

    const formData = new FormData(form);
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
        form.reset();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="contact-page">
      <form onSubmit={handleSubmit} className="contact-form">
        <h1 className="contact-title">Contact Us</h1>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          className="contact-input"
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className="contact-input"
        />

        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows={5}
          className="contact-input contact-textarea"
        />

        <button type="submit" className="contact-button">
          Send Message
        </button>
        {status && <p className="contact-status">{status}</p>}
      </form>
    </div>
  );
}
