import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";
import { db } from "../firebase";

const ActivityPanel = ({ partnerProfile }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerProfile?.id) return;
    let activityEntries = [];
    let payoutEntries = [];
    const unsubscribes = [];

    const merge = () => {
      const all = [...activityEntries, ...payoutEntries].sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(0);
        const tb = b.timestamp?.toDate?.() || new Date(0);
        return tb - ta;
      });
      setEntries(all.slice(0, 30));
      setLoading(false);
    };

    unsubscribes.push(onSnapshot(
      collection(db, "partners", partnerProfile.id, "activityLog"),
      (snap) => { activityEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() })); merge(); },
      () => setLoading(false)
    ));

    unsubscribes.push(onSnapshot(
      query(collection(db, "partners", partnerProfile.id, "payouts"), orderBy("createdAt", "desc")),
      (snap) => {
        payoutEntries = snap.docs
          .filter((d) => d.data().status === "paid")
          .map((d) => ({
            id: `payout-${d.id}`,
            type: "payout-paid",
            timestamp: d.data().paidAt || d.data().createdAt,
            month: d.data().month,
            amount: d.data().amount,
            subscriberCount: d.data().subscriberCount
          }));
        merge();
      },
      () => {}
    ));

    return () => unsubscribes.forEach((u) => u());
  }, [partnerProfile?.id]);

  const fmt = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const typeStyle = (type) => {
    if (type === "check-in")   return { bg: "#e6f4ea", color: "#1a7f37", label: "Check In" };
    if (type === "delivery")   return { bg: "#fff3cd", color: "#856404", label: "Delivered" };
    if (type === "payout-paid") return { bg: "#d4edda", color: "#0f5132", label: "Payout Paid" };
    return { bg: "#f0f0f0", color: "#444", label: type };
  };

  const isPayout = (type) => type === "payout-paid";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase" }}>Live</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>Activity Log</div>
        </div>
        <Link to="/partner/activity-log" style={{ fontSize: 12, color: "#0b57d0", fontWeight: 600 }}>View All →</Link>
      </div>

      {loading ? (
        <p style={{ padding: "16px 24px", color: "#aaa", fontSize: 13 }}>Loading...</p>
      ) : entries.length === 0 ? (
        <p style={{ padding: "16px 24px", color: "#aaa", fontSize: 13 }}>No activity yet.</p>
      ) : (
        <div style={{ overflowY: "auto", flex: 1, maxHeight: 340 }}>
          {entries.map((entry, i) => {
            const ts = typeStyle(entry.type);
            return (
              <div key={entry.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 24px",
                borderBottom: "1px solid #f5f5f5",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
                gap: 12
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ background: ts.bg, color: ts.color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {ts.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isPayout(entry.type) ? entry.month : (entry.customerName || "Unknown")}
                  </div>
                  {!isPayout(entry.type) && entry.customerEmail && (
                    <div style={{ fontSize: 11, color: "#aaa" }}>{entry.customerEmail}</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>
                    {isPayout(entry.type) ? `$${entry.amount}` : `${entry.packageCount} pkg${entry.packageCount !== 1 ? "s" : ""}`}
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{fmt(entry.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Partners = ({ user, partnerProfile, authLoading }) => {
  const [packageCountTotal, setPackageCountTotal] = useState(0);

  useEffect(() => {
    if (!partnerProfile?.id || !partnerProfile.approved) {
      setPackageCountTotal(0);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "partners", partnerProfile.id, "packageCounts"),
      (snap) => {
        const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().count) || 0), 0);
        setPackageCountTotal(Math.max(0, total));
      },
      (err) => { console.error("Error loading package count:", err); setPackageCountTotal(0); }
    );
    return () => unsub();
  }, [partnerProfile]);

  const handlePackagesDelivered = (deliveredCount) => {
    setPackageCountTotal((current) => Math.max(0, current - deliveredCount));
  };

  if (authLoading) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center" }}>
        <h2>Partner Portal</h2>
        <p>Loading partner access...</p>
      </div>
    );
  }

  if (user && partnerProfile) {
    if (!partnerProfile.approved) {
      return (
        <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
              color: "#f5f5f5",
              borderRadius: 20,
              padding: "28px 24px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Partner Portal</h2>
            <p style={{ color: "#d6d6d6" }}>
              {partnerProfile.status === "deactivated"
                ? "Your partner account has been deactivated. Please contact Porch P.O. Box for assistance."
                : "Your registration information has been received and your request to become a partner is being reviewed."}
            </p>
            <p style={{ marginBottom: 0 }}>
              <Link to="/partner/profile">Partner Profile</Link>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 1280, margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
            color: "#f5f5f5",
            borderRadius: 24,
            padding: "30px 28px",
            marginBottom: 24,
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: 540 }}>
              <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Partner Portal
              </div>
              <h2 style={{ margin: "10px 0 8px" }}>{partnerProfile.businessName}</h2>
              <p style={{ margin: 0, color: "#d6d6d6", lineHeight: 1.6 }}>
                Review active customer deliveries, manage package intake, and clear delivered packages from your location.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, flex: "1 1 320px" }}>
              {/* Stat card */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>Packages In Stock</div>
                <div style={{ marginTop: 8, fontSize: 36, fontWeight: 700, color: packageCountTotal > 0 ? "#d4af37" : "#fff" }}>
                  {packageCountTotal}
                </div>
              </div>

              {/* Secondary actions */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8", marginBottom: 2 }}>More</div>
                <Link to="/partner/activity-log" style={{ color: "#d4af37", fontSize: 14, fontWeight: 600 }}>📋 Activity Log</Link>
                <Link to="/partner/profile" style={{ color: "#d4af37", fontSize: 14, fontWeight: 600 }}>👤 Partner Profile</Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          <Link
            to="/partner/package-check-in"
            style={{
              gridColumn: "1 / -1",
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "#d4af37",
              borderRadius: 16,
              padding: "18px 24px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 16,
              color: "#121212",
              boxShadow: "0 4px 16px rgba(212,175,55,0.35)"
            }}
          >
            <span style={{ fontSize: 22 }}>📦</span> Check In Packages
          </Link>

          {/* LEFT — Activity Log */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 20,
              boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              maxHeight: 420,
              overflow: "hidden"
            }}>
              <ActivityPanel partnerProfile={partnerProfile} />
            </div>
          </div>

          {/* RIGHT — Package check-in list */}
          <div style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          }}>
            <PartnerStatusLegend />
            <CustomerList
              vendorId={partnerProfile.id}
              partnerLocationName={partnerProfile.businessName || partnerProfile.streetAddress || "Unnamed partner"}
              onPackagesDelivered={handlePackagesDelivered}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 20,
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Partner Portal</h2>
        <p style={{ color: "#d6d6d6" }}>
          Sign up here to become a Porch P.O. Box partner and start accepting
          package deliveries for customers in your area. If you already have an
          account, please log in to access your partner dashboard.
        </p>
        {/* <p>
                    <Link to="/partner/login">Partner Login</Link>
                </p> */}
        <p>
          <Link to="/partner/register">Become a Partner</Link>
        </p>
        {user && !partnerProfile && (
          <p>
            This account is signed in, but it is not registered as a partner.
          </p>
        )}
      </div>
    </div>
  );
};

export default Partners;
