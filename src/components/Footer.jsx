import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {

  return (
    <footer className="mp-footer">
      <div className="mp-footer-container">
        <div className="mp-footer-grid">
          <div className="mp-footer-brand">
            <Link to="/" className="mp-footer-logo">
              <img
                src="/logo.webp"
                alt="Porch P.O. Box"
                width="300"
                height="300"
                loading="lazy"
                decoding="async"
                className="mp-footer-logo-img"
              />
              <span>Porch P.O. Box</span>
            </Link>
            <span>Secure. Local. Convenient.</span>
          </div>

          <div>
            <div className="mp-footer-title">Customers</div>
            <ul className="mp-footer-links">
              <li>
                <Link to="/#locations">Find a Location</Link>
              </li>
              <li>
                <Link to="/how-it-works">How It Works</Link>
              </li>
              <li>
                <Link to="/plans">Pricing</Link>
              </li>
              <li>
                <Link to="/register">Sign Up</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mp-footer-title">Partners</div>
            <ul className="mp-footer-links">
              <li>
                <Link to="/become-a-partner">Become a Partner</Link>
              </li>
              <li>
                <Link to="/partner/login">Partner Login</Link>
              </li>
              <li>
                <Link to="/partner">Partner Portal</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mp-footer-title">Company</div>
            <ul className="mp-footer-links">
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/stop-porch-pirates">Stop Porch Pirates</Link>
              </li>
              <li>
                <Link to="/porch-piracy-report">Porch Piracy Report</Link>
              </li>
              <li>
                <Link to="/porch-safety-score">Porch Safety Score</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/terms">Terms &amp; Policies</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mp-footer-copyright">
          <span>
            &copy; {new Date().getFullYear()} Porch P.O. Box. All rights
            reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
