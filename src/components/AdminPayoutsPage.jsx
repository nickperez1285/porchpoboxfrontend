import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const PAYOUT_RATE = 5;

const AdminPayoutsPage = () => {
  const [partners, setPartners] = useState([]);
  const [payoutsByPartner, setPayoutsByPartner] = useState({});
  const [subscriberCounts, setSubscriberCounts] = useState({});
  const [adjustments, setAdjustments] = useState({});
  const [loading, setLoading] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Load all approved partners
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "partners"));
        const approved = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.approved);
        setPartners(approved);

        // Load active subscriber counts for each partner
        const counts = {};
        await Promise.all(
          approved.map(async (p) => {
            const uSnap = await getDocs(
              query(
                collection(db, "users"),
                where("prefLocation.id", "==", p.id),
                where("status", "==", "active")
              )
            );
            counts[p.id] = uSnap.size;
          })
        );
        setSubscriberCounts(counts);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Subscribe to payouts for all partners
  useEffect(() => {
    if (partners.length === 0) return;
    const unsubs = partners.map((p) =>
      onSnapshot(
        query(collection(db, "partners", p.id, "payouts"), orderBy("createdAt", "desc")),
        (snap) => {
          setPayoutsByPartner((prev) => ({
            ...prev,
            [p.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          }));
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [partners]);

  const getDefaultAmount = (partnerId) =>
    adjustments[partnerId] !== undefined
      ? adjustments[partnerId]
      : (subscriberCounts[partnerId] || 0) * PAYOUT_RATE;

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const hasPayoutThisMonth = (partnerId) =>
    (payoutsByPartner[partnerId] || []).some((p) => p.month === currentMonth);

  const handleBulkCreate = async () => {
    const eligible = partners.filter((p) => !hasPayoutThisMonth(p.id) && getDefaultAmount(p.id) > 0);
    if (eligible.length === 0) { setMsg("All partners already have a payout for this month."); return; }
    if (!window.confirm(`Create payouts for ${eligible.length} partner(s) for ${currentMonth}?`)) return;
    setBulkSaving(true);
    setMsg("");
    try {
      await Promise.all(
        eligible.map((p) =>
          addDoc(collection(db, "partners", p.id, "payouts"), {
            month: currentMonth,
            amount: getDefaultAmount(p.id),
            subscriberCount: subscriberCounts[p.id] || 0,
            status: "pending",
            createdAt: serverTimestamp()
          })
        )
      );
      setMsg(`✓ Created payouts for ${eligible.length} partner(s).`);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleMarkPaid = async (partnerId, payoutId) => {
    if (!window.confirm("Mark this payout as paid?")) return;
    try {
      await updateDoc(doc(db, "partners", partnerId, "payouts", payoutId), {
        status: "paid",
        paidAt: serverTimestamp()
      });
      setMsg("✓ Marked as paid.");
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleUpdateAmount = async (partnerId, payoutId, newAmount) => {
    try {
      await updateDoc(doc(db, "partners", partnerId, "payouts", payoutId), {
        amount: Number(newAmount)
      });
      setMsg("✓ Amount updated.");
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  // Totals
  const allPayouts = Object.values(payoutsByPartner).flat();
  const totalOwed = allPayouts.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = allPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = allPayouts.filter((p) => p.status === "pending").length;

  if (loading) return <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}><p>Loading...</p></div>;

  return (
    <div style={{ maxWidth: 1100, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin">← Back to Admin</Link>
      </div>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)", color: "#f5f5f5", borderRadius: 24, padding: "28px 24px", marginBottom: 24, boxShadow: "0 16px 36px rgba(0,0,0,0.18)" }}>
        <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Admin</div>
        <h2 style={{ margin: "10px 0 6px" }}>Payout Management</h2>
        <p style={{ margin: 0, color: "#d6d6d6" }}>Create, adjust, and track partner payouts across all locations.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginTop: 20 }}>
          {[
            { label: "Total Owed", value: `$${totalOwed}`, color: "#fff3cd", text: "#856404" },
            { label: "Total Paid", value: `$${totalPaid}`, color: "#d4edda", text: "#1a7f37" },
            { label: "Pending Payouts", value: pendingCount, color: "rgba(255,255,255,0.08)", text: "#f5f5f5" },
            { label: "Partners", value: partners.length, color: "rgba(255,255,255,0.08)", text: "#f5f5f5" }
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.color, borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: stat.text, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.text, marginTop: 6 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, color: "#8a6a00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Bulk Actions — {currentMonth}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleBulkCreate}
            disabled={bulkSaving}
            style={{ padding: "9px 18px", background: "#1a7f37", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            {bulkSaving ? "Creating..." : `➕ Create All Payouts for ${currentMonth}`}
          </button>
          {msg && <span style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith("✓") ? "#1a7f37" : "#dc3545" }}>{msg}</span>}
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#888" }}>
          Skips partners who already have a payout this month. Adjust individual amounts below before creating if needed.
        </p>
      </div>

      {/* Per-partner rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {partners.map((partner) => {
          const payouts = payoutsByPartner[partner.id] || [];
          const subCount = subscriberCounts[partner.id] || 0;
          const defaultAmount = getDefaultAmount(partner.id);
          const partnerTotalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
          const partnerTotalOwed = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
          const alreadyThisMonth = hasPayoutThisMonth(partner.id);

          return (
            <div key={partner.id} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{partner.businessName || "Unnamed Partner"}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                    {[partner.city, partner.state].filter(Boolean).join(", ")} · {subCount} active subscriber{subCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    Owed: <strong style={{ color: partnerTotalOwed > 0 ? "#856404" : "#888" }}>${partnerTotalOwed}</strong>
                    &nbsp;·&nbsp;Paid: <strong style={{ color: "#1a7f37" }}>${partnerTotalPaid}</strong>
                  </div>
                  <Link to={`/admin/partner/${partner.id}`} style={{ fontSize: 12, color: "#0b57d0", fontWeight: 600 }}>View Portal →</Link>
                </div>
              </div>

              {/* Adjustment + create for this month */}
              {!alreadyThisMonth && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: payouts.length > 0 ? 16 : 0, padding: "12px 14px", background: "#f8f5ea", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: "#8a6a00", fontWeight: 600 }}>This month:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#666" }}>$</span>
                    <input
                      type="number"
                      min="0"
                      value={defaultAmount}
                      onChange={(e) => setAdjustments((prev) => ({ ...prev, [partner.id]: Number(e.target.value) }))}
                      style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, fontWeight: 600 }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await addDoc(collection(db, "partners", partner.id, "payouts"), {
                          month: currentMonth,
                          amount: defaultAmount,
                          subscriberCount: subCount,
                          status: "pending",
                          createdAt: serverTimestamp()
                        });
                        setMsg(`✓ Payout created for ${partner.businessName}.`);
                      } catch (err) {
                        setMsg(`Error: ${err.message}`);
                      }
                    }}
                    style={{ padding: "6px 14px", background: "#1a7f37", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                  >
                    Create
                  </button>
                </div>
              )}

              {alreadyThisMonth && (
                <div style={{ marginBottom: payouts.length > 0 ? 12 : 0, fontSize: 13, color: "#1a7f37", fontWeight: 600 }}>
                  ✓ Payout created for {currentMonth}
                </div>
              )}

              {/* Payout history */}
              {payouts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {payouts.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #eee", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.month || "—"}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.subscriberCount} subscriber{p.subscriberCount !== 1 ? "s" : ""} × $5</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {p.status === "pending" ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 12, color: "#666" }}>$</span>
                              <input
                                type="number"
                                min="0"
                                defaultValue={p.amount}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val !== p.amount) handleUpdateAmount(partner.id, p.id, val);
                                }}
                                style={{ width: 72, padding: "4px 6px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, fontWeight: 600 }}
                              />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 8px", background: "#fff3cd", color: "#856404" }}>Pending</span>
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(partner.id, p.id)}
                              style={{ padding: "5px 12px", background: "#1a7f37", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                            >
                              Mark Paid
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>${p.amount}</div>
                            <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 8px", background: "#d4edda", color: "#1a7f37" }}>✓ Paid</span>
                            {p.paidAt && (
                              <span style={{ fontSize: 11, color: "#888" }}>
                                {p.paidAt?.toDate ? p.paidAt.toDate().toLocaleDateString() : ""}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {payouts.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>No payout history yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPayoutsPage;
