import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const defaultDescription = " Get unlimited packages for 30 days ";

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

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
