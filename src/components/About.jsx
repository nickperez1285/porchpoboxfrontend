import React from "react";

const About = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 32,
          boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            color: "#d4af37",
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          Porch P.O. Box
        </div>
        <h2 style={{ margin: "10px 0 8px" }}>About Us</h2>
        <p style={{ margin: 0, color: "#d3d3d3", lineHeight: 1.6 }}>
          A smarter way to receive your packages.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          lineHeight: 1.8,
          color: "#222",
        }}
      >
        <h3 style={{ marginTop: 0 }}>What We Do</h3>
        <p>
          Porch P.O. Box is a community-based package receiving service that
          connects customers with trusted local businesses. Instead of worrying
          about packages sitting on your porch or getting stolen, you have your
          deliveries sent to a nearby Porch P.O. Box partner location — a local
          business that holds your packages safely until you're ready to pick
          them up.
        </p>

        <h3>How It Works</h3>
        <p>
          Customers subscribe to a Porch P.O. Box plan and use a partner
          location's address as their delivery address. When a package arrives,
          the partner checks it in and you receive an email notification. Pick
          it up at your convenience — no more missed deliveries or porch piracy.
        </p>

        <h3>Our Partners</h3>
        <p>
          Our partners are local businesses in your neighborhood who have agreed
          to securely receive and hold packages on your behalf. By using Porch
          P.O. Box, you're also supporting small businesses in your community.
        </p>

        <h3>Contact Us</h3>
        <p>
          Have questions or want to learn more? Reach us at{" "}
          <a href="mailto:contact@porchpobox.com">contact@porchpobox.com</a>.
        </p>
      </div>
    </div>
  );
};

export default About;
