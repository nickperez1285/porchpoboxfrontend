import React from "react";
import { Link } from "react-router-dom";

const UserTermsPage = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <h2>User Terms and Conditions</h2>
      <p>By using Porch P.O. Box services, you agree to the following terms:</p>
      <ol style={{ lineHeight: 1.7 }}>
        <li>You agree to have your packages shipped to a Porch P.O. Box partner store.</li>
        <li>This is a paid service.</li>
        <li>You agree to pay to have your packages kept at the store.</li>
        <li>
          You agree to pick up your packages within one month; after that, the package
          is handled at the store&apos;s discretion.
        </li>
        <li>You will not ship illegal items.</li>
        <li>Your membership can be cancelled at any time for any reason.</li>
      </ol>
      <p style={{ marginTop: 24 }}>
        <Link to="/register">Back to registration</Link>
      </p>
    </div>
  );
};

export default UserTermsPage;
