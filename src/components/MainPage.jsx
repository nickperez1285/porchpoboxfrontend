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
    <div style={{ heigbt: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "85vh",
        }}
      >
        <hr></hr>
        {/* <div className="pricing-header p-3 pb-md-4 mx-auto text-center"> */}
        {/* <u><h1 className="display-5 fw-bold">Porch P.O. Box </h1></u> */}
        {/* <Link to="/customers">view customers </Link><br></br> */}
        {/* <header> */}
        <h3 style={{ color: "gold" }}>Welcome to Porch P.O. Box </h3>
        {/* </header> */}

        <p className="text-muted text-wrap">{/*etgagasfdsads */}</p>
        {/* </div> */}

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
              background: "#111",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 20,
              color: "#f5f5f5",
            }}
          >
            <center><h4 style={{ marginTop: 0, color: "gold" }}>Porch P.O. Boxes</h4></center>
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
                      padding: "12px 0",
                      borderBottom: "1px solid #2c2c2c",
                    }}
                  >
                    <strong>{vendor.businessName || "Unnamed vendor"}</strong>
                    <div>
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

          <div style={{ flex: "1 1 520px", minWidth: 320, maxWidth: 720 }}>
            <OneTimeProduct isLoggedIn={Boolean(user)} />
          </div>
        </div>
        <br />
      </div>
      <footer style={{ padding: '1em', background: "black" }}>
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
