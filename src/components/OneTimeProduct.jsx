import React, { useEffect, useState } from "react";
import axios from "axios";
import {Link} from  "react-router-dom"
import API_BASE_URL from "../config/api.js";


const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const defaultDescription = " Get unlimited packages for 30 days "

  // useEffect(() => {
  //   const fetchProductDetails = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await axios.get(
  //         `${API_BASE_URL}/api/product-details`
  //       );
  //       const productData = response.data.product
  //         ? [response.data.product]
  //         : [];
  //       setProducts(productData);
  //     } catch (error) {
  //       console.error("Error fetching product details:", error);
  //       setError("Failed to load products. Please try again later.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProductDetails();
  // }, []);

  // const handlePurchase = async (priceId) => {
  //   try {
  //     setIsProcessing(true);
  //     const response = await axios.post(
  //       `${API_BASE_URL}/api/create-checkout-session`,
  //       {
  //         priceId: priceId,
  //       }
  //     );

  //     // Redirect to Stripe Checkout
  //     window.location.href = response.data.url;
  //   } catch (error) {
  //     console.error("Error creating checkout session:", error);
  //     setError("Failed to initiate checkout. Please try again.");
  //     setIsProcessing(false);
  //   }
  // };

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
   <Link to="https://buy.stripe.com/dRm8wQ5obct83Ns8Bx6kg03
"> 
<button type="button"    className="btn btn-dark hover:btn-ouline">
checkout
     </button>
</Link>

  );
};

export default ProductList;
