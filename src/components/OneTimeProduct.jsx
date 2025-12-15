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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}api/product-details`
        );
        const productData = response.data.product
          ? [response.data.product]
          : [];
        setProducts(productData);
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, []);

  const handlePurchase = async (priceId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/create-checkout-session`,
        {
          priceId: priceId,
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to initiate checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        {loading ? (
          <div className="col-12 text-center">
            <p>Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="col-md-4 mb-4">
              <div
                className="card text-center"
                style={{
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                }}
              >
                
                <div className="card-body">
                  <h5 className="card-title display-6 bg-dark text-white" style = {{backgroundColor:"lightgreen"}} >
                    {product.nickname || "Subscription Plan"}
                  </h5>
                  <p className="card-text lead">
                    {product.description || defaultDescription

                      }
                  </p>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Price: ${(product.unit_amount / 100).toFixed(2)}{" "}
                    {product.currency.toUpperCase()}
                  </h6>
                  <p className="card-text"></p>
                  {/* <button
                    className="btn btn-dark hover:btn-ouline"
                    onClick={() => handlePurchase(product.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Subscribe"}

                  </button> */}
                      <Link to="https://buy.stripe.com/test_7sY4gA8AneBg6ZEdVR6kg00
"> <button type="button"    className="btn btn-dark hover:btn-ouline">
checkout
     </button>
</Link>

                  




                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center">
            <p>No products available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
