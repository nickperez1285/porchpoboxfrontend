import React from "react";
import { Link } from "react-router-dom";

const UserTermsPage = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <h2>User Terms and Conditions</h2>
      <p>By using Porch P.O. Box services, you agree to the following terms:</p>
      <ol style={{ lineHeight: 1.9 }}>
        <li>
          You agree to have your packages shipped to a Porch P.O. Box partner store using the exact address provided for your selected location.
        </li>
        <li>
          This is a paid service. A subscription is required to receive packages beyond your free trial delivery.
        </li>
        <li>
          You agree to pick up your packages within one month of check-in. After that period, the package is handled at the partner store's discretion, which may include disposal or donation.
        </li>
        <li>
          You will not ship illegal items, hazardous materials, perishable goods, items requiring refrigeration, or any items prohibited by federal, state, or local law.
        </li>
        <li>
          You agree that packages must be of reasonable size and weight. Partner locations may refuse oversized, unusually heavy, or otherwise impractical packages.
        </li>
        <li>
          Porch P.O. Box and its partner locations are not liable for lost, stolen, or damaged packages once they have been checked in. You are encouraged to use shipping insurance for high-value items.
        </li>
        <li>
          You agree that only you may pick up your packages. Partners may require a valid photo ID matching the name on the package before releasing it.
        </li>
        <li>
          Partners are not obligated to release packages to accounts that are not in good standing or whose subscription has lapsed.
        </li>
        <li>
          You agree not to share your login credentials with anyone. Your account is personal and non-transferable.
        </li>
        <li>
          You are responsible for all activity that occurs under your account.
        </li>
        <li>
          You agree to comply with all applicable laws and regulations when using this service.
        </li>
        <li>
          Your membership may be cancelled at any time for any reason by either you or Porch P.O. Box.
        </li>
      </ol>
      <p style={{ marginTop: 24 }}>
        <Link to="/register">Back to registration</Link>
      </p>
    </div>
  );
};

export default UserTermsPage;
