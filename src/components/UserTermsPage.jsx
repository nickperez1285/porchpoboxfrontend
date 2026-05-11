import React from "react";
import { Link } from "react-router-dom";

const UserTermsPage = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <h2>User Terms and Conditions</h2>
      <p>By using Porch P.O. Box services, you agree to the following terms:</p>
      <ol style={{ lineHeight: 1.7 }}>
        <li>
          You agree to have your packages shipped to a Porch P.O. Box partner
          store.
        </li>
        <li>This is a paid service.</li>
        <li>You agree to pay to have your packages kept at the store.</li>
        <li>
          You agree to pick up your packages within one month; after that, the
          package is handled at the store&apos;s discretion.
        </li>
        <li>You will not ship illegal items.</li>
        <li>
          You agree that only you will pick up your packages and will present ID
          to verify your identity.
        </li>
        <li>
          You agree that you will not share your login credentials with anyone.
        </li>
        <li>
          You agree that you are responsible for the security of your login
          credentials.
        </li>
        <li>
          You agree that Partners will not release your packages to anyone
          except those with an ID that matched the named recepient on the
          package .
        </li>
        <li>
          You agree that Partners are not obligated to release packages to
          accounts not in good standing{" "}
        </li>
        <li>
          You agree that you are responsible for any activity that occurs under
          your account.
        </li>
        <li>You agree to comply with all applicable laws and regulations.</li>
        <li>
          {" "}
          You argree that your membership can be cancelled at any time for any
          reason.
        </li>
      </ol>
      <p style={{ marginTop: 24 }}>
        <Link to="/register">Back to registration</Link>
      </p>
    </div>
  );
};

export default UserTermsPage;
