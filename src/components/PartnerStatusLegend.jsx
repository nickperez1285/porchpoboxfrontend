import React from "react";

const legendItems = [
  {
    color: "#d4edda",
    label: "User has a subscription paid and active",
  },
  {
    color: "#fff6bf",
    label: "User is trial period and can receive one free delivery",
  },
  {
    color: "#ffd9d9",
    label:
      "User requires payment to continue receiving deliveries (trial expired or subscription lapsed)",
  },
];

const PartnerStatusLegend = () => {
  return (
    <div
      style={{
        background: "#f8f5ea",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 12,
        padding: "8px 14px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#8a6a00",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        Customer Status Legend
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 500,
              color: "#333",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: item.color,
                border: "2px solid rgba(0, 0, 0, 0.22)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                flexShrink: 0,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerStatusLegend;
