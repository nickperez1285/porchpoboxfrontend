import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import PrefLocationModal from "./PrefLocationModal";
import "./Profile.css";

const Card = ({ children, className = "" }) => (
  <div className={`data-card ${className}`}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div className="section-label">{children}</div>
);

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [packageHistory, setPackageHistory] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentPackagesWaiting = packageHistory.reduce(
    (sum, entry) => sum + (Number(entry.currentWaiting) || 0),
    0,
  );

  useEffect(() => {
    let isCancelled = false;

    if (!user?.uid) return;

    // 1. Subscribe to User Profile
    const unsubscribeProfile = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        if (!isCancelled && snapshot.exists()) setProfileData(snapshot.data());
      },
      (error) => {
        if (error.code === "permission-denied") {
          console.error(
            "CRITICAL: Permission denied reading user doc. Check /users/{userId} rule.",
            error,
          );
        } else {
          console.error("Error loading user profile:", error);
        }
      },
    );

    // 2. Subscribe to Package History
    setPackagesLoading(true);
    const unsubscribePackageHistory = onSnapshot(
      collection(db, "users", user.uid, "packageHistory"),
      (snapshot) => {
        const nextHistory = snapshot.docs.map((entry) => ({
          partnerId: entry.id,
          ...entry.data(),
        }));
        setPackageHistory(nextHistory);
        setPackagesLoading(false);
      },
      (error) => {
        if (error.code === "permission-denied") {
          console.error(
            "CRITICAL: Permission denied reading packageHistory. Check /users/{userId}/packageHistory rule.",
            error,
          );
        } else {
          console.error("Error loading package history:", error);
        }
        setPackagesLoading(false);
        setPackageHistory([]);
      },
    );

    return () => {
      isCancelled = true;
      unsubscribeProfile();
      unsubscribePackageHistory();
    };
  }, [user.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const [addressCopied, setAddressCopied] = useState(false);

  const handleShareReferral = () => {
    const shareData = {
      title: "Join Porch P.O. Box",
      text: `Get your packages delivered securely to a local business! Use my referral code: ${displayReferral}`,
      url: window.location.origin,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .catch((err) => console.log("Error sharing", err));
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert("Referral info copied to clipboard!");
    }
  };

  const displayReferral =
    profileData?.referralCode ||
    (user?.email ? user.email.substring(0, 2).toUpperCase() + "26" : "—");

  return (
    <div className="profile-wrap">
      <div className="profile-container">
        {/* ── Hero ── */}
        <div className="profile-hero">
          <div style={{ minWidth: isMobile ? "100%" : "auto" }}>
            <div className="profile-hero-eyebrow">My Profile</div>
            <div className="profile-hero-title">
              {user.displayName || profileData?.name || "Account Holder"}
            </div>
            <div className="profile-hero-email">{user.email}</div>
          </div>
          {(() => {
            const isSubActive =
              profileData?.status === "active" ||
              profileData?.status === "member";
            const subLabel = isSubActive
              ? "Active"
              : profileData?.status === "trial"
                ? "Trial"
                : "Inactive";
            const subClass = isSubActive
              ? "profile-status--active"
              : profileData?.status === "trial"
                ? "profile-status--trial"
                : "profile-status--inactive";
            const card = (
              <div
                className={`profile-hero-sub-card ${isSubActive ? "profile-hero-sub-card--ok" : "profile-hero-sub-card--warn"}`}
              >
                <div className="profile-hero-sub-label">Subscription</div>
                <div className="profile-hero-sub-body">
                  <span className={`profile-status-pill ${subClass}`}>
                    {subLabel}
                  </span>
                  {!isSubActive && (
                    <span className="profile-sub-cta">
                      {profileData?.status === "trial"
                        ? "Upgrade to keep receiving packages"
                        : "Choose a plan to get started"}
                    </span>
                  )}
                </div>
              </div>
            );
            return isSubActive ? card : <Link to="/plans" className="profile-sub-link-wrap">{card}</Link>;
          })()}
        </div>

        {/* ── Delivery Address ── (show whenever a preferred partner is set; street may be filled later) */}
        <div style={{ marginBottom: 28 }}>
          {profileData?.prefLocation &&
          (profileData.prefLocation.id ||
            profileData.prefLocation.businessName ||
            profileData.prefLocation.streetAddress) ? (
            <div className="profile-address-card">
              <div className="profile-address-header">
                <div>
                  <div className="profile-address-label">
                    <span>📦</span> Your Package Delivery Address
                  </div>
                  <div className="address-visual-box">
                    <div className="profile-address-name">
                      {user.displayName || profileData?.name || "Your Name"}
                    </div>
                    <div className="profile-address-vendor">
                      c/o{" "}
                      {profileData.prefLocation.id ? (
                        <Link
                          to={`/partner/${profileData.prefLocation.id}`}
                          className="profile-partner-link"
                        >
                          {profileData.prefLocation.businessName}
                        </Link>
                      ) : (
                        profileData.prefLocation.businessName
                      )}
                    </div>
                    {profileData.prefLocation.streetAddress ? (
                      <div className="profile-address-text">
                        {profileData.prefLocation.streetAddress}
                      </div>
                    ) : null}
                    {[
                      profileData.prefLocation.city,
                      profileData.prefLocation.state,
                      profileData.prefLocation.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") ? (
                      <div className="profile-address-text">
                        {[
                          profileData.prefLocation.city,
                          profileData.prefLocation.state,
                          profileData.prefLocation.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    ) : null}
                    {!profileData.prefLocation.streetAddress &&
                      ![
                        profileData.prefLocation.city,
                        profileData.prefLocation.state,
                        profileData.prefLocation.zipCode,
                      ].filter(Boolean).length && (
                        <div className="profile-address-note">
                          Full street address will appear here once your partner
                          completes their profile, or set a location in
                          settings.
                        </div>
                      )}
                  </div>
                  <p className="profile-address-hint">
                    Use this address when placing orders online. Packages are
                    held securely until you pick them up.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-copy-address"
                  onClick={() => {
                    setAddressCopied(true);
                    setTimeout(() => setAddressCopied(false), 2000); // Reset after 2 seconds

                    const addr = [
                      user.displayName || profileData?.name || "",
                      `c/o ${profileData.prefLocation.businessName}`,
                      profileData.prefLocation.streetAddress,
                      [
                        profileData.prefLocation.city,
                        profileData.prefLocation.state,
                        profileData.prefLocation.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ].join("\n");
                    navigator.clipboard.writeText(addr);
                  }}
                >
                  {addressCopied ? "✅ Copied!" : "📋 Copy Address"}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-no-address">
              {showPrefModal && (
                <PrefLocationModal
                  user={user}
                  onDone={() => setShowPrefModal(false)}
                />
              )}
              <div className="profile-address-header">
                <div className="profile-address-label">
                  <span>📦</span> Your Package Delivery Address
                </div>
                <div className="no-address-title">
                  Please select your preferred Porch P.O. Box location
                </div>
                <div className="no-address-text">
                  You need to choose a partner location before subscribing.
                </div>
              </div>
              <button
                type="button"
                className="btn-set-location"
                onClick={() => setShowPrefModal(true)}
              >
                Select Location
              </button>
            </div>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="profile-data-grid">
          {/* Package History */}
          <Card>
            <div className="card-header">
              <SectionLabel>Package History</SectionLabel>
              <Link to="/profile/packages" className="view-history-link">
                View Full History →
              </Link>
            </div>
            <div className="stats-grid">
              <div
                className={`stat-box ${currentPackagesWaiting > 0 ? "stat-box--active" : ""}`}
              >
                <div className="stat-label">Waiting</div>
                <div
                  className={`stat-value ${currentPackagesWaiting > 0 ? "stat-value--active" : ""}`}
                >
                  {currentPackagesWaiting}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Picked Up</div>
                <div className="stat-value">
                  {Number(profileData?.packagesDelivered) || 0}
                </div>
              </div>
            </div>

            {packagesLoading ? (
              <p className="profile-address-note">Loading...</p>
            ) : packageHistory.length === 0 ? (
              <p className="profile-address-note">No package history yet.</p>
            ) : (
              <div className="package-list">
                {packageHistory.map((pkg) => (
                  <Link
                    key={pkg.partnerId}
                    to={`/partner/${pkg.partnerId}`}
                    className="package-item"
                  >
                    <div className="package-vendor">📍 {pkg.partnerName}</div>
                    <div className="package-details">
                      <div>
                        <div className="package-detail-label">Received</div>
                        <div className="package-detail-value">
                          {pkg.totalPickedUp}
                        </div>
                      </div>
                      <div>
                        <div className="package-detail-label">Waiting</div>
                        <div
                          className={`package-detail-value ${pkg.currentWaiting > 0 ? "package-detail-value--active" : ""}`}
                        >
                          {pkg.currentWaiting}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Account */}
          <Card className="card--alt">
            <SectionLabel>Account</SectionLabel>

            {/* Preferred Location */}
            <div
              className={`card-section ${profileData?.prefLocation ? "card-section--location-ok" : "card-section--location-warn"}`}
            >
              <div className="section-label-inner">Preferred Location</div>
              {profileData?.prefLocation ? (
                <>
                  <div className="location-name">
                    {profileData.prefLocation.id ? (
                      <Link
                        to={`/partner/${profileData.prefLocation.id}`}
                        className="profile-partner-link"
                      >
                        {profileData.prefLocation.businessName}
                      </Link>
                    ) : (
                      profileData.prefLocation.businessName
                    )}
                  </div>
                  {profileData.prefLocation.streetAddress && (
                    <div className="location-address">
                      {[
                        profileData.prefLocation.streetAddress,
                        profileData.prefLocation.city,
                        profileData.prefLocation.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  <div className="location-actions">
                    <Link
                      to="/profile/settings?highlight=location"
                      className="change-location-link"
                    >
                      Change location
                    </Link>
                  </div>
                </>
              ) : (
                <Link to="/profile/settings" className="location-empty-link">
                  ⚠️ No location set — tap to choose one
                </Link>
              )}
            </div>

            {/* Referral Code */}
            <div className="card-section">
              <div className="section-label-inner">Your Referral Code</div>
              <div className="referral-code-wrap">
                <span className="referral-code-text">{displayReferral}</span>
                {displayReferral !== "—" && (
                  <button
                    type="button"
                    className="btn-copy-mini"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(displayReferral)
                        .then(() => alert("Referral code copied!"))
                    }
                  >
                    Copy
                  </button>
                )}
                {displayReferral !== "—" && (
                  <button
                    type="button"
                    className="btn-share-mini"
                    onClick={handleShareReferral}
                  >
                    Share
                  </button>
                )}
              </div>
              <div className="referral-hint">
                Share with a business to refer them as a partner.
              </div>
            </div>

            {/* Actions */}
            <div className="profile-actions">
              <Link to="/profile/settings" className="btn-profile-action">
                ⚙️ Settings
              </Link>
              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
