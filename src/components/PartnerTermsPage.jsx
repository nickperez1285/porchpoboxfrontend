import React from "react";
import { Link } from "react-router-dom";

const PartnerTermsPage = () => {
  return (
    <div style={{ maxWidth: 860, margin: "60px auto", padding: "0 20px" }}>
      <h2>Partner Terms and Conditions</h2>
      <p>
        By registering as a Porch P.O. Box partner, you agree to the following terms:
      </p>
      <ol style={{ lineHeight: 1.9 }}>
        <li>
          You agree to accept customer packages shipped to your store location as a Porch P.O. Box partner.
        </li>
        <li>
          You agree to have your business or apartment location listed publicly on the Porch P.O. Box website for customers to view and select as a package delivery location.
        </li>
        <li>
          You agree this is a paid service for subscribed customers and that only active subscribers are eligible for package receiving.
        </li>
        <li>
          You agree to accept packages for any customer who has an active Porch P.O. Box subscription and to check them in promptly so customers are notified without unnecessary delay.
        </li>
        <li>
          You agree to take responsibility for received packages for up to one month from the date of check-in.
        </li>
        <li>
          You agree to store all packages in a safe, secure, dry, indoor area that is not accessible to the general public.
        </li>
        <li>
          You agree not to open, inspect the contents of, photograph, or tamper with any customer package. Customer packages must be treated as private property.
        </li>
        <li>
          You may refuse to accept packages that appear visibly damaged, leaking, emit unusual odors, or that you have reasonable cause to believe contain prohibited or illegal items.
        </li>
        <li>
          You will not knowingly accept or handle illegal items, hazardous materials, or any items prohibited by federal, state, or local law.
        </li>
        <li>
          You acknowledge the compensation structure communicated by Porch P.O. Box and agree to the applicable payment terms for your participation as a partner location.
        </li>
        <li>
          You acknowledge that you are responsible for packages in your care and agree to maintain appropriate business insurance coverage for your location.
        </li>
        <li>
          You agree to comply with all applicable laws and regulations in the operation of your business and your role as a Porch P.O. Box partner.
        </li>
        <li>
          Your partner membership may be cancelled at any time for any reason by either you or Porch P.O. Box.
        </li>
      </ol>
      <p style={{ marginTop: 24 }}>
        <Link to="/partner/register">Back to partner registration</Link>
      </p>
    </div>
  );
};

export default PartnerTermsPage;
