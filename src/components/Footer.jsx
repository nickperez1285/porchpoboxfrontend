import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer style={{ padding: "1.5em", background: "#111", color: "#aaa", fontSize: 14, marginTop: "auto" }}>
    <center>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 20px" }}>
        <Link to="/partner" style={{ color: "#ccc" }}>Partners</Link>
        <Link to="/contact" style={{ color: "#ccc" }}>Contact</Link>
        <Link to="/about" style={{ color: "#ccc" }}>About</Link>
        <Link to="/terms" style={{ color: "#ccc" }}>Terms &amp; Policies</Link>
      </div>
      <div style={{ marginTop: 10, color: "#555", fontSize: 12 }}>
        &copy; {new Date().getFullYear()} Porch P.O. Box
      </div>
    </center>
  </footer>
);

export default Footer;
