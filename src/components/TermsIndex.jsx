import React from "react";
import { Link } from "react-router-dom";

const TermsIndex = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 32,
          boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            color: "#d4af37",
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          Porch P.O. Box
        </div>
        <h2 style={{ margin: "10px 0 8px" }}>Terms &amp; Policies</h2>
        <p style={{ margin: 0, color: "#d3d3d3", lineHeight: 1.6 }}>
          Review the terms and conditions that apply to customers and partners.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            padding: "28px 24px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8a6a00",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Customers
          </div>
          <h3 style={{ margin: "0 0 12px" }}>User Terms &amp; Conditions</h3>
          <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            Terms that apply to customers using the Porch P.O. Box package
            receiving service.
          </p>
          <Link
            to="/terms/user"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#121212",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Read User Terms →
          </Link>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            padding: "28px 24px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8a6a00",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Partners
          </div>
          <h3 style={{ margin: "0 0 12px" }}>Partner Terms &amp; Conditions</h3>
          <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            Terms that apply to local businesses registered as Porch P.O. Box
            partner locations.
          </p>
          <Link
            to="/terms/partner"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#121212",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Read Partner Terms →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsIndex;
