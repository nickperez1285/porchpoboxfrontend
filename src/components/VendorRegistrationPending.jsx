import React from "react";
import { Link } from "react-router-dom";
import { RegPage } from "./RegFormPrimitives";

const VendorRegistrationPending = () => {
  return (
    <RegPage
      title="Application received"
      subtitle="Your details are on file. We will email you when your partner account has been reviewed."
    >
      <p className="reg-body-centered">
        You can return to partner login anytime. You will not be able to access the partner
        dashboard until your application is approved.
      </p>
      <div className="reg-actions">
        <Link to="/vendor/login" className="reg-btn-primary">
          Partner login
        </Link>
      </div>
    </RegPage>
  );
};

export default VendorRegistrationPending;
