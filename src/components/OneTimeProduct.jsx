import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";

const PLAN_CONFIG = [
  {
    id: "monthly",
    envVar: "REACT_APP_STRIPE_PRICE_ID_MONTHLY",
    label: "1 Month",
    price: "$20",
    description: "Unlimited packages for 30 days"
  },
  {
    id: "semiannual",
    envVar: "REACT_APP_STRIPE_PRICE_ID_SEMIANNUAL",
    label: "6 Months",
    price: "$100",
    description: "Best value for longer-term package pickup"
  },
  {
    id: "yearly",
    envVar: "REACT_APP_STRIPE_PRICE_ID_YEARLY",
    label: "1 Year",
    price: "$200",
    description: "Full-year access for regular customers"
  }
];

const ProductList = ({ user }) => {
  const plans = useMemo(
    () =>
      PLAN_CONFIG.map((plan) => ({
        ...plan,
        priceId: process.env[plan.envVar]
      })),
    []
  );
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "monthly");
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [error, setError] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];

  const startCheckout = async () => {
    if (!user || !selectedPlan) {
      return;
    }

    setLoadingPlanId(selectedPlan.id);
    setError("");

    if (!selectedPlan.priceId) {
      setError(`Missing ${selectedPlan.envVar} in frontend environment.`);
      setLoadingPlanId("");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
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
      setLoadingPlanId("");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12
        }}
      >
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              style={{
                textAlign: "left",
                borderRadius: 16,
                border: isSelected ? "2px solid #b88a00" : "1px solid #d8d8d8",
                background: isSelected ? "#f8f1d6" : "#ffffff",
                padding: 18,
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#8a6a00"
                }}
              >
                {plan.label}
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                {plan.price}
              </div>
              <div style={{ marginTop: 8, color: "#555", lineHeight: 1.5 }}>
                {plan.description}
              </div>
            </button>
          );
        })}
      </div>
      <center>
        <div style={{ marginTop: 18 }}>
          {user ? (
            <button
              type="button"
              className="btn btn-dark hover:btn-ouline"
              onClick={startCheckout}
              disabled={Boolean(loadingPlanId)}
            >
              {loadingPlanId ? "Starting sign up..." : `Sign Up For ${selectedPlan?.label || "Plan"}`}
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
    </div>
  );
};

export default ProductList;
