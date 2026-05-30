import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const PartnerInfoPage = () => {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!partnerId) {
      setError("No partner specified.");
      setLoading(false);
      return;
    }
    getDoc(doc(db, "partners", partnerId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setError("Partner not found.");
          setLoading(false);
          return;
        }
        setPartner({ id: snap.id, ...snap.data() });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error loading partner:", err);
        setError("Unable to load partner information.");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [partnerId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <p style={{ color: "#888" }}>Loading partner information…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <p style={{ color: "#c00" }}>{error}</p>
        <Link to="/" style={{ color: "#0b57d0" }}>← Back to home</Link>
      </div>
    );
  }

  const address = [partner.streetAddress, partner.city, partner.state, partner.zipCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
      <Link
        to="/"
        style={{ display: "inline-block", marginBottom: 20, color: "#0b57d0", fontSize: 14, fontWeight: 600 }}
      >
        ← Back
      </Link>

      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 12, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
          Partner Location
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 28 }}>{partner.businessName}</h1>
        {partner.approved !== false ? (
          <span
            style={{
              display: "inline-block",
              background: "#1a7f37",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            Active Location
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Address */}
        {address && (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
              Address
            </div>
            <div style={{ fontSize: 15, color: "#333", lineHeight: 1.6 }}>{address}</div>
          </div>
        )}

        {/* Contact */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
            Contact
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {partner.phoneNumber && (
              <div>
                <div style={{ fontSize: 12, color: "#888" }}>Phone</div>
                <div style={{ fontSize: 15, color: "#333" }}>
                  <a href={`tel:${partner.phoneNumber}`} style={{ color: "#0b57d0", textDecoration: "none" }}>
                    {partner.phoneNumber}
                  </a>
                </div>
              </div>
            )}
            {partner.email && (
              <div>
                <div style={{ fontSize: 12, color: "#888" }}>Email</div>
                <div style={{ fontSize: 15, color: "#333" }}>
                  <a href={`mailto:${partner.email}`} style={{ color: "#0b57d0", textDecoration: "none" }}>
                    {partner.email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Hours */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
            Store Hours
          </div>
          <div style={{ fontSize: 15, color: "#333" }}>
            {partner.storeHours || "Not provided"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerInfoPage;
