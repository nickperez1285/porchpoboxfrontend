import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../config/api";
const SESSION_CHECK_RETRY_MS = 1500;
const SESSION_CHECK_MAX_ATTEMPTS = 3;

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString();
};

const CheckoutSuccess = ({ user, authLoading }) => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying payment...");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const applySubscription = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Missing checkout session.");
        return;
      }

      if (authLoading) {
        return;
      }

      try {
        let session = null;

        for (let attempt = 1; attempt <= SESSION_CHECK_MAX_ATTEMPTS; attempt += 1) {
          const response = await fetch(
            `${API_BASE_URL}/api/checkout-session/${sessionId}`
          );
          const payload = await response.json().catch(() => null);

          if (!response.ok || !payload?.success) {
            throw new Error(payload?.message || "Unable to verify checkout session.");
          }

          session = payload.session;

          const isPaidSession = session.payment_status === "paid";
          const isCompletedSubscription =
            session.mode === "subscription" && session.status === "complete";

          if (isPaidSession || isCompletedSubscription) {
            break;
          }

          if (attempt < SESSION_CHECK_MAX_ATTEMPTS) {
            await new Promise((resolve) => {
              setTimeout(resolve, SESSION_CHECK_RETRY_MS);
            });
          }
        }

        if (!session) {
          throw new Error("Unable to verify checkout session.");
        }

        const isPaidSession = session.payment_status === "paid";
        const isCompletedSubscription =
          session.mode === "subscription" && session.status === "complete";

        if (!isPaidSession && !isCompletedSubscription) {
          throw new Error("Payment has not completed yet.");
        }

        const purchaseDate = new Date(session.created * 1000);
        const endDate = new Date(
          purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)
        );

        setMessage("Thank you. Your payment was successful.");
        setSummary({
          subscribedAt: purchaseDate,
          subscriptionEndsAt: endDate
        });
      } catch (checkoutError) {
        console.error("Error activating subscription:", checkoutError);
        setError(checkoutError.message);
      }
    };

    applySubscription();
  }, [authLoading, searchParams, user]);

  return (
    <div style={{ maxWidth: 640, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <h2>Checkout Success</h2>
      {authLoading && <p>Restoring your session...</p>}
      {error ? <p style={{ color: "red" }}>{error}</p> : <p>{message}</p>}
      {!error && summary && (
        <div
          style={{
            margin: "24px auto",
            maxWidth: 420,
            padding: 24,
            borderRadius: 16,
            border: "1px solid #ddd",
            background: "#faf7ef",
            textAlign: "left"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Payment Summary</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>Status:</strong> Active
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Subscription Starts:</strong> {formatDate(summary.subscribedAt)}
          </div>
          <div>
            <strong>Subscription Ends:</strong> {formatDate(summary.subscriptionEndsAt)}
          </div>
        </div>
      )}
      {!error && summary && (
        <p>Your subscription status is being activated by the backend.</p>
      )}
      <p>
        <Link to="/profile">View Profile</Link>
      </p>
      <p>
        <Link to="/">Return Home</Link>
      </p>
    </div>
  );
};

export default CheckoutSuccess;
