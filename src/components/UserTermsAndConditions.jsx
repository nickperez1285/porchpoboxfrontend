import React from "react";
import { Link } from "react-router-dom";

const UserTermsAndConditions = ({ checked, onChange }) => {
  return (
    <div className="reg-terms-box">
      <h3 className="reg-terms-title">Terms and Conditions</h3>
      <ul className="reg-terms-list">
        <li>You agree to have your packages shipped to a Porch P.O. Box partner store.</li>
        <li>This is a paid service.</li>
        <li>You agree to pay to have your packages kept at the store.</li>
        <li>
          You agree to pick up your packages within one month; after that, the package
          is handled at the store's discretion.
        </li>
        <li>You will not ship illegal items.</li>
        <li>Your membership can be cancelled at any time for any reason.</li>
      </ul>
      <label className="reg-terms-checkbox-row" htmlFor="reg-terms-agree">
        <input
          id="reg-terms-agree"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
        />
        <span>I have read and agree to the Terms and Conditions.</span>
      </label>
      <p className="reg-terms-link-row">
        <Link to="/terms/user">View full Terms and Conditions page</Link>
      </p>
    </div>
  );
};

export default UserTermsAndConditions;
