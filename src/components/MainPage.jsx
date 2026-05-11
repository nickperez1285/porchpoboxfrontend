import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import OneTimeProduct from "./OneTimeProduct";
import { db } from "../firebase";

// Fix leaflet default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MapFlyTo = ({ vendorMarkers, selectedVendorId }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedVendorId) return;
    const target = vendorMarkers.find((m) => m.vendor.id === selectedVendorId);
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 1 });
  }, [selectedVendorId, vendorMarkers, map]);
  return null;
};

const MainPage = ({ user, userStatus }) => {
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");
  const [expandedVendorIds, setExpandedVendorIds] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [mainPageMessage, setMainPageMessage] = useState("Main Page Message");
  const [mainPageTitle, setMainPageTitle] = useState("Main Page Title");
  const [vendorMarkers, setVendorMarkers] = useState([]);
  useEffect(() => {
    setMainPageTitle(
      "Secure Package Receiving Through Local Partner Locations",
    );
    setMainPageMessage(
      "Have your packages delivered to a trusted local Porch P.O. Box partner and pick them up at your convenience — no more porch piracy.",
    );
    fetchActiveVendors();
  }, []);

  useEffect(() => {
    if (activeVendors.length === 0) return;
    const geocode = async () => {
      const results = await Promise.all(
        activeVendors.map(async (vendor) => {
          const addr = [
            vendor.streetAddress,
            vendor.city,
            vendor.state,
            vendor.zipCode,
          ]
            .filter(Boolean)
            .join(", ");
          if (!addr) return null;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
              { headers: { "Accept-Language": "en" } },
            );
            const data = await res.json();
            if (data[0])
              return {
                vendor,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
          } catch {}
          return null;
        }),
      );
      setVendorMarkers(results.filter(Boolean));
    };
    geocode();
  }, [activeVendors]);

  const fetchActiveVendors = async () => {
    setVendorsLoading(true);
    try {
      const vendorSnapshot = await getDocs(
        query(collection(db, "partners"), where("approved", "==", true)),
      );
      setActiveVendors(
        vendorSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    } catch (error) {
      console.error("Error loading active vendors:", error);
      setActiveVendors([]);
      setVendorsError(error?.message || "Unable to load active vendors.");
    } finally {
      setVendorsLoading(false);
    }
  };

  const toggleVendorExpanded = (vendorId) => {
    setExpandedVendorIds((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId],
    );
    setSelectedVendorId(vendorId);
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(circle at top, rgba(212, 175, 55, 0.16), transparent 32%), linear-gradient(180deg, #f7f3e8 0%, #f4efe3 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "85vh",
          padding: "32px 20px 48px",
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
            marginBottom: 28,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                color: "#d4af37",
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              Porch P.O. Box
            </div>
            <h2
              style={{
                margin: "10px 0 12px",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
              }}
            >
              {mainPageTitle}
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                color: "#d3d3d3",
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              {mainPageMessage}
            </p>
            {!user && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  to="/register"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "#d4af37",
                    color: "#121212",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                  }}
                >
                  Get Started Free
                </Link>
                <Link
                  to="/about"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "rgba(255,255,255,0.08)",
                    color: "#f5f5f5",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  Learn More
                </Link>
              </div>
            )}
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
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#8a6a00",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Active Locations
              </div>
              <h4 style={{ margin: "8px 0 4px" }}>Porch P.O. Boxes</h4>
              <p style={{ margin: 0, fontSize: 12, color: "#999" }}>Click a location to see it on the map</p>
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
                      borderBottom: "1px solid #ece5d5",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleVendorExpanded(vendor.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 0",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "#181818",
                      }}
                    >
                      <strong>{vendor.businessName || "Unnamed partner"}</strong>
                      <span style={{ fontSize: 12, color: "#8a6a00" }}>
                        {expandedVendorIds.includes(vendor.id) ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedVendorIds.includes(vendor.id) && (
                      <div
                        style={{
                          paddingBottom: 12,
                          color: "#555",
                          fontSize: "0.9em",
                        }}
                      >
                        {(vendor.streetAddress || vendor.city) && (
                          <div>
                            {[
                              vendor.streetAddress,
                              vendor.city,
                              vendor.state,
                              vendor.zipCode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                        <div style={{ marginTop: 4 }}>
                          Store Hours:{" "}
                          {vendor.storeHours ||
                            vendor.store_hours ||
                            "Not provided"}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {vendorMarkers.length > 0 && (
            <div
              style={{
                flex: "1 1 400px",
                minWidth: 300,
                maxWidth: 560,
                height: 420,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
            >
              <MapContainer
                center={[vendorMarkers[0].lat, vendorMarkers[0].lng]}
                zoom={12}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapFlyTo vendorMarkers={vendorMarkers} selectedVendorId={selectedVendorId} />
                {vendorMarkers.map(({ vendor, lat, lng }) => (
                  <Marker key={vendor.id} position={[lat, lng]}>
                    <Popup>
                      <strong>{vendor.businessName}</strong>
                      <br />
                      {[vendor.streetAddress, vendor.city, vendor.state]
                        .filter(Boolean)
                        .join(", ")}
                      <br />
                      {vendor.storeHours || vendor.store_hours || ""}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          <div
            style={{
              flex: "1 1 520px",
              minWidth: 320,
              maxWidth: 720,
              background: "#fff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#8a6a00",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {user && userStatus === "active"
                  ? "Member Access"
                  : "Subscription Plans"}
              </div>
              <h4 style={{ margin: "8px 0 6px" }}>
                {user && userStatus === "active"
                  ? `Welcome back${user.displayName ? ", " + user.displayName.split(" ")[0] : ""}!`
                  : "Choose a Plan"}
              </h4>
              <p style={{ margin: 0, color: "#666" }}>
                {user && userStatus === "active"
                  ? "Your subscription is active. Use any Porch P.O. Box location to receive your packages."
                  : "Pick the plan that fits your needs. Your first delivery is on us — no subscription required to try it."}
              </p>
            </div>
            {user && userStatus === "active" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Link to="/profile" style={{ display: "inline-block", padding: "10px 20px", background: "#121212", color: "#fff", borderRadius: 10, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                  View My Profile
                </Link>
                <Link to="/profile/settings" style={{ display: "inline-block", padding: "10px 20px", background: "#f5f5f5", color: "#333", borderRadius: 10, fontWeight: 600, textDecoration: "none", textAlign: "center", border: "1px solid #ddd" }}>
                  Update Preferred Location
                </Link>
              </div>
            ) : (
              <OneTimeProduct user={user} />
            )}
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
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#0b3f66",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Promotion
          </div>
          <h4 style={{ margin: "8px 0 6px", color: "#181818" }}>
            Try Porch P.O. Box for free!
          </h4>
          <p style={{ margin: 0, color: "#0d3555", lineHeight: 1.6 }}>
            Sign up today and get your first package delivered to a Porch P.O.
            Box for free.
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
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6a4a00",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Referrals
          </div>
          <h4 style={{ margin: "8px 0 6px", color: "#181818" }}>
            Invite a partner. Earn free service for a YEAR.
          </h4>
          <p style={{ margin: 0, color: "#3f3210", lineHeight: 1.6 }}>
            Know a local business that would make a great Porch P.O. Box partner? Refer them — if they join, you get a whole year of free service.
          </p>
          <Link
            to="/referrals"
            style={{
              display: "inline-block",
              marginTop: 14,
              color: "#6a4a00",
              fontWeight: 600,
            }}
          >
            Submit a Referral →
          </Link>
        </div>
      </div>
      <footer style={{ padding: "1.5em", background: "#111", color: "#aaa", fontSize: 14 }}>
        <center>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 20px" }}>
            <Link to="/partner" style={{ color: "#ccc" }}>Partners</Link>
            <Link to="/contact" style={{ color: "#ccc" }}>Contact</Link>
            <Link to="/about" style={{ color: "#ccc" }}>About</Link>
            <Link to="/terms" style={{ color: "#ccc" }}>Terms &amp; Policies</Link>
          </div>
          <div style={{ marginTop: 10, color: "#555", fontSize: 12 }}>
            &copy; {new Date().getFullYear()} Porch P.O. Box
          </div>
        </center>
      </footer>
    </div>
  );
};

export default MainPage;
