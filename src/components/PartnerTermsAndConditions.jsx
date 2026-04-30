import React from "react";
import { Link } from "react-router-dom";

const PartnerTermsAndConditions = ({ checked, onChange }) => {
  return (
    <div className="reg-terms-box">
      <h3 className="reg-terms-title">Partner Terms and Conditions</h3>
      <ul className="reg-terms-list">
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
      </ul>
      <label className="reg-terms-checkbox-row" htmlFor="partner-terms-agree">
        <input
          id="partner-terms-agree"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
        />
        <span>I have read and agree to the Partner Terms and Conditions.</span>
      </label>
      <p className="reg-terms-link-row">
        <Link to="/terms/partner">View full Partner Terms and Conditions page</Link>
      </p>
    </div>
  );
};

export default PartnerTermsAndConditions;
