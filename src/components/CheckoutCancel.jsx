import React from "react";
import { Link } from "react-router-dom";

const CheckoutCancel = () => (
  <div style={{ maxWidth: 640, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
    <h2>Checkout Canceled</h2>
    <p>Your subscription checkout was canceled. No changes were made to your account.</p>
    <p>
      <Link to="/">Return Home</Link>
    </p>
  </div>
);

export default CheckoutCancel;
