import React from "react";

const legendItems = [
  {
    color: "#ffffff",
    label: "Paid up or new users (never used service)"
  },
  {
    color: "#fff6bf",
    label: "Received one package"
  },
  {
    color: "#ffd9d9",
    label: "Not paid up and received more than one package"
  }
];

const PartnerStatusLegend = () => {
  return (
    <div
      style={{
        background: "#f8f5ea",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 18,
        padding: 20,
        marginBottom: 20
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#8a6a00",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 12
        }}
      >
        Customer Status Legend
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: item.color,
                border: "1px solid rgba(0, 0, 0, 0.18)",
                flexShrink: 0
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
