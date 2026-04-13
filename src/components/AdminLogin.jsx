import React from "react";
import { Link } from "react-router-dom";
import Login from "./Login";

const AdminLogin = () => {
  return (
    <div>
      <Login title="Admin Login" redirectTo="/admin" />
      <p style={{ textAlign: "center", marginTop: -60 }}>
        Return to <Link to="/">home</Link>
      </p>
    </div>
  );
};

export default AdminLogin;
