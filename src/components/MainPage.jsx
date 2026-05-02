import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import OneTimeProduct from "./OneTimeProduct";
import { db } from "../firebase";

const MainPage = ({ user, userStatus }) => {
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");
  const [mainPageMessage, setMainPageMessage] = useState("Main Page Message");
  const [mainPageTitle, setMainPageTitle] = useState("Main Page Title");
  useEffect(() => {
    setMainPageTitle("Secure package receiving through local partner locations.");
    setMainPageMessage("Have your packages delivered to your desired Porch P.O. Box locations and left in the care and watchful eyes of a trusted and secure Porch P.O. Box partner.");
    fetchActiveVendors();
  }, []);

  const fetchActiveVendors = async () => {
    setVendorsLoading(true);
    try {
      const vendorSnapshot = await getDocs(
        query(collection(db, "partners"), where("approved", "==", true))
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
              {mainPageTitle}
            </h2>
            <p style={{ margin: 0, color: "#d3d3d3", lineHeight: 1.6, maxWidth: 620 }}>
              {mainPageMessage}
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
              <p>Loading partners...</p>
            ) : vendorsError ? (
              <p>{vendorsError}</p>
            ) : activeVendors.length === 0 ? (
              <p>No active partners listed yet.</p>
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
                    <strong>{vendor.businessName || "Unnamed partner"}</strong>
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
                {user && userStatus === "active" ? "Member Access" : "Subscription Plans"}
              </div>
              <h4 style={{ margin: "8px 0 6px" }}>
                {user && userStatus === "active" ? "Welcome to PorchPOBox!" : "Sign Up"}
              </h4>
              <p style={{ margin: 0, color: "#666" }}>
                {user && userStatus === "active"
                  ? "Your subscription is active. You can continue using Porch P.O. Box services."
                  : "Select the subscription term that fits your delivery needs and start receiving your packages today!"}
              </p>
            </div>
            {user && userStatus === "active" ? null : <OneTimeProduct user={user} />}
          </div>
        </div>

        <div
          className="Promotion"
          style={{
            width: "100%",
            maxWidth: 1180,
            marginTop: 24,
            background: "linear-gradient(135deg, #d6ecff 0%, #9ed0ff 100%)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: "24px 28px",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#0b3f66",
              letterSpacing: 1,
              textTransform: "uppercase"
            }}
          >
            Promotion
          </div>
          <h4 style={{ margin: "8px 0 6px", color: "#181818" }}>
            Try Porch P.O. Box for free!
          </h4>
          <p style={{ margin: 0, color: "#0d3555", lineHeight: 1.6 }}>
            Sign up today and get your first package delivered to a Porch P.O. Box
            for free.
          </p>
        </div>
        <div
          className="Referral"
          style={{
            width: "100%",
            maxWidth: 1180,
            marginTop: 24,
            background: "linear-gradient(135deg, #f3e1a2 0%, #e8c95d 100%)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: "24px 28px",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6a4a00",
              letterSpacing: 1,
              textTransform: "uppercase"
            }}
          >
            Referrals
          </div>
          <h4 style={{ margin: "8px 0 6px", color: "#181818" }}>
            Invite a partner. Earn a free month.
          </h4>
          <p style={{ margin: 0, color: "#3f3210", lineHeight: 1.6 }}>
            Refer a new partner location to Porch P.O. Box and receive one free month
            of service when they join.
          </p>
        </div>

      </div>
      <footer style={{ padding: "1em", background: "#111" }}>
        <center>
          <Link
            to="/partner"
            style={{ display: "inline-block", paddingRight: 10 }}
          >
            Partners
          </Link>
          <></>
          <Link to="/contact">Contact </Link>
        </center>
      </footer>
    </div>
  );
};

export default MainPage;
