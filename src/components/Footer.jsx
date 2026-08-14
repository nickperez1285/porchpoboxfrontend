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
            <a
              href="https://www.facebook.com/profile.php?id=61593214381152"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Porch P.O. Box on Facebook"
              className="mp-footer-social"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
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
