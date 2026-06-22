import React, { useState } from "react";
import { apiPost } from "../utils/apiClient";

const sectionStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
};

const labelStyle = {
  fontSize: 12,
  color: "#8a6a00",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
  marginBottom: 14,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 160,
  resize: "vertical",
  fontFamily: "monospace",
};

const btnStyle = {
  padding: "12px 24px",
  background: "#121212",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const btnDisabledStyle = {
  ...btnStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};

const AdminGroupEmail = () => {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !html.trim()) return;

    setSending(true);
    setResult(null);
    try {
      const data = await apiPost("/api/notifications/group-email", {
        subject: subject.trim(),
        html: html.trim(),
      });
      setResult({ type: "success", message: data.message || "Email sent" });
      setSubject("");
      setHtml("");
    } catch (err) {
      setResult({
        type: "error",
        message: err.message || "Failed to send group email",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section style={sectionStyle}>
      <div style={{ marginBottom: 18 }}>
        <div style={labelStyle}>Broadcast</div>
        <h3 style={{ margin: "8px 0 0" }}>Group Email to Partners</h3>
      </div>

      <form onSubmit={handleSend}>
        <div style={labelStyle}>Subject</div>
        <input
          type="text"
          placeholder="e.g. Important update regarding package receiving"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={inputStyle}
          disabled={sending}
        />

        <div style={labelStyle}>Message (HTML)</div>
        <textarea
          placeholder="<p>Write your message here...</p>"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          style={textareaStyle}
          disabled={sending}
        />

        <button
          type="submit"
          disabled={sending || !subject.trim() || !html.trim()}
          style={sending || !subject.trim() || !html.trim() ? btnDisabledStyle : btnStyle}
        >
          {sending ? "Sending..." : "Send to All Approved Partners"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 14,
            background: result.type === "success" ? "#e6f7e6" : "#ffe6e6",
            color: result.type === "success" ? "#1a7d1a" : "#cc0000",
          }}
        >
          {result.message}
        </div>
      )}
    </section>
  );
};

export default AdminGroupEmail;
