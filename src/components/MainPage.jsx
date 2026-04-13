import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import OneTimeProduct from "./OneTimeProduct";
import API_BASE_URL from "../config/api";
import { db } from "../firebase";

const MainPage = () => {
  const [plans, setPlans] = useState({});
  const [activePlan, setActivePlan] = useState("");
  const [originalPrices, setOriginalPrices] = useState({});
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [couponLoading, setCouponLoading] = useState({});
  const [purchaseType, setPurchaseType] = useState("subscription");
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");

  useEffect(() => {
    fetchPrices();
    fetchActiveVendors();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-all-prices`);
      const data = await response.json();

      if (data.success && data.prices) {
        setPlans(data.prices);
        setActivePlan(data.activePlan);

        const fetchedPrices = {};
        const fetchedOriginalPrices = {};

        for (const plan of Object.keys(data.prices)) {
          try {
            const planPriceResponse = await fetch(
              `${API_BASE_URL}/api/get-price/${data.prices[plan]}`
            );
            const planPriceData = await planPriceResponse.json();

            if (planPriceData.success && planPriceData.price?.unit_amount) {
              const price = (planPriceData.price.unit_amount / 100).toFixed(2);
              fetchedPrices[plan] = {
                original: price,
                discounted: null,
              };
              fetchedOriginalPrices[plan] = parseFloat(price) || 0;
            } else {
              fetchedPrices[plan] = {
                original: "0.00",
                discounted: null,
              };
              fetchedOriginalPrices[plan] = 0;
              console.error(
                `Failed to fetch price for plan ${plan}:`,
                planPriceData.message
              );
            }
          } catch (error) {
            fetchedPrices[plan] = {
              original: "0.00",
              discounted: null,
            };
            fetchedOriginalPrices[plan] = 0;
            console.error(`Error fetching price for plan ${plan}:`, error);
          }
        }

        setPrices(fetchedPrices);
        setOriginalPrices(fetchedOriginalPrices);
      } else {
        console.error("Failed to fetch price data:", data.message);
        // Set default values if fetch fails
        const defaultPrices = {};
        const defaultOriginalPrices = {};
        ["starter", "pro", "premium", "extreme"].forEach((plan) => {
          defaultPrices[plan] = {
            original: "0.00",
            discounted: null,
          };
          defaultOriginalPrices[plan] = 0;
        });
        setPrices(defaultPrices);
        setOriginalPrices(defaultOriginalPrices);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      // Set default values if fetch fails
      const defaultPrices = {};
      const defaultOriginalPrices = {};
      ["starter", "pro", "premium", "extreme"].forEach((plan) => {
        defaultPrices[plan] = {
          original: "0.00",
          discounted: null,
        };
        defaultOriginalPrices[plan] = 0;
      });
      setPrices(defaultPrices);
      setOriginalPrices(defaultOriginalPrices);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (planType) => {
    const couponCode = document
      .getElementById(`coupon-${planType}`)
      ?.value?.trim();
    if (!couponCode) {
      alert("Please enter a coupon code.");
      return;
    }
    setCouponLoading((prev) => ({ ...prev, [planType]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/validate-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupon: couponCode,
          planType: planType,
          priceId: plans[planType],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.coupon) {
        const originalPrice = originalPrices[planType] || 0;
        let discountedPrice = originalPrice;

        if (data.coupon.percent_off) {
          discountedPrice =
            originalPrice * (1 - (data.coupon.percent_off || 0) / 100);
        } else if (data.coupon.amount_off) {
          discountedPrice = Math.max(
            0,
            originalPrice - (data.coupon.amount_off || 0) / 100
          );
        }

        setPrices((prevPrices) => ({
          ...prevPrices,
          [planType]: {
            original: originalPrice.toFixed(2),
            discounted: discountedPrice.toFixed(2),
          },
        }));

        alert(
          `Coupon applied! ${data.coupon.percent_off
            ? `${data.coupon.percent_off}% off`
            : `$${((data.coupon.amount_off || 0) / 100).toFixed(2)} off`
          }`
        );
      } else {
        // Reset to original price
        const originalPrice = originalPrices[planType] || 0;
        setPrices((prevPrices) => ({
          ...prevPrices,
          [planType]: {
            original: originalPrice.toFixed(2),
            discounted: null,
          },
        }));
        alert(data.message || "Invalid coupon code.");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      alert("Error validating coupon. Please try again later.");
      // Reset price on error
      const originalPrice = originalPrices[planType] || 0;
      setPrices((prevPrices) => ({
        ...prevPrices,
        [planType]: {
          original: originalPrice.toFixed(2),
          discounted: null,
        },
      }));
    } finally {
      setCouponLoading((prev) => ({ ...prev, [planType]: false }));
    }
  };

  const handleSubscribe = async (planType) => {
    const priceId = plans[planType];
    const couponCode =
      document.getElementById(`coupon-${planType}`)?.value || "";

    const isSubscription = true;
    await redirectToCheckout(priceId, isSubscription, couponCode);
  };

  const handleOneTimePurchase = async (planType) => {
    const priceId = plans[planType];
    const couponCode =
      document.getElementById(`coupon-${planType}`)?.value || "";
    const isSubscription = false;
    await redirectToCheckout(priceId, isSubscription, couponCode);
  };

  const redirectToCheckout = async (priceId, isSubscription, coupon) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priceId, isSubscription, coupon }),
        }
      );
      const data = await response.json();

      if (data.success) {
        window.location.href = data.url; // Redirect to Stripe checkout
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
    }
  };

  const fetchActiveVendors = async () => {
    setVendorsLoading(true);
    setVendorsError("");
    try {
      const vendorSnapshot = await getDocs(
        query(collection(db, "vendors"), where("approved", "==", true))
      );
      setActiveVendors(
        vendorSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
      );
    } catch (error) {
      console.error("Error loading active vendors:", error);
      setActiveVendors([]);
      setVendorsError(
        error?.message || "Unable to load active vendors."
      );
    } finally {
      setVendorsLoading(false);
    }
  };

  return (
    <div style={{ heigbt: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "85vh",
        }}
      >
        <hr></hr>
        {/* <div className="pricing-header p-3 pb-md-4 mx-auto text-center"> */}
        {/* <u><h1 className="display-5 fw-bold">Porch P.O. Box </h1></u> */}
        {/* <Link to="/customers">view customers </Link><br></br> */}
        {/* <header> */}
        <h3 style={{ color: "gold" }}>Welcome to Porch P.O. Box </h3>
        {/* </header> */}

        <p className="text-muted text-wrap">{/*etgagasfdsads */}</p>
        {/* </div> */}

        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: "1 1 320px",
              minWidth: 280,
              maxWidth: 420,
              maxHeight: 420,
              overflowY: "auto",
              background: "#111",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 20,
              color: "#f5f5f5",
            }}
          >
            <center><h4 style={{ marginTop: 0, color: "gold" }}>Porch P.O. Boxes</h4></center>
            {vendorsLoading ? (
              <p>Loading vendors...</p>
            ) : vendorsError ? (
              <p>{vendorsError}</p>
            ) : activeVendors.length === 0 ? (
              <p>No active vendors listed yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {activeVendors.map((vendor) => (
                  <li
                    key={vendor.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid #2c2c2c",
                    }}
                  >
                    <strong>{vendor.businessName || "Unnamed vendor"}</strong>
                    <div>
                      {vendor.streetAddress || "No street address"}
                      {vendor.city ? `, ${vendor.city}` : ""}
                      {vendor.state ? `, ${vendor.state}` : ""}
                      {vendor.zipCode ? ` ${vendor.zipCode}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ flex: "1 1 520px", minWidth: 320, maxWidth: 720 }}>
            <OneTimeProduct />
          </div>
        </div>
        <br />
      </div>
      <footer style={{ padding: '1em', background: "black" }}>
        <center>
          <Link
            to="/vendor"
            style={{ display: "inline-block", paddingRight: 10 }}
          >
            Vendors
          </Link>
          <></>
          <Link to="/contact">Contact </Link>
        </center>
      </footer>
    </div>
  );
};

export default MainPage;
