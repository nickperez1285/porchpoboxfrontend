import React from "react";
import { Link } from "react-router-dom";
import Seo from "./Seo";

const sectionCardStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 20,
  padding: "32px 28px",
  boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
  marginBottom: 24,
  color: "#222",
};

const sectionHeadingStyle = {
  marginTop: 0,
  fontSize: 22,
};

const listStyle = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  lineHeight: 1.75,
};

const listItemStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "10px 0",
  borderBottom: "1px solid #f0f0f0",
};

const markerStyle = {
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#1557d6",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  marginTop: 3,
};

const PartnerPage = () => {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 180px)",
        background:
          "radial-gradient(circle at top, rgba(21, 87, 214, 0.1), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        padding: "48px 20px",
      }}
    >
      <Seo
        title="Become a Package Receiving Partner"
        description="Become a Porch P.O. Box partner and earn money from space you already have by offering secure package receiving to your local community."
        keywords="become a package receiving partner, earn money with package delivery, package pickup business, stop porch pirates, Porch P.O. Box partner"
        path="/become-a-partner"
      />
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <section className="mp-income" aria-labelledby="income-heading">
          {/* <div className="mp-income__eyebrow">Earn Extra Income</div> */}
          <h2 id="income-heading" className="mp-income__title">
            Turn Your Location Into Extra Income.{" "}
          </h2>{" "}
          <h3>
            <strong>Become a PorchPObox Partner</strong>
          </h3>
          <p
            style={{
              margin: 0,
              color: "rgba(60, 16, 16, 0.9)",
              lineHeight: 1.6,
            }}
          >
            Have a business, office, or community location people already trust?
            <br />
            Porch P.O. Box partners provide a secure place for local residents
            to receive and pick up their packages — while earning extra income
            for every customer they serve.
          </p>
          <ul className="mp-income__list">
            <li>Get Paid Monthly </li>
            <li>No lockers or special equipment needed</li>
            <li>No remodeling</li>
            <li>No deliveries to make </li>
            <li>Takes just a few minutes a day</li>
          </ul>
          <Link className="mp-btn mp-btn--primary" to="/become-a-partner">
            Become a Partner
          </Link>
          <br />
          <br />
          <h5>
            It's simple - <br />
            We send you the packages. <br />
            You securely hold them.
            <br />
            Customers pick them up.
            <br />
            <strong>You get paid! </strong>
          </h5>
        </section>

        <section className="mp-earnings" aria-labelledby="earnings-heading">
          <div className="mp-earnings__label">Earn Extra Income</div>
          <h2 id="earnings-heading" className="mp-earnings__title">
            HOW MUCH CAN YOU EARN?
          </h2>
          <p className="mp-earnings__sub">
            You earn $10/person/month for every subscriber that uses your
            location. Here's what that could look like for your location each
            month.
          </p>
          <div className="mp-earnings__grid">
            {[
              { count: "10", amount: "$100", highlight: false },
              { count: "25", amount: "$250", highlight: false },
              { count: "50", amount: "$500", highlight: true },
              { count: "100", amount: "$1,000", highlight: false },
            ].map((tier) => (
              <div
                className={`mp-earnings__tier${
                  tier.highlight ? " mp-earnings__tier--highlight" : ""
                }`}
                key={tier.count}
              >
                <div className="mp-earnings__count">{tier.count}</div>
                <div className="mp-earnings__people">subscribers</div>
                <div className="mp-earnings__amount">{tier.amount}</div>
                <div className="mp-earnings__per">/month</div>
              </div>
            ))}
          </div>
          <br />
          <h4>
            The more customers your location serves, the more you can earn.
          </h4>
        </section>

        <section
          className="mp-partnership"
          aria-labelledby="partnership-heading"
        >
          <div className="mp-partnership__label">Simple & Straightforward</div>
          <h2 id="partnership-heading" className="mp-partnership__title">
            How it Works
          </h2>
          <p className="mp-partnership__sub">
            Getting started as a Porch P.O. Box partner is quick and easy.
          </p>
          <div className="mp-partnership__grid">
            {[
              {
                num: 1,
                icon: "✅",
                title: "Get Approved",
                text: "Tell us about your location and we'll review your application.",
              },
              {
                num: 2,
                icon: "📦",
                title: "Receive Packages",
                text: "Customers use your Porch P.O. Box address when ordering packages.",
              },
              {
                num: 3,
                icon: "🔒",
                title: "Store & Release",
                text: "Securely hold packages until customers come to pick them up.",
              },
              {
                num: 4,
                icon: "💰",
                title: "Get Paid",
                text: "Earn monthly payments based on the customers you serve.",
              },
            ].map((step) => (
              <div className="mp-partnership__step" key={step.num}>
                <div className="mp-partnership__step-num">{step.num}</div>
                <div className="mp-partnership__step-icon" aria-hidden="true">
                  {step.icon}
                </div>
                <h3 className="mp-partnership__step-title">{step.title}</h3>
                <p className="mp-partnership__step-desc">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* <div style={sectionCardStyle}>
          <center>
            <h3 style={sectionHeadingStyle}>What Partners Do</h3>

            <p style={{ lineHeight: 1.75, margin: "0 0 8px" }}>
              Receive, Securely Store, and Release Packages to Authorized
              Customers.
            </p>
          </center>
          <center>
            <h3> Your responsibilities:</h3>
            <p style={{ lineHeight: 1.75, margin: 0 }}>
              ✓ Accept packages addressed to your location
              <br />
              ✓ Store packages
              <br />
              securely until pickup
              <br />
              ✓ Release packages only to the intended
              <br />
              customer ✓ Respect customer privacy
              <br />
              ✓ Notify Porch P.O. Box if there
              <br />
              is a problem
            </p>
          </center>
        </div> */}
        <div style={sectionCardStyle}>
          <center>
            <h2 id="partnership-heading" className="mp-partnership__title">
              What Partners Get
            </h2>
          </center>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              {/* <span style={markerStyle} aria-hidden="true">✓</span> */}
              <span>
                <strong>
                  <span aria-hidden="true">💰</span> Monthly Income
                </strong>{" "}
                Earn recurring income from customers using your location.
              </span>
            </li>
            <li style={listItemStyle}>
              {/* <span style={markerStyle} aria-hidden="true">✓</span> */}
              <span>
                <strong>
                  <span aria-hidden="true">📍</span> Bring More People Through
                  Your Door
                </strong>{" "}
                Become a useful resource for people in your local community.
              </span>
            </li>
            <li style={listItemStyle}>
              {/* <span style={markerStyle} aria-hidden="true">✓</span> */}
              <span>
                <strong>
                  <span aria-hidden="true">📣</span> Free Promotion
                </strong>{" "}
                Get featured on the Porch P.O. Box website and help customers
                find your location.
              </span>
            </li>
            <li style={listItemStyle}>
              {/* <span style={markerStyle} aria-hidden="true">✓</span> */}
              <span>
                <strong>
                  <span aria-hidden="true">🤝</span> Support Your Community
                </strong>{" "}
                Help neighbors receive packages safely and conveniently.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Rewards for referrals</strong> —{" "}
                <Link to="/referrals">refer another business</Link> that becomes
                a partner and earn a full year of free service.
              </span>
            </li>
          </ul>
        </div>

        <div style={sectionCardStyle}>
          <center>
            <h2 id="partnership-heading" className="mp-partnership__title">
              What You Need
            </h2>
          </center>

          <ul style={listStyle}>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>A physical business or apartment/community location</span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span> A secure place to hold packages </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>Reliable hours for customer pickup </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>Your contact and delivery details</span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>
                Agreement to the{" "}
                <Link to="/terms/partner">Partner Terms and Conditions</Link>.
              </span>
            </li>
          </ul>
        </div>
        <div style={sectionCardStyle}>
          <center>
            <h2 id="partnership-heading" className="mp-partnership__title">
              Partnership Responsibilities
            </h2>

            <h6>
              <strong>
                Your role is simple: keep packages safe and make them available
                for pickup.
              </strong>
            </h6>
          </center>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Check in packages promptly</strong> so customers are
                notified as soon as a delivery arrives.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Store packages securely</strong> in a safe, dry, indoor
                area that is not accessible to the general public.
              </span>
            </li>
            {/* <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">✓</span>
              <span>
                <strong>Hold packages for up to one month</strong> from the date
                of check-in until customers pick them up.
              </span>
            </li> */}
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Respect customer privacy</strong> — never open, inspect,
                photograph, or tamper with packages. They are private property.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Use good judgment</strong> — you may refuse packages
                that appear damaged, leaking, or that you reasonably believe
                contain prohibited or illegal items.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle} aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Stay compliant</strong> — maintain appropriate business
                insurance and follow all applicable laws.
              </span>
            </li>
          </ul>
        </div>

        <div style={sectionCardStyle}>
          <center>
            <h2 id="partnership-heading" className="mp-partnership__title">
              Ready to Become a Partner?
            </h2>
          </center>
          <h5>Applying takes just a few minutes.</h5>
          <ol
            style={{
              margin: 0,
              paddingLeft: 20,
              lineHeight: 2,
              fontSize: 15,
            }}
          >
            <li>
              <strong>Submit your application</strong> — tell us about your
              business and location.
            </li>
            <li>
              <strong>We review</strong> your application and reach out to you.
            </li>
            <li>
              <strong>Get approved</strong> — once approved, your location goes
              live on our site.
            </li>
            <li>
              <strong>Start receiving packages</strong> — check deliveries in
            </li>
            <li>
              <strong>Get paid</strong> — earn payouts every month.
            </li>
          </ol>

          <div style={{ marginTop: 24 }}>
            <center>
              <Link
                to="/partner/register"
                style={{
                  display: "inline-block",
                  background: "#1557d6",
                  color: "#fff",
                  padding: "14px 26px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(21, 87, 214, 0.35)",
                  transition: "transform 0.15s ease, background 0.2s ease",
                }}
              >
                Apply to become a partner →
              </Link>
              <br />
              <br />
              <strong>No upfront fee to apply.</strong>
            </center>
          </div>
        </div>

        <section className="mp-faq" aria-labelledby="faq-heading">
          <div className="mp-faq__label">Partner FAQ</div>
          <h2 id="faq-heading" className="mp-faq__title">
            Frequently Asked Questions
          </h2>
          <p className="mp-faq__sub">
            Everything you need to know about becoming a Porch P.O. Box partner.
          </p>
          <div className="mp-faq__grid">
            {[
              {
                q: "How much can I earn?",
                a: "Your earnings depend on the number of active customers assigned to your location.",
              },
              {
                q: "Do I need to deliver packages?",
                a: "No. Packages are delivered to your location; your role is to securely hold them for customer pickup.",
              },
              {
                q: "Do I need special equipment?",
                a: "No. You don't need lockers or special equipment — just a safe, dry, indoor space to hold packages.",
              },
              {
                q: "How much space do I need?",
                a: "Very little. A shelf or small storage area that can hold a few packages is enough to get started.",
              },
              {
                q: "What happens if a package is damaged?",
                a: "If a package arrives visibly damaged or leaking, you may refuse it at delivery. Never open, inspect, or tamper with a customer's package.",
              },
              {
                q: "When do I get paid?",
                a: "Payouts are processed at the end of each month, based on your active subscriber count.",
              },
              {
                q: "Can any business become a partner?",
                a: "Locations are reviewed before approval.",
              },
            ].map((item) => (
              <div className="mp-faq__item" key={item.q}>
                <p className="mp-faq__q">
                  <span className="mp-faq__q-icon">Q.</span>
                  {item.q}
                </p>
                <p className="mp-faq__a">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>Have questions?</h3>
          <p style={{ lineHeight: 1.75, margin: 0 }}>
            We are happy to walk you through the program. Send us a message
            through our contact
            <a href="https://www.porchpobox.com/contact"> contact </a> form or
            submit a{" "}
            <Link to="/referrals" style={{ color: "#1557d6", fontWeight: 600 }}>
              referral
            </Link>{" "}
            and we will get in touch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerPage;
