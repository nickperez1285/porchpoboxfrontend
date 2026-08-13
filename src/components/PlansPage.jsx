import React from "react";
import OneTimeProduct from "./OneTimeProduct";
import Seo from "./Seo";
import "./PlansPage.css";

const PlansPage = ({ user }) => {
  return (
    <div className="plans-page">
      <Seo
        title="Plans & Pricing"
        description="Choose an affordable Porch P.O. Box package receiving plan that fits your delivery needs and stop porch pirates today."
        keywords="package receiving plans, package delivery pricing, secure package delivery, monthly package receiving, Porch P.O. Box"
        path="/plans"
      />
      <div className="plans-page__inner">
        <div className="plans-hero">
          <div className="plans-hero__label">Porch P.O. Box</div>
          <h2 className="plans-hero__title">Subscription Plans</h2>
          <p className="plans-hero__sub">
            Choose the plan that fits your delivery needs and start receiving
            packages today.
          </p>
        </div>

        <div className="plans-free">
          <div className="plans-free__icon" aria-hidden="true">🎁</div>
          <div>
            <div className="plans-free__title">Try Porch P.O. Box for Free</div>
            <p className="plans-free__text">
              Sign up and start using Porch P.O. Box today.
              <strong> No payment information. No commitments.</strong> When
              you're ready, choose an affordable monthly plan.
            </p>
          </div>
        </div>

        <div className="plans-card">
          <OneTimeProduct user={user} />
        </div>

        <div className="plans-trust">
          <span><span aria-hidden="true">✓</span> Cancel anytime</span>
          <span><span aria-hidden="true">✓</span> No hidden fees</span>
          <span><span aria-hidden="true">✓</span> Trusted local locations</span>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
