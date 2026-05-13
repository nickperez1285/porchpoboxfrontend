import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, getDocs, onSnapshot } from "firebase/firestore";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";
import { db } from "../firebase";

const Partners = ({ user, partnerProfile, authLoading }) => {
  const [packageCountTotal, setPackageCountTotal] = useState(0);

  useEffect(() => {
    if (!partnerProfile?.id || !partnerProfile.approved) {
      setPackageCountTotal(0);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "partners", partnerProfile.id),
      (snap) => {
        const count = snap.exists() ? Math.max(0, Number(snap.data().packageCheckInCount) || 0) : 0;
        setPackageCountTotal(count);
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
      <div style={{ maxWidth: 1080, margin: "60px auto", padding: "0 20px" }}>
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

              {/* Primary action */}
              <Link
                to="/partner/package-check-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#d4af37",
                  borderRadius: 16,
                  padding: 16,
                  textDecoration: "none",
                  textAlign: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 28 }}>📦</span>
                <span style={{ color: "#121212", fontSize: 15, fontWeight: 700 }}>Check In Packages</span>
              </Link>

              {/* Secondary actions */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8", marginBottom: 2 }}>More</div>
                <Link to="/partner/activity-log" style={{ color: "#d4af37", fontSize: 14, fontWeight: 600 }}>📋 Activity Log</Link>
                <Link to="/partner/profile" style={{ color: "#d4af37", fontSize: 14, fontWeight: 600 }}>👤 Partner Profile</Link>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
          }}
        >
          <PartnerStatusLegend />
          <CustomerList
            vendorId={partnerProfile.id}
            partnerLocationName={partnerProfile.businessName || partnerProfile.streetAddress || "Unnamed partner"}
            onPackagesDelivered={handlePackagesDelivered}
          />
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
