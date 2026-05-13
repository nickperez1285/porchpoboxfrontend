import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import OneTimeProduct from "./OneTimeProduct";
import Footer from "./Footer";
import { db } from "../firebase";
import "./MainPage.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MAIN_PAGE_TITLE =
  "Secure Package Receiving Through Local Partner Locations";

const MAIN_PAGE_MESSAGE =
  "Get your packages delivered and securely stored at a trusted local neighborhood Porch P.O. Box.";

const MainPage = ({ user, userStatus }) => {
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");
  const [expandedVendorIds, setExpandedVendorIds] = useState([]);
  const [vendorMarkers, setVendorMarkers] = useState([]);

  useEffect(() => {
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
  };

  const isActiveMember = user && userStatus === "active";

  return (
    <div className="mp">
      <div className="mp-inner">
        <section className="mp-hero" aria-label="Introduction">
          <div className="mp-hero__text">
            <div className="mp-hero__eyebrow">Porch P.O. Box</div>
            <h2 className="mp-hero__title">{MAIN_PAGE_TITLE}</h2>
            <p className="mp-hero__lead">{MAIN_PAGE_MESSAGE}</p>
          </div>
          <div className="mp-hero__actions">
            <Link className="mp-btn mp-btn--primary" to="/plans">
              View plans
            </Link>
            <Link className="mp-btn mp-btn--ghost" to="/about">
              How it works
            </Link>
            <Link className="mp-btn mp-btn--ghost" to="/contact">
              Contact
            </Link>
          </div>
        </section>

        <div className="mp-grid">
          <section className="mp-card mp-card--cream" aria-labelledby="locations-heading">
            <div className="mp-card__label">Active locations</div>
            <h2 id="locations-heading" className="mp-card__title">
              Porch P.O. Boxes
            </h2>
            {vendorsLoading ? (
              <p className="mp-muted mp-muted--italic">Loading partners…</p>
            ) : vendorsError ? (
              <p className="mp-error">{vendorsError}</p>
            ) : activeVendors.length === 0 ? (
              <p className="mp-muted">
                No active partner locations yet. Check back soon or{" "}
                <Link to="/contact">contact us</Link> to learn more.
              </p>
            ) : (
              <ul className="mp-vendor-list">
                {activeVendors.map((vendor) => (
                  <li key={vendor.id} className="mp-vendor-item">
                    <button
                      type="button"
                      className="mp-vendor-toggle"
                      onClick={() => toggleVendorExpanded(vendor.id)}
                      aria-expanded={expandedVendorIds.includes(vendor.id)}
                    >
                      <strong>{vendor.businessName || "Unnamed partner"}</strong>
                      <span className="mp-vendor-chevron" aria-hidden>
                        {expandedVendorIds.includes(vendor.id) ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedVendorIds.includes(vendor.id) && (
                      <div className="mp-vendor-detail">
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
                          Store hours:{" "}
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
          </section>

          {vendorMarkers.length > 0 && (
            <div
              className="mp-card mp-map-wrap"
              role="region"
              aria-label="Map of partner locations"
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

          <section className="mp-card mp-card--white" aria-labelledby="signup-heading">
            <div className="mp-card__label">
              {isActiveMember ? "Member access" : "Subscription plans"}
            </div>
            <h2 id="signup-heading" className="mp-card__title">
              {isActiveMember ? "Welcome to Porch P.O. Box" : "Sign up"}
            </h2>
            <p className="mp-card__desc">
              {isActiveMember
                ? "Your subscription is active. You can keep using Porch P.O. Box services from your profile."
                : "Choose a subscription that fits your deliveries and start sending packages to a nearby partner location."}
            </p>
            {!isActiveMember && (
              <div style={{ marginTop: 20 }}>
                <OneTimeProduct user={user} />
              </div>
            )}
          </section>
        </div>

        <div className="mp-banners">
          <section className="mp-banner mp-banner--promo" aria-labelledby="promo-heading">
            <div className="mp-banner__label">Promotion</div>
            <h3 id="promo-heading" className="mp-banner__title">
              Try Porch P.O. Box for free
            </h3>
            <p className="mp-banner__text">
              Sign up today and get your first package delivered to a Porch P.O.
              Box for free.
            </p>
            <div className="mp-banner__actions">
              <Link className="mp-btn mp-btn--dark" to="/plans">
                See plans
              </Link>
            </div>
          </section>

          <section className="mp-banner mp-banner--referral" aria-labelledby="referral-heading">
            <div className="mp-banner__label">Referrals</div>
            <h3 id="referral-heading" className="mp-banner__title">
              Invite a partner — earn a year of free service
            </h3>
            <p className="mp-banner__text">
              Wish you had a Porch P.O. Box nearby? Tell a local business about us.
              If they partner with us, we will thank you with a full year of free
              service.
            </p>
            <div className="mp-banner__actions">
              <Link className="mp-btn mp-btn--gold-text" to="/referrals">
                Submit a referral →
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MainPage;
