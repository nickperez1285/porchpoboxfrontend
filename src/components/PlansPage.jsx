import React from "react";
import OneTimeProduct from "./OneTimeProduct";

const PlansPage = ({ user }) => {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 180px)",
        background: "radial-gradient(circle at top, rgba(37, 99, 235, 0.1), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        padding: "48px 20px"
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
            color: "#fff",
            borderRadius: 24,
            padding: "32px 28px",
            marginBottom: 32,
            boxShadow: "0 16px 36px rgba(37, 99, 235, 0.25)"
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Porch P.O. Box
          </div>
          <h2 style={{ margin: "10px 0 8px", color: "#fff" }}>Subscription Plans</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
            Choose the plan that fits your delivery needs and start receiving packages today.
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
            color: "#fff",
            borderRadius: 16,
            padding: "18px 24px",
            marginBottom: 24,
            boxShadow: "0 8px 20px rgba(249, 115, 22, 0.25)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12
          }}
        >
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
              Try Porch P.O. Box for free
            </div>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.55 }}>
              As soon as you sign up, you are eligible to use the service without
              any commitments or payment information required. If you like it, then
              you can subscribe to any one of the affordable monthly plans.
            </p>
          </div>
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
