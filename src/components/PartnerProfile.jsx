import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

const PartnerProfile = ({ user, partnerProfile }) => {
  const navigate = useNavigate();
  const [prefCount, setPrefCount] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("prefLocation.id", "==", partnerProfile.id))
        );
        setPrefCount(snap.size);
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
          borderRadius: 18,
          padding: "28px 24px",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-start"
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }}>
              Partner Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>
              {partnerProfile.businessName || "Partner Account"}
            </h2>
            <p style={{ margin: 0, color: "#d6d6d6" }}>
              Manage your location details and account contact information.
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
              Contact Email
            </div>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>
              {user.email || partnerProfile.email || "Not available"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Business Information</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Business Name</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.businessName || "Not provided"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Phone</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.phoneNumber || "Not provided"}</div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Location</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Street Address</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.streetAddress || "Not provided"}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>City</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.city || "Not provided"}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Store Hours</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.storeHours || "Not provided"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>State</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.state || "Not provided"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Zip Code</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.zipCode || "Not provided"}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Community Reach</h3>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Users Who Selected You
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#121212" }}>
            {prefCount === null ? "—" : prefCount}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            {prefCount === 1 ? "user has" : "users have"} selected your location as their preferred Porch P.O. Box.
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Preferred Payment</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Payment Method</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {partnerProfile.prefPaymentMethod
                ? { cashapp: "Cash App", paypal: "PayPal", check: "Check" }[partnerProfile.prefPaymentMethod] || partnerProfile.prefPaymentMethod
                : "Not set"}
            </div>
          </div>
          {(partnerProfile.prefPaymentMethod === "cashapp" || partnerProfile.prefPaymentMethod === "paypal") && (
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>
                {partnerProfile.prefPaymentMethod === "cashapp" ? "Cash App Handle" : "PayPal Email / Handle"}
              </div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{partnerProfile.prefPaymentHandle || "Not provided"}</div>
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#faf7ef"
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Partner ID</div>
            <div style={{ marginTop: 4, fontSize: 15, wordBreak: "break-all" }}>{user.uid}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Account Type</div>
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
