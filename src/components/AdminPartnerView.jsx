import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";

const PAYOUT_RATE = 5;

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
