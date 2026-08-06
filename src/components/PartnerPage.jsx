import React from "react";
import { Link } from "react-router-dom";

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
  background: "#2563eb",
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
          "radial-gradient(circle at top, rgba(37, 99, 235, 0.1), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        padding: "48px 20px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
            color: "#fff",
            borderRadius: 24,
            padding: "32px 28px",
            marginBottom: 32,
            boxShadow: "0 16px 36px rgba(37, 99, 235, 0.25)",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            Porch P.O. Box
          </div>
          <h2 style={{ margin: "10px 0 8px", color: "#fff" }}>Become a Partner</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
            Turn your location into a neighborhood package hub — earn monthly
            payouts while helping your community receive packages safely.
          </p>
        </div>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>What it means to be a partner</h3>
          <p style={{ lineHeight: 1.75, margin: "0 0 8px" }}>
            Porch P.O. Box partners are trusted local businesses — shops, stores,
            and other community locations — that securely receive and hold
            packages for our customers. Customers subscribe and use your address
            as their delivery address. When a package arrives, you check it in,
            the customer is notified, and they pick it up at their convenience.
          </p>
          <p style={{ lineHeight: 1.75, margin: 0 }}>
            By becoming a partner, you are also supporting your neighbors who
            want to stop worrying about missed deliveries and stolen packages.
          </p>
        </div>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>What it entails</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Check in packages promptly</strong> so customers are
                notified as soon as a delivery arrives.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Store packages securely</strong> in a safe, dry, indoor
                area that is not accessible to the general public.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Hold packages for up to one month</strong> from the date
                of check-in until customers pick them up.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Respect customer privacy</strong> — never open, inspect,
                photograph, or tamper with packages. They are private property.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Use good judgment</strong> — you may refuse packages that
                appear damaged, leaking, or that you reasonably believe contain
                prohibited or illegal items.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Stay compliant</strong> — maintain appropriate business
                insurance and follow all applicable laws.
              </span>
            </li>
          </ul>
        </div>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>What you need to get started</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>
                A physical business or apartment location where packages can be
                received.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>•</span>
              <span>
                Your business details — name, phone number, email, street
                address, city, state, ZIP code, and store hours.
              </span>
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
          <h3 style={sectionHeadingStyle}>What you get</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Monthly payouts</strong> based on your active subscriber
                count, processed at the end of each month.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>A free listing</strong> on the Porch P.O. Box website so
                customers can find and choose your location.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>More foot traffic</strong> from your neighbors — and a way
                to support your community.
              </span>
            </li>
            <li style={listItemStyle}>
              <span style={markerStyle}>✓</span>
              <span>
                <strong>Rewards for referrals</strong> —{" "}
                <Link to="/referrals">refer another business</Link> that becomes
                a partner and earn a full year of free service.
              </span>
            </li>
          </ul>
        </div>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>How to apply</h3>
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
              <strong>Start receiving packages</strong> — check deliveries in and
              earn payouts every month.
            </li>
          </ol>
          <div style={{ marginTop: 24 }}>
            <Link
              to="/partner/register"
              style={{
                display: "inline-block",
                background: "#f97316",
                color: "#fff",
                padding: "14px 26px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                transition: "transform 0.15s ease, background 0.2s ease",
              }}
            >
              Apply to become a partner →
            </Link>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>Have questions?</h3>
          <p style={{ lineHeight: 1.75, margin: 0 }}>
            We are happy to walk you through the program. Reach us at{" "}
            <a
              href="mailto:contact@porchpobox.com"
              style={{ color: "#2563eb", fontWeight: 600 }}
            >
              contact@porchpobox.com
            </a>{" "}
            or submit a{" "}
            <Link to="/referrals" style={{ color: "#2563eb", fontWeight: 600 }}>
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
