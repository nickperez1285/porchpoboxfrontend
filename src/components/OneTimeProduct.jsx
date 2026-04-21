import React, { useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";

const PRICE_ID = process.env.REACT_APP_STRIPE_PRICE_ID;

const ProductList = ({ user }) => {
  const defaultDescription = " Get unlimited packages for 30 days ";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    if (!PRICE_ID) {
      setError("Missing REACT_APP_STRIPE_PRICE_ID in frontend environment.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceId: PRICE_ID,
          isSubscription: true,
          userId: user.uid,
          email: user.email
        })
      });

      const responseText = await response.text();
      let payload = null;

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        payload = null;
      }

      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.message || responseText || "Unable to start checkout."
        );
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      console.error("Error starting checkout:", checkoutError);
      setError(checkoutError.message);
      setLoading(false);
    }
  };

  return (
    <center>
      <div
        style={{
          border: "solid",
          display: "inline-block",
          borderRadius: "1em",
        }}
      >
        <h5>`{defaultDescription}`</h5>
        <br />
        <b>
          <center>
            <h3>$25</h3>
          </center>
        </b>
        {user ? (
          <button
            type="button"
            className="btn btn-dark hover:btn-ouline"
            onClick={startCheckout}
            disabled={loading}
          >
            {loading ? "Starting sign up..." : "sign up"}
          </button>
        ) : (
          <Link to="/login">
            <button type="button" className="btn btn-dark hover:btn-ouline">
              SIGN UP
            </button>
          </Link>
        )}
        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
    </center>
  );
};

export default ProductList;
