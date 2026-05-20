import React from "react";
import "./RegForm.css";

export function RegPage({ title, subtitle, children }) {
  return (
    <div className="reg-page-container">
      <div className="reg-card">
        <div className="reg-header">
          <div className="reg-brand-badge">Porch P.O. Box</div>
          <h1 className="reg-title">{title}</h1>
          {subtitle && <p className="reg-subtitle">{subtitle}</p>}
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
    <div className="reg-field-container">
      <label htmlFor={id} className="reg-field-label">
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
        className="reg-field-input"
      />
    </div>
  );
}

export function RegAlert({ variant, children }) {
  if (!children) return null;
  return (
    <div className={`reg-alert reg-alert--${variant}`} role="alert">
      {children}
    </div>
  );
}
