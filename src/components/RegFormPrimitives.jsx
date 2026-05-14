import React from "react";

export function RegPage({ title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 540,
          width: "100%",
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          boxShadow: "0 15px 45px rgba(0,0,0,0.06)",
          border: "1px solid #ebebeb",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 14px",
              background: "#fdf8e6",
              color: "#8a6a00",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 12,
            }}
          >
            Porch P.O. Box
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              margin: 0,
              color: "#121212",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                color: "#666",
                fontSize: 15,
                marginTop: 12,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function RegField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  placeholder,
  maxLength,
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 12,
          border: "1px solid #ddd",
          fontSize: 15,
          boxSizing: "border-box",
          outline: "none",
          background: "#fafafa",
          transition: "all 0.2s ease",
        }}
      />
    </div>
  );
}

export function RegAlert({ variant, children }) {
  if (!children) return null;
  const isSuccess = variant === "success";
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: isSuccess ? "#e6f4ea" : "#fff3f3",
        border: `1px solid ${isSuccess ? "#1a7f37" : "#dc3545"}`,
        color: isSuccess ? "#1a7f37" : "#dc3545",
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 24,
        textAlign: "center",
      }}
      role="alert"
    >
      {children}
    </div>
  );
}
