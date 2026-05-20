import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import Footer from "./Footer";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDaysLeft = (value) => {
  if (!value) return 0;
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  const diff = date.getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getStatusDisplay = (status) => {
  switch (status) {
    case "active":
      return { label: "Active", color: "#1a7f37", bg: "#d4edda", icon: "✓" };
    case "trial":
      return { label: "Trial", color: "#856404", bg: "#fff3cd", icon: "◎" };
    case "inactive":
    case "canceled":
      return { label: "Inactive", color: "#dc3545", bg: "#ffd9d9", icon: "✕" };
    default:
      return { label: "Unknown", color: "#888", bg: "#f0f0f0", icon: "?" };
  }
};

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #ebebeb",
      borderRadius: 18,
      padding: 24,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "#aaa",
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [packageHistory, setPackageHistory] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
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
  const hasActiveSubscription = Boolean(
    profileData?.status === "active" &&
    (profileData?.subscribedAt || profileData?.subscriptionEndsAt),
  );
  const statusInfo = profileData?.status
    ? getStatusDisplay(profileData.status)
    : null;

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

  const daysLeft = getDaysLeft(profileData?.subscriptionEndsAt);
  const urgentColor =
    daysLeft <= 7 ? "#dc3545" : daysLeft <= 14 ? "#fd7e14" : "#1a7f37";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f7f7f8",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "48px auto 0",
          padding: "0 20px",
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* ── Hero ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)",
            color: "#f5f5f5",
            borderRadius: 22,
            padding: "32px 28px",
            marginBottom: 28,
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: isMobile ? "center" : "space-between",
            alignItems: "center",
            gap: 20,
            textAlign: isMobile ? "center" : "left",
          }}
        >
          <div style={{ minWidth: isMobile ? "100%" : "auto" }}>
            <div
              style={{
                fontSize: 11,
                color: "#d4af37",
                letterSpacing: 1.6,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              My Profile
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              {user.displayName || profileData?.name || "Account Holder"}
            </div>
            <div style={{ fontSize: 14, color: "#999" }}>{user.email}</div>
          </div>

          {statusInfo && (
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "14px 20px",
                minWidth: isMobile ? "100%" : 180,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Subscription
              </div>
              <span
                style={{
                  display: "inline-block",
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  borderRadius: 999,
                  padding: "4px 14px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {statusInfo.icon} {statusInfo.label}
              </span>
              <div style={{ marginTop: 10, fontSize: 12 }}>
                {profileData?.status === "inactive" ||
                profileData?.status === "canceled" ? (
                  <Link
                    to="/plans"
                    style={{ color: "#d4af37", fontWeight: 600 }}
                  >
                    Subscribe to continue →
                  </Link>
                ) : profileData?.status === "trial" ? (
                  <Link
                    to="/plans"
                    style={{ color: "#d4af37", fontWeight: 600 }}
                  >
                    Get unlimited access →
                  </Link>
                ) : hasActiveSubscription ? (
                  <span style={{ color: urgentColor, fontWeight: 600 }}>
                    {daysLeft} days left
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* ── Delivery Address ── (show whenever a preferred partner is set; street may be filled later) */}
        <div style={{ marginBottom: 28 }}>
          {profileData?.prefLocation &&
          (profileData.prefLocation.id ||
            profileData.prefLocation.businessName ||
            profileData.prefLocation.streetAddress) ? (
            <div
              style={{
                background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
                borderRadius: 20,
                padding: "28px 32px",
                color: "#f5f5f5",
                boxShadow: "0 0 0 3px #d4af37, 0 16px 48px rgba(0,0,0,0.3)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 160,
                  height: 160,
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.07), transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#d4af37",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 18,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 800,
                    }}
                  >
                    <span>📦</span> Your Package Delivery Address
                  </div>
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      lineHeight: 2,
                      fontSize: 17,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(212,175,55,0.5)",
                      borderRadius: 12,
                      padding: "16px 20px",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ fontWeight: 800, fontSize: 19, color: "#fff" }}
                    >
                      {user.displayName || profileData?.name || "Your Name"}
                    </div>
                    <div style={{ color: "#d4af37", fontWeight: 600 }}>
                      c/o {profileData.prefLocation.businessName}
                    </div>
                    {profileData.prefLocation.streetAddress ? (
                      <div style={{ color: "#bbb" }}>
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
                      <div style={{ color: "#bbb" }}>
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
                        <div
                          style={{ color: "#888", fontSize: 13, marginTop: 6 }}
                        >
                          Full street address will appear here once your partner
                          completes their profile, or set a location in
                          settings.
                        </div>
                      )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                    Use this address when placing orders online. Packages are
                    held securely until you pick them up.
                  </p>
                </div>
                <button
                  type="button"
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
                  style={{
                    padding: "11px 20px",
                    background: "#d4af37",
                    color: "#121212",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    alignSelf: "flex-start",
                    boxShadow: "0 4px 16px rgba(212,175,55,0.45)",
                  }}
                >
                  {addressCopied ? "✅ Copied!" : "📋 Copy Address"}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#fffbea",
                border: "1px solid #f04049",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "rgb(236, 74, 10)",
                  }}
                >
                  📦 No delivery address yet
                </div>
                <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
                  Set a preferred partner location to get your package delivery
                  address.
                </div>
              </div>
              <Link
                to="/profile/settings?highlight=location"
                style={{
                  padding: "9px 18px",
                  background: "#d4af37",
                  color: "#121212",
                  borderRadius: 10,
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                Set Preferred Location
              </Link>
            </div>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {/* Package History */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <SectionLabel>Package History</SectionLabel>
              <Link
                to="/profile/packages"
                style={{ fontSize: 12, color: "#0b57d0", fontWeight: 600 }}
              >
                View Full History →
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  padding: "14px 16px",
                  background:
                    currentPackagesWaiting > 0 ? "#fff8e1" : "#f8f8f8",
                  border: `1px solid ${currentPackagesWaiting > 0 ? "#f0c040" : "#eee"}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 6,
                  }}
                >
                  Waiting
                </div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: currentPackagesWaiting > 0 ? "#b8860b" : "#222",
                  }}
                >
                  {currentPackagesWaiting}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "#f8f8f8",
                  border: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 6,
                  }}
                >
                  Picked Up
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#222" }}>
                  {Number(profileData?.packagesDelivered) || 0}
                </div>
              </div>
            </div>

            {packagesLoading ? (
              <p style={{ color: "#bbb", fontSize: 13, margin: 0 }}>
                Loading...
              </p>
            ) : packageHistory.length === 0 ? (
              <p style={{ color: "#bbb", fontSize: 13, margin: 0 }}>
                No package history yet.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {packageHistory.map((pkg) => (
                  <Link
                    key={pkg.partnerId}
                    to="/profile/packages"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#333",
                        marginBottom: 8,
                      }}
                    >
                      📍 {pkg.partnerName}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#bbb",
                            marginBottom: 2,
                          }}
                        >
                          Received
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          {pkg.totalPickedUp}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#bbb",
                            marginBottom: 2,
                          }}
                        >
                          Waiting
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: pkg.currentWaiting > 0 ? "#b8860b" : "#333",
                          }}
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
          <Card style={{ background: "#fafafa" }}>
            <SectionLabel>Account</SectionLabel>

            {/* Referral Code */}
            <div
              style={{
                marginBottom: 14,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #ebebeb",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                Your Referral Code
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: 3,
                    color: "#121212",
                    fontFamily: "monospace",
                  }}
                >
                  {displayReferral}
                </span>
                {displayReferral !== "—" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(displayReferral)
                        .then(() => alert("Referral code copied!"))
                    }
                    style={{
                      padding: "4px 10px",
                      background: "#d4af37",
                      border: "none",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      color: "#121212",
                    }}
                  >
                    Copy
                  </button>
                )}
                {displayReferral !== "—" && (
                  <button
                    type="button"
                    onClick={handleShareReferral}
                    style={{
                      padding: "4px 10px",
                      background: "#121212",
                      border: "none",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    Share
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                Share with a business to refer them as a partner.
              </div>
            </div>

            {/* Preferred Location */}
            <div
              style={{
                marginBottom: 14,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fff",
                border: `1px solid ${profileData?.prefLocation ? "#c8e6c9" : "#f0c040"}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                Preferred Location
              </div>
              {profileData?.prefLocation ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>
                    {profileData.prefLocation.businessName}
                  </div>
                  {profileData.prefLocation.streetAddress && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>
                      {[
                        profileData.prefLocation.streetAddress,
                        profileData.prefLocation.city,
                        profileData.prefLocation.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Link
                      to="/profile/settings?highlight=location"
                      style={{
                        fontSize: 12,
                        color: "#0b57d0",
                        fontWeight: 600,
                      }}
                    >
                      Change location
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  to="/profile/settings"
                  style={{ fontSize: 13, color: "#b8860b", fontWeight: 600 }}
                >
                  ⚠️ No location set — tap to choose one
                </Link>
              )}
            </div>

            {/* Subscription dates */}
            {hasActiveSubscription && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid #ebebeb",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Subscription
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>Started</div>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: "#333" }}
                    >
                      {formatDate(profileData?.subscribedAt)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>Ends</div>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: "#333" }}
                    >
                      {formatDate(profileData?.subscriptionEndsAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "#bbb" }}>Days left</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: urgentColor,
                    }}
                  >
                    {daysLeft}
                  </div>
                  {daysLeft <= 7 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: urgentColor,
                        fontWeight: 600,
                      }}
                    >
                      Renew soon!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 4,
              }}
            >
              <Link
                to="/profile/settings"
                style={{
                  display: "block",
                  padding: "11px 16px",
                  background: "#121212",
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                ⚙️ Settings
              </Link>
              {!hasActiveSubscription && (
                <Link
                  to="/plans"
                  style={{
                    display: "block",
                    padding: "11px 16px",
                    background: "#d4af37",
                    color: "#121212",
                    borderRadius: 10,
                    fontWeight: 700,
                    textDecoration: "none",
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  Subscribe Now
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "11px 16px",
                  background: "#fff",
                  color: "#888",
                  borderRadius: 10,
                  fontWeight: 600,
                  border: "1px solid #e8e8e8",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Logout
              </button>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
