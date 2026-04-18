import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const VendorProfile = ({ user, vendorProfile }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/vendor");
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
              Vendor Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>
              {vendorProfile.businessName || "Vendor Account"}
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
              {user.email || vendorProfile.email || "Not available"}
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
            <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.businessName || "Not provided"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Phone</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.phoneNumber || "Not provided"}</div>
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
            <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.streetAddress || "Not provided"}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>City</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.city || "Not provided"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>State</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.state || "Not provided"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Zip Code</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{vendorProfile.zipCode || "Not provided"}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#faf7ef"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Vendor ID</div>
            <div style={{ marginTop: 4, fontSize: 15, wordBreak: "break-all" }}>{user.uid}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Account Type</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>Approved Vendor</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link to="/vendor">Vendor Portal</Link>
            <Link to="/vendor/profile/edit">Edit Email / Address</Link>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
