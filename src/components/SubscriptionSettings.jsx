import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getApiUrl } from "../config/api";
import { auth, db } from "../firebase";
import PrefLocationModal from "./PrefLocationModal";
import "./SubscriptionSettings.css";

const PLAN_CONFIG = [
  {
    id: "monthly",
    label: "1 Month",
    price: "$20",
    description: "Monthly unlimited package receiving",
  },
  {
    id: "semiannual",
    label: "6 Months",
    price: "$100",
    description: "Longer coverage with one month included",
  },
  {
    id: "yearly",
    label: "1 Year",
    price: "$200",
    description: "Best value for year-round deliveries",
  },
];

const readResponse = async (response) => {
  const responseText = await response.text();
  try {
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    return { message: responseText };
  }
};

const SubscriptionSettings = ({ user, profileData }) => {
  const [priceIds, setPriceIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const url = getApiUrl("/api/stripe-config");
    console.log("[stripe-config] Fetching from:", url);
    fetch(url)
      .then((r) => {
        console.log("[stripe-config] Response status:", r.status);
        return r.json();
      })
      .then((data) => {
        console.log("[stripe-config] Data received:", data);
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
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("yearly");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  const cancelAtPeriodEnd = profileData?.subscriptionCancelAtPeriodEnd === true;
  const hasStripeSubscription = Boolean(profileData?.stripeSubscriptionId);
  const renewalLabel = hasStripeSubscription
    ? cancelAtPeriodEnd
      ? "Cancels at period end"
      : "Auto-renewing"
    : "Ready to subscribe";

  const getCurrentUser = () => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error("You must be signed in to manage your subscription.");
    }
    return currentUser;
  };

  const validatePromoCode = async () => {
    const code = promoCode.trim();
    setError("");
    setMessage("");
    setAppliedPromo(null);

    if (!code) {
      setError("Enter a promo code first.");
      return;
    }

    setBusyAction("promo");
    try {
      const idToken = await getCurrentUser().getIdToken(true);
      const response = await fetch(getApiUrl("/api/validate-coupon"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ coupon: code }),
      });
      const payload = await readResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Promo code could not be applied.");
      }

      setAppliedPromo(payload.coupon);
      setMessage("Promo code applied. Continue to Stripe to use it.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const proceedToCheckout = async () => {
    setBusyAction("checkout");
    try {
      const currentUser = getCurrentUser();
      const idToken = await currentUser.getIdToken(true);
      const code = appliedPromo?.code || promoCode.trim();
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
          coupon: code || undefined,
        }),
      });
      const payload = await readResponse(response);

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message || "Unable to start checkout.");
      }

      window.location.assign(payload.url);
    } catch (err) {
      setError(err.message);
      setBusyAction("");
    }
  };

  const startCheckout = async () => {
    setError("");
    setMessage("");

    if (!selectedPlan?.priceId) {
      setError("Pricing configuration not loaded. Try again.");
      return;
    }

    // Require preferred location before subscribing
    try {
      const userSnap = await getDoc(doc(db, "users", getCurrentUser().uid));
      if (!userSnap.exists() || !userSnap.data().prefLocation) {
        setShowPrefModal(true);
        return;
      }
    } catch (err) {
      console.error("Error checking prefLocation:", err);
    }

    await proceedToCheckout();
  };

  const updateCancellation = async (cancel) => {
    setError("");
    setMessage("");
    setBusyAction(cancel ? "cancel" : "resume");

    try {
      const idToken = await getCurrentUser().getIdToken(true);
      const response = await fetch(getApiUrl("/api/subscription-cancellation"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd: cancel }),
      });
      const payload = await readResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Unable to update subscription settings.",
        );
      }

      setMessage(
        cancel
          ? "Your subscription is set to cancel at the end of the current period."
          : "Auto-renewal is back on for this subscription.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="subscription-settings">
      {showPrefModal && (
        <PrefLocationModal
          user={auth.currentUser || user}
          onDone={() => {
            setShowPrefModal(false);
            proceedToCheckout();
          }}
          required
        />
      )}
      <div className="subscription-settings__header">
        <div>
          <div className="section-label-inner">Subscription Settings</div>
          <div className="subscription-settings__title">
            Manage plan, renewal, and discounts
          </div>
        </div>
        <span
          className={`subscription-settings__pill ${
            cancelAtPeriodEnd ? "subscription-settings__pill--warn" : ""
          }`}
        >
          {renewalLabel}
        </span>
      </div>

      <div className="subscription-settings__plans">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              className={`subscription-plan ${isSelected ? "subscription-plan--selected" : ""}`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <span className="subscription-plan__label">{plan.label}</span>
              <span className="subscription-plan__price">{plan.price}</span>
              <span className="subscription-plan__desc">{plan.description}</span>
            </button>
          );
        })}
      </div>

      <div className="subscription-settings__promo">
        <label className="subscription-settings__label" htmlFor="promo-code">
          Promo code
        </label>
        <div className="subscription-settings__promo-row">
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value);
              setAppliedPromo(null);
            }}
            placeholder="Enter code"
            className="subscription-settings__input"
          />
          <button
            type="button"
            className="subscription-settings__secondary-btn"
            onClick={validatePromoCode}
            disabled={busyAction === "promo"}
          >
            {busyAction === "promo" ? "Checking..." : "Apply"}
          </button>
        </div>
        {appliedPromo ? (
          <div className="subscription-settings__hint">
            Applied: {appliedPromo.code || appliedPromo.id}
          </div>
        ) : (
          <div className="subscription-settings__hint">
            You can also enter eligible promo codes on Stripe checkout.
          </div>
        )}
      </div>

      {error ? (
        <div className="subscription-settings__message subscription-settings__message--error">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="subscription-settings__message">{message}</div>
      ) : null}

      <div className="subscription-settings__actions">
        <button
          type="button"
          className="subscription-settings__primary-btn"
          onClick={startCheckout}
          disabled={busyAction === "checkout"}
        >
          {busyAction === "checkout"
            ? "Opening Stripe..."
            : `Buy ${selectedPlan?.label || "Plan"}`}
        </button>

        {hasStripeSubscription ? (
          cancelAtPeriodEnd ? (
            <button
              type="button"
              className="subscription-settings__secondary-btn"
              onClick={() => updateCancellation(false)}
              disabled={busyAction === "resume"}
            >
              {busyAction === "resume" ? "Updating..." : "Keep Auto-Renewal"}
            </button>
          ) : (
            <button
              type="button"
              className="subscription-settings__danger-btn"
              onClick={() => updateCancellation(true)}
              disabled={busyAction === "cancel"}
            >
              {busyAction === "cancel" ? "Updating..." : "Cancel at Period End"}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionSettings;
