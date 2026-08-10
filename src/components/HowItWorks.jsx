import React from "react";
import "./InfoPage.css";

const HowItWorks = () => {
  const steps = [
    {
      icon: "🏠",
      title: "Choose a PorchPObox",
      text: "Select from the list of trusted partner locations near you .",
    },
    {
      icon: "📦",
      title: "Ship Packages to Address",
      text: 'Use your partner location\'s address for deliveries. Include "C/O Porch PO Box" next to your name on the package. Your packages arrive safely at the Porch P.O. Box.',
    },
    {
      icon: "😊",
      title: "Pick Up Securely",
      text: "Get an notification when your package is checked in, then pick it up at your convenience.",
    },
  ];

  return (
    <div className="info-page">
      <div className="info-page__inner">
        <div className="info-hero">
          <div className="info-hero__label">Porch P.O. Box</div>
          <h2 className="info-hero__title">How It Works</h2>
          <p className="info-hero__sub">
            Secure package delivery in three simple steps.
          </p>
        </div>

        <div className="info-steps">
          {steps.map((step, index) => (
            <div className="info-step" key={step.title}>
              <div className="info-step__number">{index + 1}</div>
              <div className="info-step__icon" aria-hidden="true">{step.icon}</div>
              <h3 className="info-step__title">{step.title}</h3>
              <p className="info-step__desc">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="info-card">
          <h3>What Happens After You Sign Up</h3>
          <p>
            Customers who want to continue using the service can subscribe to
            any one of Porch P.O. Box's monthly plans and use a partner
            location's address as their delivery address. When a package
            arrives, the partner checks it in and you receive an email
            notification. Pick it up at your convenience — no more missed
            deliveries or porch piracy.
          </p>
        </div>

        <div className="info-trust">
          <span><span aria-hidden="true">✓</span> Trusted local partners</span>
          <span><span aria-hidden="true">✓</span> Email notifications</span>
          <span><span aria-hidden="true">✓</span> Pick up on your schedule</span>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
