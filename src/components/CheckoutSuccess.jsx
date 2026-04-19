import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { db } from "../firebase";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

const CheckoutSuccess = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying payment...");
  const [error, setError] = useState("");

  useEffect(() => {
    const applySubscription = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Missing checkout session.");
        return;
      }

      if (!user) {
        setError("You must be logged in to activate your subscription.");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/checkout-session/${sessionId}`
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Unable to verify checkout session.");
        }

        const session = payload.session;

        if (session.payment_status !== "paid") {
          throw new Error("Payment has not completed yet.");
        }

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        const currentUserData = userSnapshot.exists() ? userSnapshot.data() : {};

        if (currentUserData.lastCheckoutSessionId === session.id) {
          setMessage("Subscription already activated for this checkout session.");
          return;
        }

        const existingEndDateValue = userSnapshot.exists()
          ? currentUserData.subscriptionEndsAt
          : null;
        const existingEndDate = existingEndDateValue?.toDate
          ? existingEndDateValue.toDate()
          : null;
        const purchaseDate = new Date();
        const extensionBaseDate =
          existingEndDate && existingEndDate.getTime() > Date.now()
            ? existingEndDate
            : purchaseDate;
        const endDate = new Date(extensionBaseDate.getTime() + THIRTY_DAYS_IN_MS);

        await updateDoc(userRef, {
          status: "active",
          subscribedAt: Timestamp.fromDate(purchaseDate),
          subscriptionEndsAt: Timestamp.fromDate(endDate),
          lastCheckoutSessionId: session.id
        });

        setMessage("Subscription activated. Your account is now active.");
      } catch (checkoutError) {
        console.error("Error activating subscription:", checkoutError);
        setError(checkoutError.message);
      }
    };

    applySubscription();
  }, [searchParams, user]);

  return (
    <div style={{ maxWidth: 640, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <h2>Checkout Success</h2>
      {error ? <p style={{ color: "red" }}>{error}</p> : <p>{message}</p>}
      <p>
        <Link to="/">Return Home</Link>
      </p>
    </div>
  );
};

export default CheckoutSuccess;
