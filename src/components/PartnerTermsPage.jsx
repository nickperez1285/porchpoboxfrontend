import React from "react";
import { Link } from "react-router-dom";

const PartnerTermsPage = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <h2>Partner Terms and Conditions</h2>
      <p>By registering as a Porch P.O. Box partner, you agree to the following terms:</p>
      <ol style={{ lineHeight: 1.7 }}>
        <li>
          You agree that customer packages are shipped to your store location as a
          Porch P.O. Box partner.
        </li>
        <li>
          You agree this is a paid service for subscribed customers and that active
          subscribers are eligible for package receiving.
        </li>
        <li>
          You agree to accept packages for any customer who has an active Porch P.O.
          Box subscription.
        </li>
        <li>
          You agree to take responsibility for received packages for up to one month.
        </li>
        <li>You agree to keep packages in a safe, secure area.</li>
        <li>You will not knowingly accept or handle illegal items.</li>
        <li>Your partner membership may be cancelled at any time for any reason.</li>
      </ol>
      <p style={{ marginTop: 24 }}>
        <Link to="/partner/register">Back to partner registration</Link>
      </p>
    </div>
  );
};

export default PartnerTermsPage;
