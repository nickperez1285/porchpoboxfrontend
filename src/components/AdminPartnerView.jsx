import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";

const PAYOUT_RATE = 10;

const AdminPartnerView = () => {
  const { partnerId } = useParams();
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState("");
  const [payouts, setPayouts] = useState([]);
  const [activeSubscriberCount, setActiveSubscriberCount] = useState(0);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "partners", partnerId));
        if (!snap.exists()) {
          setError("Partner not found.");
        } else {
          setPartnerProfile({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        setError("Failed to load partner.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [partnerId]);

  const handleCleanup = async () => {
    if (!window.confirm("This will zero out all stale packageCount records where count > 0 but the user has no active packages. Continue?")) return;
    setCleaning(true);
    setCleanResult("");
    try {
      const snap = await getDocs(collection(db, "partners", partnerId, "packageCounts"));
      let fixed = 0;
      await Promise.all(
        snap.docs.map(async (entry) => {
          const data = entry.data();
          const count = Number(data.count) || 0;
          if (count > 0) {
            // Check if the user still has an active subscription
            const userSnap = await getDoc(doc(db, "users", entry.id));
            const userData = userSnap.exists() ? userSnap.data() : {};
            // If user is inactive/trial and has packages but no recent check-in activity, zero it out
            if (userData.status !== "active" && userData.packagesCheckedIn === userData.packagesDelivered) {
              await updateDoc(doc(db, "partners", partnerId, "packageCounts", entry.id), { count: 0 });
              fixed++;
            }
          }
        })
      );
      setCleanResult(fixed > 0 ? `✓ Cleaned up ${fixed} stale record${fixed > 1 ? "s" : ""}.` : "No stale records found — all counts look accurate.");
    } catch (err) {
      console.error("Cleanup error:", err);
      setCleanResult("Error during cleanup. Check console.");
    } finally {
      setCleaning(false);
    }
  };

  const handleForceZeroAll = async () => {
    if (!window.confirm("WARNING: This will set ALL packageCount records to 0 for this partner. Only use this if you are sure all packages have been picked up.")) return;
    setCleaning(true);
    setCleanResult("");
    try {
      const snap = await getDocs(collection(db, "partners", partnerId, "packageCounts"));
      await Promise.all(
        snap.docs
          .filter((entry) => (Number(entry.data().count) || 0) > 0)
          .map((entry) => updateDoc(doc(db, "partners", partnerId, "packageCounts", entry.id), { count: 0 }))
      );
      setCleanResult(`✓ All package counts reset to 0.`);
    } catch (err) {
      console.error("Force zero error:", err);
      setCleanResult("Error during reset. Check console.");
    } finally {
      setCleaning(false);
    }
  };

  // Load payouts and active subscriber count
  useEffect(() => {
    if (!partnerId) return;
    const unsub = onSnapshot(
      query(collection(db, "partners", partnerId, "payouts"), orderBy("createdAt", "desc")),
      (snap) => setPayouts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Error loading payouts:", err)
    );
    return () => unsub();
  }, [partnerId]);

  useEffect(() => {
    if (!partnerId) return;
    const loadSubscribers = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("prefLocation.id", "==", partnerId),
            where("status", "==", "active")
          )
        );
        setActiveSubscriberCount(snap.size);
      } catch (err) {
        console.error("Error loading subscribers:", err);
      }
    };
    loadSubscribers();
  }, [partnerId]);

  const handleCreatePayout = async () => {
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long", year: "numeric" });
    const amount = activeSubscriberCount * PAYOUT_RATE;
    if (!window.confirm(`Create a pending payout of $${amount} for ${month} (${activeSubscriberCount} subscribers × $${PAYOUT_RATE})?`)) return;
    setPayoutSaving(true);
    setPayoutMsg("");
    try {
      await addDoc(collection(db, "partners", partnerId, "payouts"), {
        month,
        amount,
        subscriberCount: activeSubscriberCount,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setPayoutMsg(`✓ Payout of $${amount} created for ${month}.`);
    } catch (err) {
      setPayoutMsg(`Error: ${err.message}`);
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleMarkPaid = async (payoutId) => {
    if (!window.confirm("Mark this payout as paid?")) return;
    try {
      await updateDoc(doc(db, "partners", partnerId, "payouts", payoutId), {
        status: "paid",
        paidAt: serverTimestamp()
      });
      setPayoutMsg("✓ Payout marked as paid.");
    } catch (err) {
      setPayoutMsg(`Error: ${err.message}`);
    }
  };

  if (loading) return <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}><p>Loading...</p></div>;
  if (error) return <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}><p>{error}</p><Link to="/admin">← Back to Admin</Link></div>;

  return (
    <div style={{ maxWidth: 1080, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin">← Back to Admin</Link>
      </div>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "28px 24px",
          marginBottom: 24,
          boxShadow: "0 16px 36px rgba(0,0,0,0.18)"
        }}
      >
        <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
          Admin — Partner View
        </div>
        <h2 style={{ margin: "10px 0 6px" }}>{partnerProfile.businessName || "Unnamed Partner"}</h2>
        <p style={{ margin: 0, color: "#d6d6d6" }}>
          {[partnerProfile.streetAddress, partnerProfile.city, partnerProfile.state, partnerProfile.zipCode]
            .filter(Boolean).join(", ")}
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, color: "#1a7f37", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>💰 Payout Management</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#e8f5e9", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#1a7f37", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Active Subscribers</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{activeSubscriberCount}</div>
          </div>
          <div style={{ background: "#f8f5ea", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#8a6a00", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>This Month</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${activeSubscriberCount * PAYOUT_RATE}</div>
          </div>
          <div style={{ background: "#fff8e1", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#856404", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Total Paid</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${payouts.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleCreatePayout}
            disabled={payoutSaving || activeSubscriberCount === 0}
            style={{ padding: "8px 16px", background: "#1a7f37", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            {payoutSaving ? "Creating..." : `➕ Create Payout ($${activeSubscriberCount * PAYOUT_RATE})`}
          </button>
          {payoutMsg && <span style={{ fontSize: 13, fontWeight: 600, color: payoutMsg.startsWith("✓") ? "#1a7f37" : "#dc3545" }}>{payoutMsg}</span>}
        </div>
        {payouts.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Payout History</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payouts.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #eee" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.month || "—"}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.subscriberCount} subscriber{p.subscriberCount !== 1 ? "s" : ""} × $10</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>${p.amount}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 8px", background: p.status === "paid" ? "#d4edda" : "#fff3cd", color: p.status === "paid" ? "#1a7f37" : "#856404" }}>
                        {p.status === "paid" ? "✓ Paid" : "Pending"}
                      </span>
                    </div>
                    {p.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(p.id)}
                        style={{ padding: "6px 12px", background: "#1a7f37", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {payouts.length === 0 && <p style={{ color: "#888", fontSize: 13, margin: 0 }}>No payouts yet. Click "Create Payout" to generate this month's payout.</p>}
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>🔧 Admin Tools</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning}
            style={{ padding: "8px 16px", background: "#f0a500", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            {cleaning ? "Cleaning..." : "🧹 Clean Stale Counts"}
          </button>
          <button
            type="button"
            onClick={handleForceZeroAll}
            disabled={cleaning}
            style={{ padding: "8px 16px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            {cleaning ? "Resetting..." : "⚠️ Force Zero All Counts"}
          </button>
          {cleanResult && (
            <span style={{ fontSize: 13, color: cleanResult.startsWith("✓") ? "#1a7f37" : "#dc3545", fontWeight: 600 }}>
              {cleanResult}
            </span>
          )}
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#888" }}>
          "Clean Stale Counts" zeros records where the user's delivered count matches checked-in count. "Force Zero All" resets everything — use only if all packages are confirmed picked up.
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, boxShadow: "0 12px 28px rgba(0,0,0,0.08)" }}>
        <PartnerStatusLegend />
        <CustomerList
          vendorId={partnerId}
          partnerLocationName={partnerProfile.businessName || partnerProfile.streetAddress || "Unnamed partner"}
        />
      </div>
    </div>
  );
};

export default AdminPartnerView;
