import { useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";
import "./ReferralForm.css";

export default function ReferralForm() {
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Sending...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/referral`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            referralCode: referralCode.trim().toUpperCase(),
            additionalInfo,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to send referral.");
      }

      setStatus("Referral submitted successfully.");
      setEmail("");
      setReferralCode("");
      setAdditionalInfo("");
    } catch (error) {
      setStatus(error.message || "Failed to send referral.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="referral-page-wrap">
      <div className="referral-form-container">
        <form onSubmit={handleSubmit} className="referral-form">
          <h1 className="referral-form-title">Referral Form</h1>
          <p className="referral-form-description">
            Enter the email address of your referral and/or add any additional
            information about how to get in contact with the referral. We will
            reach out to them and let them know about our services. Thank you
            for your support!
          </p>
          <p className="referral-code-callout">
            💡 Your personal referral code can be found on your{" "}
            <Link to="/profile" style={{ color: "#8a6a00", fontWeight: 600 }}>
              Profile page
            </Link>
            .
          </p>

          <input
            type="email"
            name="email"
            placeholder="Referral Email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="referral-form-input"
          />

          <div>
            <input
              type="text"
              name="referralCode"
              placeholder="Your Referral Code (e.g. JA120525)"
              value={referralCode}
              onChange={(event) =>
                setReferralCode(event.target.value.toUpperCase())
              }
              maxLength={10}
              className="referral-form-input"
            />
            <p className="referral-input-hint">
              Optional — find your code on your{" "}
              <Link to="/profile" style={{ color: "#8a6a00", fontWeight: 600 }}>
                Profile page
              </Link>
              .
            </p>
          </div>

          <textarea
            name="additionalInfo"
            placeholder="Additional information"
            rows={6}
            value={additionalInfo}
            onChange={(event) => setAdditionalInfo(event.target.value)}
            className="referral-form-input referral-form-textarea"
          />

          <button
            type="submit"
            className="referral-form-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          {status && <p className="referral-form-status">{status}</p>}
        </form>
      </div>
      <footer className="referral-footer">
        <center>
          <Link
            to="/partner"
            style={{
              display: "inline-block",
              paddingRight: 10,
              color: "inherit",
            }}
          >
            Partners
          </Link>
          <Link to="/contact" style={{ color: "inherit" }}>
            Contact
          </Link>
        </center>
      </footer>
    </div>
  );
}
