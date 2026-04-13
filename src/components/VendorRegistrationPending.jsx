import React from "react";
import { Link } from "react-router-dom";

const VendorRegistrationPending = () => {
  return (
    <div style={{ maxWidth: 720, margin: "100px auto", textAlign: "center", padding: "0 20px" }}>
      <h2>Vendor Registration Received</h2>
      <p>Your registration information has been received and your request to become a vendor is being reviewed.</p>
      <p>
        <Link to="/vendor/login">Vendor Login</Link>
      </p>
    </div>
  );
};

export default VendorRegistrationPending;
