import React from "react";
import { Link } from "react-router-dom";
import "./PartnerOnboarding.css";

const STEPS = [
  {
    title: "Understand what partnership means",
    body: [
      "Get more foot traffic! Earn more income ! Absolutely free to join! As a Porch P.O. Box partner You will securely receive and hold customer packages at your business. Customers subscribe with us and use your address as their delivery location. You check packages in when they arrive so customers get notified for pickup.",
    ],
    links: [
      { to: "/terms/partner", label: "Read partner terms →" },
      { to: "/about", label: "How Porch P.O. Box works →" },
    ],
  },
  {
    title: "Register your business",
    body: [
      "Navigate to the 'Partners' link on the bottom of the main page or use the link below to create a partner account with your business name, address, contact information, store hours, and a secure password. Accept the partner terms to submit your application.",
    ],
    links: [
      { to: "/partner/register", label: "Go to partner registration →" },
      { to: "/partner/login", label: "Already registered? Partner login →" },
    ],
  },
  {
    title: "Wait for approval",
    body: [
      "Our team reviews new partner applications. You will see a pending status in the partner portal until your location is approved. We may reach out if we need clarification.",
    ],
    links: [{ to: "/partner", label: "Open partner portal →" }],
  },
  {
    title: "Complete your profile",
    body: [
      "After approval, keep your business details and store hours accurate so customers know when to pick up packages. Update your profile whenever something changes.",
    ],
    links: [{ to: "/partner/profile/edit", label: "Edit partner profile →" }],
  },
  {
    title: "Operate day to day",
    body: [
      "Use package check-in when deliveries arrive, and use the customer list to see who is using your location. Track activity and payouts from your partner dashboard.",
    ],
    links: [
      { to: "/partner/package-check-in", label: "Package check-in →" },
      { to: "/customers", label: "Customer list →" },
      { to: "/partner/activity-log", label: "Activity log →" },
    ],
  },
  {
    title: "Get help when you need it",
    body: [
      "Questions about payouts, a customer issue, or your account? Contact us and we will point you in the right direction.",
    ],
    links: [{ to: "/contact", label: "Contact Porch P.O. Box →" }],
  },
];

const PartnerOnboarding = () => {
  return (
    <div className="partner-onboarding">
      <header className="partner-onboarding__hero">
        <div className="partner-onboarding__eyebrow">Partners</div>
        <h2>Partner onboarding</h2>
        <p className="partner-onboarding__lead">
          Follow these steps to go from interested business to an active Porch
          P.O. Box location. You can return here anytime as a checklist.
        </p>
      </header>

      <section className="partner-onboarding__panel" aria-labelledby="steps-heading">
        <h2 id="steps-heading">Steps for new partners</h2>
        {/* <p className="partner-onboarding__sub">
          Most partners complete registration in one sitting; approval and
          profile polish may take a few days.
        </p> */}

        <ol className="partner-onboarding__steps">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="partner-onboarding__step"
              aria-label={`Step ${i + 1} of ${STEPS.length}: ${step.title}`}
            >
              <span className="partner-onboarding__step-num">{i + 1}</span>
              <div className="partner-onboarding__step-body">
                <h3>{step.title}</h3>
                {step.body.map((paragraph, j) => (
                  <p key={j}>{paragraph}</p>
                ))}
                <div className="partner-onboarding__step-actions">
                  {step.links.map((l) => (
                    <Link key={l.to} className="partner-onboarding__link" to={l.to}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="partner-onboarding__footer-cta">
          <Link className="partner-onboarding__btn" to="/partner/register">
            Start registration
          </Link>
          <Link className="partner-onboarding__btn partner-onboarding__btn--secondary" to="/">
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PartnerOnboarding;
