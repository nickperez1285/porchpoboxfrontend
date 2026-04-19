import React, { useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";

const PRICE_ID = "price_1SbpjxILNRQzIFDVtfcg2EHK";

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

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceId: PRICE_ID,
          isSubscription: false,
          userId: user.uid,
          email: user.email
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message || "Unable to start checkout.");
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
            {loading ? "Starting checkout..." : "checkout"}
          </button>
        ) : (
          <Link to="/login">
            <button type="button" className="btn btn-dark hover:btn-ouline">
              checkout
            </button>
          </Link>
        )}
        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
    </center>
  );
};

export default ProductList;
