import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const PAYOUT_RATE = 5; // $5 per active subscriber

const PartnerProfile = ({ user, partnerProfile }) => {
  const navigate = useNavigate();
  const [prefCount, setPrefCount] = useState(null);
  const [prefUsers, setPrefUsers] = useState([]);
  const [monthlyCount, setMonthlyCount] = useState(null);
  const [showPrefUsers, setShowPrefUsers] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(
    partnerProfile.prefPaymentMethod || "",
  );
  const [paymentHandle, setPaymentHandle] = useState(
    partnerProfile.prefPaymentHandle || "",
  );
  const [savingPayment, setSavingPayment] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const PAYMENT_OPTIONS = [
    {
      value: "paypal",
      label: "PayPal",
      symbol: "🅿",
      color: "#003087",
      bg: "#e8f0fb",
      hasHandle: true,
      handleLabel: "PayPal email or @handle",
    },
    {
      value: "googlepay",
      label: "Google Pay",
      symbol: "G",
      color: "#4285F4",
      bg: "#e8f0fe",
      hasHandle: false,
    },
    {
      value: "check",
      label: "Check",
      symbol: "✉",
      color: "#555",
      bg: "#f0f0f0",
      hasHandle: false,
    },
  ];

  const savePayment = async () => {
    setSavingPayment(true);
    try {
      const opt = PAYMENT_OPTIONS.find((o) => o.value === selectedMethod);
      await updateDoc(doc(db, "partners", partnerProfile.id), {
        prefPaymentMethod: selectedMethod,
        prefPaymentHandle: opt?.hasHandle ? paymentHandle : "",
      });
      setShowPaymentPicker(false);
    } catch (err) {
      console.error("Error saving payment method:", err);
    } finally {
      setSavingPayment(false);
    }
  };

  useEffect(() => {
    const loadPayouts = async () => {
      try {
        const snap = await getDocs(
          collection(db, "partners", partnerProfile.id, "payouts"),
        );
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0),
          );
        setPayouts(sorted);
      } catch (err) {
        console.error("Error loading payouts:", err);
      } finally {
        setPayoutsLoading(false);
      }
    };
    loadPayouts();
  }, [partnerProfile.id]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("prefLocation.id", "==", partnerProfile.id),
          ),
        );
        const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Total active subscribers at this location
        const activeUsers = allUsers.filter((u) => u.status === "active");
        setPrefCount(activeUsers.length);
        setPrefUsers(activeUsers);
        // Monthly subscribers — subscribed this calendar month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthly = activeUsers.filter((u) => {
          const subDate = u.subscribedAt?.toDate
            ? u.subscribedAt.toDate()
            : u.subscribedAt
              ? new Date(u.subscribedAt)
              : null;
          return subDate && subDate >= startOfMonth;
        });
        setMonthlyCount(monthly.length);
      } catch (err) {
        console.error("Error loading preferred count:", err);
        setPrefCount(0);
      }
    };
    load();
  }, [partnerProfile.id]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/partner");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: isMobile ? 0 : 18,
          padding: isMobile ? "28px 20px" : "28px 24px",
          margin: isMobile ? "0 -20px 24px" : "0 0 24px",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#d4af37",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              Partner Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>
              {partnerProfile.businessName || "Partner Account"}
            </h2>
            <p style={{ margin: 0, color: "#d6d6d6" }}>
              Manage your location details and account contact information.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Business Information</h3>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Business Name
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.businessName || "Not provided"}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Phone
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.phoneNumber || "Not provided"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Contact Email
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {user.email || partnerProfile.email || "Not available"}
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Location</h3>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Street Address
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.streetAddress || "Not provided"}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              City
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.city || "Not provided"}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Store Hours
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.storeHours || "Not provided"}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                State
              </div>
              <div style={{ marginTop: 4, fontSize: 18 }}>
                {partnerProfile.state || "Not provided"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Zip Code
              </div>
              <div style={{ marginTop: 4, fontSize: 18 }}>
                {partnerProfile.zipCode || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
            cursor: prefCount > 0 ? "pointer" : "default",
          }}
          onClick={() => prefCount > 0 && setShowPrefUsers(!showPrefUsers)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>Monthly Subscribers</h3>
            {prefCount > 0 && (
              <span style={{ fontSize: 13, color: "#0b57d0" }}>
                {showPrefUsers ? "Hide ▲" : "View ▼"}
              </span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
              marginBottom: 8,
            }}
          >
            <div
              style={{ background: "#f8f5ea", borderRadius: 12, padding: 14 }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#8a6a00",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                Total Active
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#121212" }}>
                {prefCount === null ? "—" : prefCount}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                active subscriber{prefCount !== 1 ? "s" : ""} at your location
              </div>
            </div>
            <div
              style={{ background: "#e8f5e9", borderRadius: 12, padding: 14 }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#1a7f37",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                This Month
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1a7f37" }}>
                {monthlyCount === null ? "—" : monthlyCount}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                new subscriber{monthlyCount !== 1 ? "s" : ""} in{" "}
                {new Date().toLocaleString("default", { month: "long" })}
              </div>
            </div>
          </div>
          {showPrefUsers && prefUsers.length > 0 && (
            <div
              style={{
                marginTop: 18,
                borderTop: "1px solid #eee",
                paddingTop: 16,
              }}
            >
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {prefUsers.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px 14px",
                      background: "#fafafa",
                      borderRadius: 10,
                      border: "1px solid #eee",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {u.name || "Unnamed user"}
                    </span>
                    {u.email && (
                      <span
                        style={{ fontSize: 13, color: "#666", marginTop: 2 }}
                      >
                        {u.email}
                      </span>
                    )}
                    {u.phoneNumber && (
                      <span
                        style={{ fontSize: 13, color: "#888", marginTop: 1 }}
                      >
                        {u.phoneNumber}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>Preferred Payment</h3>
            <button
              type="button"
              onClick={() => setShowPaymentPicker(!showPaymentPicker)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#f5f5f5",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {showPaymentPicker ? "Cancel" : "Change"}
            </button>
          </div>

          {!showPaymentPicker ? (
            selectedMethod ? (
              (() => {
                const opt = PAYMENT_OPTIONS.find(
                  (o) => o.value === selectedMethod,
                );
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: opt?.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        color: opt?.color,
                      }}
                    >
                      {opt?.symbol}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 17 }}>
                        {opt?.label}
                      </div>
                      {opt?.hasHandle && paymentHandle && (
                        <div
                          style={{ fontSize: 13, color: "#666", marginTop: 2 }}
                        >
                          {paymentHandle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p style={{ color: "#888", margin: 0 }}>
                No payment method set. Click Change to add one.
              </p>
            )
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `2px solid ${selectedMethod === opt.value ? opt.color : "#eee"}`,
                      background:
                        selectedMethod === opt.value ? opt.bg : "#fafafa",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={selectedMethod === opt.value}
                      onChange={() => setSelectedMethod(opt.value)}
                    />
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: opt.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 700,
                        color: opt.color,
                      }}
                    >
                      {opt.symbol}
                    </div>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {PAYMENT_OPTIONS.find((o) => o.value === selectedMethod)
                ?.hasHandle && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 6,
                    }}
                  >
                    {
                      PAYMENT_OPTIONS.find((o) => o.value === selectedMethod)
                        ?.handleLabel
                    }
                  </div>
                  <input
                    type="text"
                    value={paymentHandle}
                    onChange={(e) => setPaymentHandle(e.target.value)}
                    placeholder="e.g. yourname@email.com"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      fontSize: 15,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={savePayment}
                disabled={!selectedMethod || savingPayment}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedMethod ? "#121212" : "#ccc",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: selectedMethod ? "pointer" : "not-allowed",
                }}
              >
                {savingPayment ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* Payout Tracking */}
        {(() => {
          const currentMonthEarnings = (prefCount || 0) * PAYOUT_RATE;
          const totalPaid = payouts
            .filter((p) => p.status === "paid")
            .reduce((s, p) => s + (p.amount || 0), 0);
          return (
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 16,
                padding: 24,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                💰 Payout Tracking
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#e8f5e9",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#1a7f37",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 6,
                    }}
                  >
                    This Month
                  </div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, color: "#1a7f37" }}
                  >
                    ${currentMonthEarnings}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    {prefCount || 0} subscribers × $5
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f5ea",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8a6a00",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 6,
                    }}
                  >
                    Total Paid
                  </div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, color: "#121212" }}
                  >
                    ${totalPaid}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    all time
                  </div>
                </div>
              </div>
              {!payoutsLoading && payouts.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 10,
                    }}
                  >
                    Payout History
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#fafafa",
                          borderRadius: 10,
                          border: "1px solid #eee",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {p.month || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#888",
                              marginTop: 2,
                            }}
                          >
                            {p.subscriberCount} subscriber
                            {p.subscriberCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>
                            ${p.amount}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 999,
                              padding: "2px 8px",
                              background:
                                p.status === "paid" ? "#d4edda" : "#fff3cd",
                              color:
                                p.status === "paid" ? "#1a7f37" : "#856404",
                            }}
                          >
                            {p.status === "paid" ? "✓ Paid" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!payoutsLoading && payouts.length === 0 && (
                <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
                  No payout history yet. Payouts are processed monthly based on
                  your active subscriber count.
                </p>
              )}
            </div>
          );
        })()}

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#faf7ef",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Partner ID
            </div>
            <div style={{ marginTop: 4, fontSize: 15, wordBreak: "break-all" }}>
              {user.uid}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Account Type
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>Approved Partner</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link to="/partner">Partner Portal</Link>
            <Link to="/partner/profile/edit">Edit</Link>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfile;
