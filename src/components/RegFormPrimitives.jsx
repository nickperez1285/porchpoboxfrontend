import React from "react";
import "../styles/registrationForm.css";

export function RegPage({ title, subtitle, children }) {
  return (
    <div className="reg-page">
      <div className="reg-card">
        <h1 className="reg-title">{title}</h1>
        {subtitle ? <p className="reg-subtitle">{subtitle}</p> : null}
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
  placeholder
}) {
  return (
    <div className="reg-field">
      <label htmlFor={id} className="reg-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="reg-input"
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </div>
  );
}

export function RegAlert({ variant, children }) {
  if (!children) return null;
  const cls =
    variant === "success"
      ? "reg-alert reg-alert-success"
      : "reg-alert reg-alert-error";
  return (
    <p className={cls} role="alert">
      {children}
    </p>
  );
}
