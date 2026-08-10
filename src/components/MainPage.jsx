import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import OneTimeProduct from "./OneTimeProduct";
import { db } from "../firebase";
import { getApiUrl } from "../config/api";
import "./MainPage.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MAIN_PAGE_MESSAGE =
  "Secure package delivery through trusted local community partners .";

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceMiles = (a, b) => {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const formatDistance = (mi) => {
  if (mi < 0.1) return `${Math.round(mi * 5280)} ft away`;
  if (mi < 10) return `${mi.toFixed(1)} mi away`;
  return `${Math.round(mi)} mi away`;
};

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MainPage = ({ user, userStatus, partnerProfile }) => {
  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState("");
  const [expandedVendorIds, setExpandedVendorIds] = useState([]);
  const [vendorMarkers, setVendorMarkers] = useState([]);
  const [userWaitingCount, setUserWaitingCount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [plansExpanded, setPlansExpanded] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [prefLocation, setPrefLocation] = useState(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState("");

  const filteredVendors = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activeVendors;
    return activeVendors.filter((v) => {
      const city = (v.city || "").toLowerCase();
      const zip = (v.zipCode || "").toLowerCase();
      return city.includes(term) || zip.includes(term);
    });
  }, [activeVendors, searchTerm]);

  const filteredMarkers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return vendorMarkers;
    return vendorMarkers.filter(({ vendor }) => {
      const city = (vendor.city || "").toLowerCase();
      const zip = (vendor.zipCode || "").toLowerCase();
      return city.includes(term) || zip.includes(term);
    });
  }, [vendorMarkers, searchTerm]);

  const vendorsWithDistance = useMemo(() => {
    if (!userCoords)
      return filteredVendors.map((vendor) => ({ vendor, distance: Infinity }));
    return [...filteredVendors]
      .map((vendor) => {
        const marker = vendorMarkers.find((m) => m.vendor.id === vendor.id);
        return marker
          ? { vendor, distance: distanceMiles(userCoords, marker) }
          : { vendor, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [filteredVendors, vendorMarkers, userCoords]);

  const markersWithDistance = useMemo(() => {
    if (!userCoords) return filteredMarkers;
    return [...filteredMarkers]
      .map((marker) => ({
        ...marker,
        distance: distanceMiles(userCoords, marker),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [filteredMarkers, userCoords]);

  const mapCenter = useMemo(() => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (markersWithDistance.length > 0)
      return [markersWithDistance[0].lat, markersWithDistance[0].lng];
    return [37.7749, -122.4194];
  }, [userCoords, markersWithDistance]);

  useEffect(() => {
    fetchActiveVendors();
  }, []);

  useEffect(() => {
    if (activeVendors.length === 0) return;
    let cancelled = false;

    const geocode = async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const cacheKey = "porchpobox_geocode_cache_v1";
      let cache = {};
      try {
        cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      } catch {}

      const results = [];
      for (const vendor of activeVendors) {
        if (cancelled) return;
        const addr = [
          vendor.streetAddress,
          vendor.city,
          vendor.state,
          vendor.zipCode,
        ]
          .filter(Boolean)
          .join(", ");
        if (!addr) continue;

        const cached = cache[addr];
        if (cached) {
          results.push({ vendor, lat: cached.lat, lng: cached.lng });
          continue;
        }

        let marker = null;
        for (let attempt = 0; attempt < 3 && !marker; attempt += 1) {
          if (cancelled) return;
          let res;
          try {
            res = await fetch(
              `${getApiUrl("/api/geocode")}?q=${encodeURIComponent(addr)}&limit=1`,
              { headers: { "Accept-Language": "en" } },
            );
            const payload = await res.json();
            const data = payload.results || [];
            if (data[0]) {
              marker = {
                vendor,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
              cache[addr] = { lat: marker.lat, lng: marker.lng };
              try {
                localStorage.setItem(cacheKey, JSON.stringify(cache));
              } catch {}
            }
          } catch {}
          if (!marker && res?.status === 429) {
            await sleep(1200 * (attempt + 1));
          }
        }
        if (marker) results.push(marker);
        await sleep(1100);
      }

      if (!cancelled) setVendorMarkers(results);
    };

    geocode();
    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    if (!user || !user.uid) {
      setPrefLocation(null);
      return;
    }
    const loadPref = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setPrefLocation(snap.data().prefLocation || null);
      } catch (err) {
        console.error("Error loading preferred location:", err);
      }
    };
    loadPref();
  }, [user]);

  useEffect(() => {
    const term = addressQuery.trim();
    if (term.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const cacheKey = "porchpobox_geocode_cache_v1";
    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    } catch {}

    const cached = cache[`suggest:${term.toLowerCase()}`];
    if (cached) {
      setSuggestions(cached);
      setSuggestionsOpen(true);
      return;
    }

    let cancelled = false;
    const delay = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await fetch(
          `${getApiUrl("/api/geocode")}?q=${encodeURIComponent(term)}&limit=5`,
          { headers: { "Accept-Language": "en" } },
        );
        const payload = await res.json();
        const data = payload.results || [];
        if (!cancelled) {
          const mapped = data.map((r) => ({
            display_name: r.display_name,
            lat: r.lat,
            lon: r.lon,
          }));
          setSuggestions(mapped);
          setSuggestionsOpen(mapped.length > 0);
          cache[`suggest:${term.toLowerCase()}`] = mapped;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cache));
          } catch {}
        }
      } catch {
        if (!cancelled) setSuggestionsOpen(false);
      } finally {
        if (!cancelled) setSuggesting(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(delay);
    };
  }, [addressQuery]);

  const handleSuggestionSelect = (suggestion) => {
    setAddressQuery(suggestion.display_name);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setUserCoords({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setLocateError("");
  };

  const handleLocate = async (e) => {
    e.preventDefault();
    const q = addressQuery.trim();
    if (!q) return;
    setLocating(true);
    setLocateError("");
    try {
      const res = await fetch(
        `${getApiUrl("/api/geocode")}?q=${encodeURIComponent(q)}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const payload = await res.json();
      const data = payload.results || [];
      if (data[0]) {
        setUserCoords({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      } else {
        setLocateError(
          "We couldn't find that address. Try adding a city and state, or a ZIP code.",
        );
      }
    } catch (err) {
      console.error("Error locating address:", err);
      setLocateError(
        "Something went wrong while locating your address. Please try again.",
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSetPreferred = async (vendor) => {
    if (!user || !user.uid) {
      setPrefMessage("Please log in to set your preferred Porch P.O. Box.");
      return;
    }
    setPrefMessage("");
    setPrefSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        prefLocation: {
          id: vendor.id,
          businessName: vendor.businessName || "Unknown",
          streetAddress: vendor.streetAddress || "",
          city: vendor.city || "",
          state: vendor.state || "",
          zipCode: vendor.zipCode || "",
        },
      });
      setPrefLocation({
        id: vendor.id,
        businessName: vendor.businessName || "Unknown",
      });
      setPrefMessage(
        `${vendor.businessName || "This location"} is now your preferred Porch P.O. Box.`,
      );
    } catch (err) {
      console.error("Error saving preferred location:", err);
      setPrefMessage("Could not save your preferred location. Please try again.");
    } finally {
      setPrefSaving(false);
    }
  };

  const isPreferred = (vendorId) => prefLocation?.id === vendorId;

  // Fetch aggregate waiting package count for members
  useEffect(() => {
    if (!user || !user.uid || activeVendors.length === 0) return;

    const fetchUserStats = async () => {
      try {
        let totalWaiting = 0;
        await Promise.all(
          activeVendors.map(async (vendor) => {
            const countSnap = await getDoc(
              doc(db, "partners", vendor.id, "packageCounts", user.uid),
            );
            if (countSnap.exists()) {
              totalWaiting += Number(countSnap.data().count) || 0;
            }
          }),
        );
        setUserWaitingCount(totalWaiting);
      } catch (err) {
        console.error("Error fetching user stats for main page:", err);
      }
    };

    fetchUserStats();
  }, [user, activeVendors]);

  const toggleVendorExpanded = (vendorId) => {
    setExpandedVendorIds((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId],
    );
  };

  const scrollToLocations = () => {
    document
      .getElementById("locations")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isActiveMember =
    user &&
    (userStatus === "active" ||
      userStatus === "trial" ||
      userStatus === "member");

  return (
    <div className="mp">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mp-hero" aria-label="Introduction">
        <div className="mp-container mp-hero__grid">
          <div className="mp-hero__content">
            <div className="mp-eyebrow">📦 Secure Local Package Receiving</div>
            <h1 className="mp-hero__title">
              NEVER MISS A PACKAGE.
              <br />
              GET IT DELIVERED SOMEWHERE SAFE.
              <br />
              <span className="mp-hero__title-accent">GET PAID.</span>
            </h1>
            <p className="mp-hero__subtitle">{MAIN_PAGE_MESSAGE}</p>
            <center>
              <div className="mp-hero__locations">
                <center>
                  <p>
                    Now Serving Bay Area Residents at
                    <br />
                    <h5>
                      <button
                        onClick={scrollToLocations}
                        style={{ border: "none", color: "#1557d6" }}
                      >
                        <strong>{activeVendors.length} Active Locations</strong>
                      </button>
                    </h5>
                  </p>
                </center>
              </div>
            </center>
            <div className="mp-hero__actions">
              <button
                type="button"
                className="mp-btn mp-btn--primary"
                onClick={scrollToLocations}
              >
                Find a PorchPObox
              </button>
              <Link
                className="mp-btn mp-btn--outline-green"
                to="/become-a-partner"
              >
                Become a Partner
              </Link>
            </div>
            <div className="mp-hero__trust">
              <span>
                <span className="mp-check">✓</span> Secure & Safe
              </span>
              <span>
                <span className="mp-check">✓</span> Convenient Pickup
              </span>
              <span>
                <span className="mp-check">✓</span> Trusted Local Partners
              </span>
            </div>
            <div className="mp-hero__rating">
              <span className="mp-hero__stars" aria-hidden>
                ★★★★★
              </span>
              <span className="mp-hero__rating-text">
                Trusted by local residents
              </span>
            </div>
          </div>
          <div className="mp-hero__photo">
            <img
              src="/partnerPic.png"
              alt="A delivery being received at a Porch P.O. Box partner location"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section
        className="mp-section"
        id="how-it-works"
        aria-labelledby="how-heading"
      >
        <div className="mp-container">
          <div className="mp-section-header">
            <div className="mp-section-label">Simple & Convenient</div>
            <h2 id="how-heading" className="mp-section-title">
              How Porch P.O. Box Works
            </h2>
            <p className="mp-section-sub">
              No more worrying about packages sitting outside. Send your
              deliveries to a trusted location and pick them up when it's
              convenient for you.
            </p>
          </div>
          <div className="mp-steps">
            <div className="mp-step">
              <div className="mp-step__number">1</div>
              <div className="mp-step__icon" aria-hidden>
                🏠
              </div>
              <h3 className="mp-step__title">Choose a PorchPObox</h3>
              <p className="mp-step__desc">
                Search for a trusted Porch P.O. Box partner near you.
              </p>
            </div>
            <div className="mp-step">
              <div className="mp-step__number">2</div>
              <div className="mp-step__icon" aria-hidden>
                📦
              </div>
              <h3 className="mp-step__title">
                Ship Packages to Your Local Porch P.O. Box
              </h3>
              <p className="mp-step__desc">
                Use your Porch P.O. Box address when checking out online.
              </p>
            </div>
            <div className="mp-step">
              <div className="mp-step__number">3</div>
              <div className="mp-step__icon" aria-hidden>
                😊
              </div>
              <h3 className="mp-step__title">Pick Up Securely</h3>
              <p className="mp-step__desc">
                Get notified and pick up your package when it's convenient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why people love ──────────────────────────────────── */}
      <section className="mp-section mp-benefits" aria-labelledby="why-heading">
        <div className="mp-container">
          <div className="mp-section-header">
            <div className="mp-section-label">Why Porch P.O. Box</div>
            <h2 id="why-heading" className="mp-section-title">
              A Better Way to Receive Packages
            </h2>
            <p className="mp-section-sub">
              Your packages stay off the porch and with someone you trust.
            </p>
          </div>
          <div className="mp-benefit-grid">
            <div className="mp-benefit">
              <div className="mp-benefit__icon">🛡️</div>
              <h3 className="mp-benefit__title">Stop porch pirates</h3>
              <p className="mp-benefit__text">
                Packages are received and stored by trusted local partners.
              </p>
            </div>
            <div className="mp-benefit">
              <div className="mp-benefit__icon">📬</div>
              <h3 className="mp-benefit__title">Never miss deliveries</h3>
              <p className="mp-benefit__text">
                Get notified when your package arrives safely.
              </p>
            </div>
            <div className="mp-benefit">
              <div className="mp-benefit__icon">🏢</div>
              <h3 className="mp-benefit__title">Peace of Mind</h3>
              <p className="mp-benefit__text">
                No more worrying about packages sitting unattended outside.{" "}
              </p>
            </div>
            <div className="mp-benefit">
              <div className="mp-benefit__icon">📍</div>
              <h3 className="mp-benefit__title">Safe neighborhood pickup</h3>
              <p className="mp-benefit__text">
                Pick up close to home at your convenience.
              </p>
            </div>
            <div className="mp-benefit">
              <div className="mp-benefit__icon">💲</div>
              <h3 className="mp-benefit__title">Affordable monthly pricing</h3>
              <p className="mp-benefit__text">
                Simple pricing with no hidden fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Locations ────────────────────────────────────────── */}
      <section className="mp-section" aria-label="Locations">
        <div className="mp-container">
          <div className="mp-section-header">
            <div className="mp-section-label">Active Locations</div>
            <h2 className="mp-section-title">Find a Porch P.O. Box Near You</h2>
            <p className="mp-section-sub">
              Enter your address to find a trusted package pickup location
              nearby.{" "}
            </p>
          </div>
          <form className="mp-locate" onSubmit={handleLocate} role="search">
            <div className="mp-locate__bar">
              <span className="mp-locate__icon" aria-hidden>
                📍
              </span>
              <div className="mp-locate__input-wrap">
                <input
                  type="search"
                  className="mp-locate__input"
                  placeholder="Enter your address, city, or ZIP code..."
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setSuggestionsOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSuggestionsOpen(false);
                  }}
                  aria-label="Enter your address to find nearby boxes"
                  role="combobox"
                  aria-expanded={suggestionsOpen}
                  aria-controls="mp-locate-suggestions"
                  aria-autocomplete="list"
                />
                {suggesting && (
                  <span className="mp-locate__spinner" aria-hidden />
                )}
                {suggestionsOpen && suggestions.length > 0 && (
                  <ul
                    id="mp-locate-suggestions"
                    className="mp-locate__suggestions"
                    role="listbox"
                  >
                    {suggestions.map((suggestion, index) => (
                      <li key={`${suggestion.display_name}-${index}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          className="mp-locate__suggestion"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                className="mp-btn mp-btn--primary mp-locate__submit"
                disabled={locating}
              >
                {locating ? "Locating…" : "Find Nearby"}
              </button>
            </div>
            {locateError && <p className="mp-error mp-locate__error">{locateError}</p>}
            {userCoords && (
              <p className="mp-locate__result">
                Showing boxes near your address, closest first.
                <button
                  type="button"
                  className="mp-locate__clear"
                  onClick={() => setUserCoords(null)}
                >
                  Clear
                </button>
              </p>
            )}
          </form>
          <div className="mp-grid" id="locations">
            <section
              className="mp-card mp-card--cream"
              aria-labelledby="locations-heading"
            >
              <div className="mp-card__label">Active locations</div>
              <h3 id="locations-heading" className="mp-card__title">
                Porch P.O. Boxes
              </h3>

              {!vendorsLoading && !vendorsError && activeVendors.length > 0 && (
                <div className="mp-search-wrap">
                  <input
                    type="search"
                    className="mp-search"
                    placeholder="Filter by city or zip..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {vendorsLoading ? (
                <p className="mp-muted mp-muted--italic">Loading partners…</p>
              ) : vendorsError ? (
                <p className="mp-error">{vendorsError}</p>
              ) : activeVendors.length === 0 ? (
                <p className="mp-muted">
                  No active partner locations yet. Check back soon or{" "}
                  <Link to="/contact">contact us</Link> to learn more.
                </p>
              ) : vendorsWithDistance.length === 0 ? (
                <p className="mp-muted">No locations match your search.</p>
              ) : (
                <>
                  {prefMessage && (
                    <p className="mp-locate__message" role="status">
                      {prefMessage}
                    </p>
                  )}
                  <ul className="mp-vendor-list">
                    {vendorsWithDistance.map(({ vendor, distance }) => (
                      <li
                        key={vendor.id}
                        className={`mp-vendor-item${isPreferred(vendor.id) ? " mp-vendor-item--preferred" : ""}`}
                      >
                        <button
                          type="button"
                          className="mp-vendor-toggle"
                          onClick={() => toggleVendorExpanded(vendor.id)}
                          aria-expanded={expandedVendorIds.includes(vendor.id)}
                        >
                          <strong>
                            {vendor.businessName || "Unnamed partner"}
                          </strong>
                          <span className="mp-vendor-toggle__right">
                            {userCoords && Number.isFinite(distance) && (
                              <span className="mp-vendor-distance">
                                {formatDistance(distance)}
                              </span>
                            )}
                            {isPreferred(vendor.id) && (
                              <span className="mp-vendor-badge" aria-label="Your preferred location">
                                ✓ Preferred
                              </span>
                            )}
                            <span className="mp-vendor-chevron" aria-hidden>
                              {expandedVendorIds.includes(vendor.id) ? "▲" : "▼"}
                            </span>
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
                            <div className="mp-vendor-detail__hours">
                              Store hours:{" "}
                              {vendor.storeHours ||
                                vendor.store_hours ||
                                "Not provided"}
                            </div>
                            {user?.uid && !prefLocation && (
                              <button
                                type="button"
                                className="mp-btn mp-btn--green mp-vendor-pref-btn"
                                onClick={() => handleSetPreferred(vendor)}
                                disabled={prefSaving}
                              >
                                Set as my preferred Porch P.O. Box
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {markersWithDistance.length > 0 && (
              <div
                className="mp-card mp-map-wrap"
                role="region"
                aria-label="Map of partner locations"
              >
                <MapContainer
                  center={mapCenter}
                  zoom={userCoords ? 13 : 12}
                  style={{ width: "100%", height: "100%" }}
                >
                  <MapRecenter center={mapCenter} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {userCoords && (
                    <Circle
                      center={[userCoords.lat, userCoords.lng]}
                      radius={600}
                      pathOptions={{ color: "#1557d6", fillColor: "#1557d6", fillOpacity: 0.15 }}
                    >
                      <Popup>Your address</Popup>
                    </Circle>
                  )}
                  {markersWithDistance.map(({ vendor, lat, lng, distance }) => (
                    <Marker key={vendor.id} position={[lat, lng]}>
                      <Popup>
                        <strong>{vendor.businessName}</strong>
                        <br />
                        {[vendor.streetAddress, vendor.city, vendor.state]
                          .filter(Boolean)
                          .join(", ")}
                        {userCoords && Number.isFinite(distance) && (
                          <>
                            <br />
                            {formatDistance(distance)}
                          </>
                        )}
                        <br />
                        {vendor.storeHours || vendor.store_hours || ""}
                        {isPreferred(vendor.id) && (
                          <>
                            <br />
                            ✓ Your preferred location
                          </>
                        )}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            <section
              className="mp-card mp-card--white mp-card--signup"
              aria-labelledby="signup-heading"
            >
              <div className="mp-card__label">
                {isActiveMember
                  ? userStatus === "trial"
                    ? "Trial"
                    : "Member access"
                  : "Subscription plans"}
              </div>
              <h3 id="signup-heading" className="mp-card__title">
                {isActiveMember
                  ? "Welcome to Porch P.O. Box"
                  : "From $20/month"}
              </h3>
              <p className="mp-card__desc">
                {isActiveMember ? (
                  <>
                    Your subscription is{" "}
                    {userStatus === "trial" ? "in trial status" : "active"}.
                    {userWaitingCount !== null && userWaitingCount > 0 && (
                      <strong>
                        {" "}
                        <Link to="/profile" className="mp-link">
                          You currently have {userWaitingCount} package
                          {userWaitingCount !== 1 ? "s" : ""} waiting for
                          pickup.
                        </Link>
                      </strong>
                    )}
                    {userWaitingCount === 0 && (
                      <> &nbsp;No packages waiting for pickup.</>
                    )}
                    &nbsp;
                    <Link to="/profile" className="mp-link">
                      You can manage your deliveries from your profile.
                    </Link>
                  </>
                ) : (
                  "Pick a plan and start sending packages to a nearby partner location."
                )}
              </p>
              {!isActiveMember && !partnerProfile && (
                <>
                  <ul className="mp-plans-features">
                    <li>Unlimited package receiving</li>
                    <li>No contracts or hidden fees</li>
                    <li>Cancel anytime</li>
                  </ul>
                  <Link
                    className="mp-btn mp-btn--dark mp-plans-cta"
                    to="/plans"
                  >
                    Choose your plan
                  </Link>
                  <button
                    type="button"
                    className="mp-plans-toggle"
                    onClick={() => setPlansExpanded((v) => !v)}
                    aria-expanded={plansExpanded}
                  >
                    {plansExpanded
                      ? "Hide plan options"
                      : "Compare plan options"}
                    <span className="mp-plans-toggle__chevron" aria-hidden>
                      {plansExpanded ? "▲" : "▼"}
                    </span>
                  </button>
                  {plansExpanded && (
                    <div style={{ marginTop: 14 }}>
                      <OneTimeProduct user={user} compact />
                    </div>
                  )}
                </>
              )}
              {!isActiveMember && partnerProfile && (
                <p
                  className="mp-muted mp-muted--italic"
                  style={{ marginTop: 20 }}
                >
                  Log in as user to view current subscription plans.
                </p>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────
      <section
        className="mp-section mp-pricing"
        aria-labelledby="pricing-heading"
      >
        <div className="mp-container">
          <div className="mp-section-header">
            <div className="mp-section-label">Pricing</div>
            <h2 id="pricing-heading" className="mp-section-title">
              Simple, affordable pricing
            </h2>
            <p className="mp-section-sub">
              Pick a plan and start sending packages to a nearby partner
              location.
            </p>
          </div>
          <div className="mp-pricing__card">
            <div className="mp-pricing__price">
              $20<span className="mp-pricing__per">/month</span>
            </div>
            <ul className="mp-pricing__list">
              <li>Unlimited package receiving</li>
              <li>No contracts</li>
              <li>Cancel anytime</li>
            </ul>
            <Link className="mp-btn mp-btn--primary" to="/register">
              Start Free
            </Link>
          </div>
        </div>
      </section> */}

      {/* ── Promo ────────────────────────────────────────────── */}
      {/* <div className="mp-container">
        <section className="mp-promo" aria-labelledby="promo-heading">
          <div className="mp-promo__text">
            <div className="mp-promo__badge">Limited-time offer</div>
            <h2 id="promo-heading" className="mp-promo__title">
              Try Porch P.O. Box for free!
            </h2>
            <p className="mp-promo__desc">
              Sign up today and get your first package delivered to a Porch P.O.
              Box for free!
            </p>
          </div>
          <div className="mp-promo__actions">
            <Link className="mp-btn mp-btn--primary" to="/plans">
              See plans
            </Link>
          </div>
        </section>
      </div> */}
      {/* ── Testimonials ─────────────────────────────────────── */}
      <section
        className="mp-section mp-testimonials"
        aria-labelledby="testimonials-heading"
      >
        <div className="mp-container">
          <div className="mp-section-header">
            <div className="mp-section-label">Customer Experiences</div>
            <h2 id="testimonials-heading" className="mp-section-title">
              What people say
            </h2>
            <p className="mp-section-sub">
              Real convenience from a service built around local communities.
            </p>
          </div>
          <div className="mp-testimonials__grid">
            <div className="mp-testimonials__card">
              <div className="mp-testimonials__stars" aria-hidden>
                ★★★★★
              </div>
              <p className="mp-testimonials__quote">
                "I used to worry about packages sitting on my porch all day. Now
                I just pick them up after work."{" "}
              </p>
              <div className="mp-testimonials__author">— Sarah M.</div>
            </div>
            <div className="mp-testimonials__card">
              <div className="mp-testimonials__stars" aria-hidden>
                ★★★★★
              </div>
              <p className="mp-testimonials__quote">
                "Our apartment residents love it."
              </p>
              <div className="mp-testimonials__author">— Property Manager</div>
            </div>
            <div className="mp-testimonials__card">
              <div className="mp-testimonials__stars" aria-hidden>
                ★★★★★
              </div>
              <p className="mp-testimonials__quote">
                "We earn extra income every month."
              </p>
              <div className="mp-testimonials__author">— Local Business</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner / Income ─────────────────────────────────── */}
      <section
        className="mp-section mp-partner"
        aria-labelledby="income-heading"
      >
        <div className="mp-container mp-partner__grid">
          <div className="mp-partner__content">
            <div className="mp-section-label mp-section-label--green">
              For Local Businesses
            </div>
            <h2 id="income-heading" className="mp-partner__title">
              Turn Your Community Space Into Extra Income{" "}
            </h2>
            <p className="mp-partner__text">
              Turn unused space at your business into an additional source of
              income while helping your neighbors receive packages safely.
            </p>
            <ul className="mp-partner__list">
              <li>
                <span className="mp-check">✓</span> Earn $10 for every
                subscriber you refer
              </li>
              <li>
                <span className="mp-check">✓</span> Attract more foot traffic to
                your business
              </li>
              <li>
                <span className="mp-check">✓</span> Provide a valuable service
                to your community
              </li>
              <li>
                <span className="mp-check">✓</span> Make money from space you
                already have
              </li>
            </ul>
            <Link className="mp-btn mp-btn--green" to="/become-a-partner">
              Become a Partner
            </Link>
          </div>
          <div className="mp-partner__visual">
            <img
              src="/partnerPic.png"
              alt="Local business owner receiving a package"
            />
            <div className="mp-earn-card">
              <small>How Partners Earn</small>
              <strong>$10</strong>
              <span>for every subscriber you refer</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="mp-final-cta" aria-label="Get started">
        <div className="mp-container mp-final-cta__inner">
          <div>
            <h2 className="mp-final-cta__title">
              Ready to stop package theft?
            </h2>
            <p className="mp-final-cta__sub">
              Find a trusted Porch P.O. Box near you and ship with confidence.
            </p>
          </div>
          <div className="mp-final-cta__actions">
            <button
              type="button"
              className="mp-btn mp-btn--light"
              onClick={scrollToLocations}
            >
              Find My PorchPObox
            </button>
            <Link className="mp-btn mp-btn--green" to="/become-a-partner">
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ── Referral ─────────────────────────────────────────── */}
      <div className="mp-container mp-referral">
        <section
          className="mp-banner mp-banner--referral"
          aria-labelledby="referral-heading"
        >
          <div className="mp-banner__label">Referrals</div>
          <h3 id="referral-heading" className="mp-banner__title">
            Invite a partner — earn a year of free service
          </h3>
          <p className="mp-banner__text">
            Wish you had a Porch P.O. Box nearby? Tell a local business about
            us. If they partner with us, we will thank you with a full year of
            free service.
          </p>
          <div className="mp-banner__actions">
            <Link className="mp-btn mp-btn--gold-text" to="/referrals">
              Submit a referral →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainPage;
