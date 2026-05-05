import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";

const AdminPartnerView = () => {
  const { partnerId } = useParams();
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
