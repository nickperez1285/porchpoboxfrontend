import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getApiUrl } from "../config/api";
import PrefLocationModal from "./PrefLocationModal";

const PLAN_CONFIG = [
  {
    id: "monthly",
    label: "1 Month",
    price: "$20",
    description: "Unlimited packages for 30 days",
  },
  {
    id: "semiannual",
    label: "6 Months",
    price: "$100",
    description: "Pay for 5 months and get a 6 month free",
  },
  {
    id: "yearly",
    label: "1 Year",
    price: "$200",
    description:
      "Pay for 10 months and get 2 months FREE for a full year of  access! ",
  },
];

const ProductList = ({ user }) => {
  const [priceIds, setPriceIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const url = getApiUrl("/api/stripe-config");
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPriceIds(data.priceIds);
      })
      .catch((err) => console.error("[stripe-config] Error:", err));
    return () => { cancelled = true; };
  }, []);

  const plans = useMemo(
    () =>
      PLAN_CONFIG.map((plan) => ({
        ...plan,
        priceId: priceIds?.[plan.id] || "",
      })),
    [priceIds],
  );
  const [selectedPlanId, setSelectedPlanId] = useState("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [error, setError] = useState("");
  const [showPrefModal, setShowPrefModal] = useState(false);

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) || plans[0];

  const startCheckout = async () => {
    if (!user || !selectedPlan) return;

    setLoadingPlanId(selectedPlan.id);
    setError("");

    // Check if user has a preferred location set
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists() || !userSnap.data().prefLocation) {
        setLoadingPlanId("");
        setShowPrefModal(true);
        return;
      }
    } catch (err) {
      console.error("Error checking prefLocation:", err);
    }

    await proceedToCheckout();
  };

  const proceedToCheckout = async () => {
    setLoadingPlanId(selectedPlan.id);
    setError("");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be signed in to checkout.");
      setLoadingPlanId("");
      return;
    }

    if (!selectedPlan?.priceId) {
      setError("Pricing configuration not loaded. Try again.");
      setLoadingPlanId("");
      return;
    }

    try {
      // Use auth.currentUser directly to ensure body and token consistency
      const idToken = await currentUser.getIdToken();
      const response = await fetch(getApiUrl("/api/create-checkout-session"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          isSubscription: true,
          userId: currentUser.uid,
          email: currentUser.email,
        }),
      });

      const responseText = await response.text();
      let payload = null;

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        payload = null;
      }

      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.message || responseText || "Unable to start checkout.",
        );
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      console.error("Error starting checkout:", checkoutError);
      setError(checkoutError.message);
      setLoadingPlanId("");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {showPrefModal && user && (
        <PrefLocationModal
          user={user}
          onDone={() => {
            setShowPrefModal(false);
            proceedToCheckout();
          }}
          required
        />
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              style={{
                textAlign: "left",
                borderRadius: 16,
                border: isSelected ? "2px solid #b88a00" : "1px solid #d8d8d8",
                background: isSelected ? "#f8f1d6" : "#ffffff",
                padding: 18,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#8a6a00",
                }}
              >
                {plan.label}
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                {plan.price}
              </div>
              <div style={{ marginTop: 8, color: "#555", lineHeight: 1.5 }}>
                {plan.description}
              </div>
            </button>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 18,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {user ? (
          <button
            type="button"
            className="btn btn-dark hover:btn-outline"
            onClick={startCheckout}
            disabled={Boolean(loadingPlanId)}
          >
            {loadingPlanId
              ? "Starting sign up..."
              : `Sign Up For ${selectedPlan?.label || "Plan"}`}
          </button>
        ) : (
          <Link to="/login" className="btn btn-dark hover:btn-outline" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            SIGN UP
          </Link>
        )}
        {error && (
          <p
            style={{
              color: "red",
              marginTop: 12,
              maxWidth: 420,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
