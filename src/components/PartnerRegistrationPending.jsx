import React from "react";
import { Link } from "react-router-dom";
import { RegPage } from "./RegFormPrimitives";

const PartnerRegistrationPending = () => {
  return (
    <RegPage
      title="Application received"
      subtitle="Your details are on file. We will email you when your partner account has been reviewed."
    >
      <p
        style={{
          textAlign: "center",
          color: "#666",
          lineHeight: 1.6,
          fontSize: 16,
          marginBottom: 32,
        }}
      >
        You can return to partner login anytime. You will not be able to access
        the partner dashboard until your application is approved.
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Link
          to="/partner/login"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "#121212",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Partner login
        </Link>
      </div>
    </RegPage>
  );
};

export default PartnerRegistrationPending;
