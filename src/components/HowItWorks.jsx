import React from "react";

const HowItWorks = () => {
  const steps = [
    {
      icon: "🏠",
      title: "Choose a PorchPObox",
      text: "Find a trusted partner location near you — a local business or neighbor that safely receives packages for the community.",
    },
    {
      icon: "📦",
      title: "Ship Packages to Address",
      text: "Use your partner location's address for deliveries.Include ' C/O Porch PO Box' next to your name on the package . Your packages arrive safely at the Porch P.O. Box. ",
    },
    {
      icon: "😊",
      title: "Pick Up Securely",
      text: "Get an email when your package is checked in, then pick it up at your convenience.",
    },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
          color: "#fff",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 32,
          boxShadow: "0 16px 36px rgba(37, 99, 235, 0.25)",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          Porch P.O. Box
        </div>
        <h2 style={{ margin: "10px 0 8px", color: "#fff" }}>How It Works</h2>
        <p
          style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}
        >
          Secure package delivery in three simple steps.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 32,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.title}
            style={{
              position: "relative",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: "28px 22px 24px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 14,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#2563eb",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }}>
              {step.icon}
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1f2937" }}>
              {step.title}
            </h3>
            <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.6 }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          lineHeight: 1.8,
          color: "#1f2937",
        }}
      >
        <h3 style={{ marginTop: 0 }}>What Happens After You Sign Up</h3>
        <p>
          Customers who want to continue using the service can subscribe to any
          one of Porch P.O. Box's monthy plans and use a partner location's
          address as their delivery address. When a package arrives, the partner
          checks it in and you receive an email notification. Pick it up at your
          convenience — no more missed deliveries or porch piracy.
        </p>
      </div>
    </div>
  );
};

export default HowItWorks;
