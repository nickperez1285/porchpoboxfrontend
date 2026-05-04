import React from "react";
import OneTimeProduct from "./OneTimeProduct";

const PlansPage = ({ user }) => {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 180px)",
        background: "radial-gradient(circle at top, rgba(212, 175, 55, 0.16), transparent 32%), linear-gradient(180deg, #f7f3e8 0%, #f4efe3 100%)",
        padding: "48px 20px"
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
            color: "#f5f5f5",
            borderRadius: 24,
            padding: "32px 28px",
            marginBottom: 32,
            boxShadow: "0 16px 36px rgba(0,0,0,0.18)"
          }}
        >
          <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Porch P.O. Box
          </div>
          <h2 style={{ margin: "10px 0 8px" }}>Subscription Plans</h2>
          <p style={{ margin: 0, color: "#d3d3d3", lineHeight: 1.6 }}>
            Choose the plan that fits your delivery needs and start receiving packages today.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)"
          }}
        >
          <OneTimeProduct user={user} />
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
