import React from "react";
import Seo from "./Seo";
import "./InfoPage.css";

const About = () => {
  return (
    <div className="info-page">
      <Seo
        title="About Us"
        description="Porch P.O. Box is a community-based package receiving service that stops porch pirates by connecting customers with trusted local partners for secure package delivery and pickup."
        keywords="about Porch P.O. Box, package receiving service, secure package delivery, stop porch pirates, community package pickup"
        path="/about"
      />
      <div className="info-page__inner">
        <div className="info-hero">
          <div className="info-hero__label">Porch P.O. Box</div>
          <h2 className="info-hero__title">About Us</h2>
          <p className="info-hero__sub">
            A smarter way to receive your packages.
          </p>
        </div>

        <div className="info-card">
          <h3>What We Do</h3>
          <p>
            Porch P.O. Box is a community-based package receiving service that
            connects customers with trusted local businesses, neighbors, and
            other community partners. Instead of worrying about packages sitting
            on your porch or getting stolen, deliveries can be sent to a nearby
            Porch P.O. Box where they will be held safely until they are ready
            to be picked up.
          </p>
        </div>

        <div className="info-features">
          <div className="info-feature">
            <div className="info-feature__icon" aria-hidden="true">🏪</div>
            <h3 className="info-feature__title">Our Partners</h3>
            <p className="info-feature__text">
              Our partners are local community members in your neighborhood who
              have agreed to securely receive and hold packages on your behalf.
              By using Porch P.O. Box, you're also supporting small businesses
              in your community.
            </p>
          </div>

          <div className="info-feature">
            <div className="info-feature__icon" aria-hidden="true">📬</div>
            <h3 className="info-feature__title">Our Mission</h3>
            <p className="info-feature__text">
              We're on a mission to end missed deliveries and porch piracy by
              building a network of trusted, conveniently located drop points in
              every neighborhood.
            </p>
          </div>

          <div className="info-feature">
            <div className="info-feature__icon" aria-hidden="true">✉️</div>
            <h3 className="info-feature__title">Contact Us</h3>
            <p className="info-feature__text">
              Have questions or want to learn more? Reach us at{" "}
              <a href="mailto:contact@porchpobox.com">contact@porchpobox.com</a>
              .
            </p>
          </div>
        </div>

        <div className="info-trust">
          <span><span aria-hidden="true">✓</span> Community focused</span>
          <span><span aria-hidden="true">✓</span> Trusted local partners</span>
          <span><span aria-hidden="true">✓</span> Secure deliveries</span>
        </div>
      </div>
    </div>
  );
};

export default About;
