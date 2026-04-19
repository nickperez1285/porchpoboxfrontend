import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import OneTimeProduct from "./OneTimeProduct";
import { db } from "../firebase";

const MainPage = ({ user }) => {
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");

  useEffect(() => {
    fetchActiveVendors();
  }, []);

  const fetchActiveVendors = async () => {
    setVendorsLoading(true);
    setVendorsError("");
    try {
      const vendorSnapshot = await getDocs(
        query(collection(db, "vendors"), where("approved", "==", true))
      );
      setActiveVendors(
        vendorSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
      );
    } catch (error) {
      console.error("Error loading active vendors:", error);
      setActiveVendors([]);
      setVendorsError(
        error?.message || "Unable to load active vendors."
      );
    } finally {
      setVendorsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(circle at top, rgba(212, 175, 55, 0.16), transparent 32%), linear-gradient(180deg, #f7f3e8 0%, #f4efe3 100%)"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "85vh",
          padding: "32px 20px 48px"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
            color: "#f5f5f5",
            borderRadius: 24,
            padding: "32px 28px",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
            marginBottom: 28
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                color: "#d4af37",
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase"
              }}
            >
              Porch P.O. Box
            </div>
            <h2 style={{ margin: "10px 0 12px", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
              Secure package receiving through local partner locations.
            </h2>
            <p style={{ margin: 0, color: "#d3d3d3", lineHeight: 1.6, maxWidth: 620 }}>
              Browse active Porch P.O. Box locations, choose a monthly package plan,
              and manage deliveries through a cleaner customer and vendor workflow.
            </p>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: "1 1 320px",
              minWidth: 280,
              maxWidth: 420,
              maxHeight: 420,
              overflowY: "auto",
              background: "#fffdf8",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 20,
              padding: 22,
              color: "#181818",
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#8a6a00",
                  letterSpacing: 1,
                  textTransform: "uppercase"
                }}
              >
                Active Locations
              </div>
              <h4 style={{ margin: "8px 0 0" }}>Porch P.O. Boxes</h4>
            </div>
            {vendorsLoading ? (
              <p>Loading vendors...</p>
            ) : vendorsError ? (
              <p>{vendorsError}</p>
            ) : activeVendors.length === 0 ? (
              <p>No active vendors listed yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {activeVendors.map((vendor) => (
                  <li
                    key={vendor.id}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #ece5d5",
                    }}
                  >
                    <strong>{vendor.businessName || "Unnamed vendor"}</strong>
                    <div style={{ marginTop: 4, color: "#555" }}>
                      {vendor.streetAddress || "No street address"}
                      {vendor.city ? `, ${vendor.city}` : ""}
                      {vendor.state ? `, ${vendor.state}` : ""}
                      {vendor.zipCode ? ` ${vendor.zipCode}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            style={{
              flex: "1 1 520px",
              minWidth: 320,
              maxWidth: 720,
              background: "#fff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#8a6a00",
                  letterSpacing: 1,
                  textTransform: "uppercase"
                }}
              >
                Monthly Plan
              </div>
              <h4 style={{ margin: "8px 0 6px" }}>Checkout</h4>
              <p style={{ margin: 0, color: "#666" }}>
                Start a 30-day package plan. Login is required before checkout.
              </p>
            </div>
            <OneTimeProduct user={user} />
          </div>
        </div>
      </div>
      <footer style={{ padding: "1em", background: "#111" }}>
        <center>
          <Link
            to="/vendor"
            style={{ display: "inline-block", paddingRight: 10 }}
          >
            Vendors
          </Link>
          <></>
          <Link to="/contact">Contact </Link>
        </center>
      </footer>
    </div>
  );
};

export default MainPage;
