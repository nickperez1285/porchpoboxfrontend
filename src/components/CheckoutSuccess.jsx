import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

const SESSION_CHECK_RETRY_MS = 1500;
const SESSION_CHECK_MAX_ATTEMPTS = 3;

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const CheckoutSuccess = ({ user, authLoading }) => {
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const applySubscription = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) { setError("Missing checkout session."); setStage("error"); return; }
      if (authLoading || !user) return;

      try {
        let session = null;
        for (let attempt = 1; attempt <= SESSION_CHECK_MAX_ATTEMPTS; attempt += 1) {
          const response = await fetch(`${API_BASE_URL}/api/checkout-session/${sessionId}`);
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.success) throw new Error(payload?.message || "Unable to verify checkout session.");
          session = payload.session;
          const isPaid = session.payment_status === "paid";
          const isComplete = session.mode === "subscription" && session.status === "complete";
          if (isPaid || isComplete) break;
          if (attempt < SESSION_CHECK_MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, SESSION_CHECK_RETRY_MS));
        }

        if (!session) throw new Error("Unable to verify checkout session.");
        const isPaid = session.payment_status === "paid";
        const isComplete = session.mode === "subscription" && session.status === "complete";
        if (!isPaid && !isComplete) throw new Error("Payment has not completed yet.");

        const finalizeResponse = await fetch(`${API_BASE_URL}/api/finalize-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, userId: user.uid })
        });
        const finalizePayload = await finalizeResponse.json().catch(() => null);
        if (!finalizeResponse.ok || !finalizePayload?.success) throw new Error(finalizePayload?.message || "Unable to activate subscription.");

        setSummary({ subscribedAt: finalizePayload.subscribedAt, subscriptionEndsAt: finalizePayload.subscriptionEndsAt });
        setStage("success");
      } catch (err) {
        console.error("Error activating subscription:", err);
        setError(err.message);
        setStage("error");
      }
    };

    applySubscription();
  }, [authLoading, searchParams, user]);

  if (stage === "loading" || authLoading) {
    return (
      <div style={{ maxWidth: 480, margin: "120px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: "#333" }}>Verifying your payment...</h2>
        <p style={{ color: "#888" }}>Please wait while we confirm your subscription.</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div style={{ maxWidth: 480, margin: "120px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "#333" }}>Something went wrong</h2>
        <p style={{ color: "#dc3545", background: "#fff3f3", border: "1px solid #f5c6cb", borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
          {error}
        </p>
        <p style={{ color: "#666", fontSize: 14 }}>If you were charged, please contact us at <a href="mailto:contact@porchpobox.com">contact@porchpobox.com</a> and we'll sort it out.</p>
        <Link to="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#121212", color: "#fff", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

        {/* Celebration header */}
        <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 12, color: "#8a6a00", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>
          Subscription Confirmed
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#121212" }}>
          You're all set{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
        </h1>
        <p style={{ color: "#555", lineHeight: 1.7, fontSize: 16, marginBottom: 28 }}>
          Your Porch P.O. Box subscription is now active. Start having packages delivered to your preferred partner location today.
        </p>

        {/* Summary card */}
        {summary && (
          <div style={{
            background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
            borderRadius: 20,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
            textAlign: "left",
            color: "#f5f5f5"
          }}>
            <div style={{ fontSize: 12, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>
              📋 Subscription Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Status</div>
                <div style={{ fontWeight: 700, color: "#28a745", fontSize: 16 }}>✓ Active</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Started</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{formatDate(summary.subscribedAt)}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Valid Through</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{formatDate(summary.subscriptionEndsAt)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Next steps */}
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "20px 24px", marginBottom: 28, textAlign: "left", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>What's Next</div>
          {[
            { icon: "📍", text: "Make sure your preferred partner location is set in your profile." },
            { icon: "📦", text: "Use your partner location's address when placing orders online." },
            { icon: "🔔", text: "You'll receive an email notification as soon as a package is checked in for you." },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 12 : 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
              <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/profile"
            style={{ padding: "12px 28px", background: "#121212", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none" }}
          >
            View My Profile
          </Link>
          <Link
            to="/"
            style={{ padding: "12px 28px", background: "#f5f5f5", color: "#333", borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: "none", border: "1px solid #ddd" }}
          >
            Return Home
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: "#aaa" }}>
          A confirmation email has been sent to {user?.email || "your email address"}.
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
