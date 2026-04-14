import React from "react";
import { Link } from "react-router-dom";

const ProductList = () => {
  const defaultDescription = " Get unlimited packages for 30 days ";

  return (
    <center>
      <div
        style={{
          border: "solid",
          display: "inline-block",
          borderRadius: "1em",
        }}
      >
        <h5>`{defaultDescription}`</h5>
        <br />
        <b>
          <center>
            <h3>$25</h3>
          </center>
        </b>
        <Link
          to="https://buy.stripe.com/dRm8wQ5obct83Ns8Bx6kg03
"
        >
          <button type="button" className="btn btn-dark hover:btn-ouline">
            checkout
          </button>
        </Link>
      </div>
    </center>
  );
};

export default ProductList;
