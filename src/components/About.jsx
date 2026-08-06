import React from "react";

const About = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
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
        <h2 style={{ margin: "10px 0 8px", color: "#fff" }}>About Us</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
          A smarter way to receive your packages.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          lineHeight: 1.8,
          color: "#1f2937",
        }}
      >
        <h3 style={{ marginTop: 0 }}>What We Do</h3>
        <p>
          Porch P.O. Box is a community-based package receiving service that
          connects customers with trusted local businesses , neigbors , and
          other community partners . Instead of worrying about packages sitting
          on your porch or getting stolen, deliveries can be sent to a nearby
          Porch P.O. Box — a local partner that holds packages safely until they
          are ready to be picked up.
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
