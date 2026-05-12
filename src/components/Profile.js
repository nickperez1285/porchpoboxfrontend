import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Footer from "./Footer";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString();
};

const getDaysLeft = (value) => {
  if (!value) {
    return 0;
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const diff = date.getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getStatusDisplay = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Paid & Active",
        color: "#28a745",
        bgColor: "rgba(40, 167, 69, 0.1)",
        description: "Your subscription is active"
      };
    case "trial":
      return {
        label: "Trial Period",
        color: "#ffc107",
        bgColor: "rgba(255, 193, 7, 0.1)",
        description: "You're on a trial period"
      };
    case "inactive":
    case "canceled":
      return {
        label: "Inactive",
        color: "#dc3545",
        bgColor: "rgba(220, 53, 69, 0.1)",
        description: "Subscription needed"
      };
    default:
      return {
        label: "Unknown",
        color: "#6c757d",
        bgColor: "rgba(108, 117, 125, 0.1)",
        description: "Status unknown"
      };
  }
};

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [packageHistory, setPackageHistory] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const currentPackagesWaiting = packageHistory.reduce(
    (sum, entry) => sum + (Number(entry.currentWaiting) || 0),
    0
  );
  const hasActiveSubscription = Boolean(
    profileData?.status === "active" &&
    (profileData?.subscribedAt || profileData?.subscriptionEndsAt),
  );

  const statusInfo = profileData?.status ? getStatusDisplay(profileData.status) : null;

  useEffect(() => {
    let isCancelled = false;

    const subscribeToPackageHistory = async () => {
      setPackagesLoading(true);

      try {
        const partnersSnapshot = await getDocs(collection(db, "partners"));
        if (isCancelled) {
          return () => {};
        }

        const partnersList = partnersSnapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data()
        }));
        const partnerHistoryMap = new Map();
        const userHistoryMap = new Map();
        const initializedPartnerIds = new Set();
        let userHistoryInitialized = false;

        const syncPackageHistory = () => {
          const nextHistory = [];

          partnersList.forEach((partner) => {
            const userOwnedHistory = userHistoryMap.get(partner.id);
            const partnerOwnedHistory = partnerHistoryMap.get(partner.id);
            const historyEntry = userOwnedHistory || partnerOwnedHistory;

            if (historyEntry) {
              nextHistory.push({
                partnerId: partner.id,
                partnerName:
                  historyEntry.partnerName || partner.businessName || "Unknown Partner",
                totalReceived: Number(historyEntry.totalReceived) || 0,
                totalPickedUp: Number(historyEntry.totalPickedUp) || 0,
                currentWaiting: partnerOwnedHistory
                  ? Number(partnerOwnedHistory.currentWaiting) || 0
                  : Number(historyEntry.currentWaiting) || 0
              });
            }
          });

          setPackageHistory(nextHistory);
          if (userHistoryInitialized) {
            setPackagesLoading(false);
          }
        };

        const partnerUnsubscribes = partnersList.map((partner) =>
          onSnapshot(
            doc(db, "partners", partner.id, "packageCounts", user.uid),
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                partnerHistoryMap.set(partner.id, {
                  partnerName: partner.businessName || "Unknown Partner",
                  totalReceived: Number(data.totalReceived) || 0,
                  totalPickedUp: Number(data.totalPickedUp) || 0,
                  currentWaiting: Number(data.count) || 0
                });
              } else {
                partnerHistoryMap.delete(partner.id);
              }

              initializedPartnerIds.add(partner.id);
              if (!isCancelled) {
                syncPackageHistory();
              }
            },
            (error) => {
              if (error?.code !== "permission-denied") {
                console.error(`Error loading packages for partner ${partner.id}:`, error);
              }
              initializedPartnerIds.add(partner.id);
              if (!isCancelled) {
                syncPackageHistory();
              }
            }
          )
        );

        const userHistoryUnsubscribe = onSnapshot(
          collection(db, "users", user.uid, "packageHistory"),
          (snapshot) => {
            userHistoryMap.clear();

            snapshot.docs.forEach((entry) => {
              const data = entry.data();
              userHistoryMap.set(data.partnerId || entry.id, {
                partnerName: data.partnerName || "Unknown Partner",
                totalReceived: Number(data.totalReceived) || 0,
                totalPickedUp: Number(data.totalPickedUp) || 0,
                currentWaiting: Number(data.currentWaiting) || 0
              });
            });

            userHistoryInitialized = true;
            if (!isCancelled) {
              syncPackageHistory();
            }
          },
          (error) => {
            console.error("Error loading package history:", error);
            userHistoryInitialized = true;
            if (!isCancelled) {
              setPackageHistory([]);
              syncPackageHistory();
            }
          }
        );

        return () => {
          partnerUnsubscribes.forEach((unsubscribe) => {
            if (typeof unsubscribe === "function") {
              unsubscribe();
            }
          });

          if (typeof userHistoryUnsubscribe === "function") {
            userHistoryUnsubscribe();
          }
        };
      } catch (error) {
        console.error("Error loading package history:", error);
        setPackagesLoading(false);
        return () => {};
      }
    };

    const unsubscribeProfile = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        if (!isCancelled && snapshot.exists()) {
          setProfileData(snapshot.data());
        }
      },
      (error) => {
        console.error("Error loading user profile:", error);
      }
    );

    let unsubscribePackageHistory = () => {};

    subscribeToPackageHistory().then((unsubscribe) => {
      unsubscribePackageHistory = unsubscribe;
    });

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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
          color: "#f5f5f5",
          borderRadius: 18,
          padding: "28px 24px",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }}>
              My Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>
              {user.displayName || profileData?.name || "Account Holder"}
            </h2>
            <p style={{ margin: 0, color: "#d6d6d6", fontSize: 14 }}>
              {user.email}
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              background: statusInfo ? statusInfo.bgColor : "rgba(255,255,255,0.06)",
              border: statusInfo ? `1px solid ${statusInfo.color}40` : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            {statusInfo ? (
              <>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: statusInfo.color, fontWeight: 600 }}>
                  Subscription
                </div>
                <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: statusInfo.color }}>
                  {statusInfo.label}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#aaa" }}>
                  {profileData?.status === "inactive" || profileData?.status === "canceled" ? (
                    <Link to="/plans" style={{ color: statusInfo.color, fontWeight: 600 }}>
                      Subscribe to continue →
                    </Link>
                  ) : profileData?.status === "trial" ? (
                    <Link to="/plans" style={{ color: statusInfo.color, fontWeight: 600 }}>
                      Subscribe for unlimited access →
                    </Link>
                  ) : (
                    statusInfo.description
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>Email</div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600 }}>{user.email || "Not available"}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

        {/* Delivery Address Card */}
        <div style={{ gridColumn: "1 / -1" }}>
          {profileData?.prefLocation?.streetAddress ? (
            <div style={{
              background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
              borderRadius: 16,
              padding: "24px 28px",
              color: "#f5f5f5",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, background: "radial-gradient(circle, rgba(212,175,55,0.08), transparent 70%)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 12 }}>
                    📦 Your Package Delivery Address
                  </div>
                  <div style={{ fontFamily: "monospace", lineHeight: 1.9, fontSize: 15 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{user.displayName || profileData?.name || "Your Name"}</div>
                    <div style={{ color: "#d4af37" }}>c/o {profileData.prefLocation.businessName}</div>
                    <div>{profileData.prefLocation.streetAddress}</div>
                    <div>{[profileData.prefLocation.city, profileData.prefLocation.state, profileData.prefLocation.zipCode].filter(Boolean).join(", ")}</div>
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: 12, color: "#888" }}>
                    Use this address when placing orders online. Your packages will be held securely until you pick them up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const addr = [
                      user.displayName || profileData?.name || "",
                      `c/o ${profileData.prefLocation.businessName}`,
                      profileData.prefLocation.streetAddress,
                      [profileData.prefLocation.city, profileData.prefLocation.state, profileData.prefLocation.zipCode].filter(Boolean).join(", ")
                    ].join("\n");
                    navigator.clipboard.writeText(addr).then(() => alert("Address copied to clipboard!"));
                  }}
                  style={{
                    padding: "10px 18px",
                    background: "#d4af37",
                    color: "#121212",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    alignSelf: "flex-start"
                  }}
                >
                  📋 Copy Address
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff8e1", border: "1px solid #f0c040", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#7a5c00" }}>📦 No delivery address yet</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Set a preferred partner location to get your package delivery address.</div>
              </div>
              <Link to="/profile/settings" style={{ padding: "9px 18px", background: "#d4af37", color: "#121212", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                Set Location
              </Link>
            </div>
          )}
        </div>

        {/* Package History */}
        <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>📦 Package History</h3>
            {packageHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const name = user.displayName || profileData?.name || "User";
                  const rows = [
                    ["Partner Location", "Total Received", "Currently Waiting"],
                    ...packageHistory.map((pkg) => [
                      pkg.partnerName,
                      pkg.totalPickedUp,
                      pkg.currentWaiting
                    ])
                  ];
                  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `porchpobox-history-${name.replace(/\s+/g, "-").toLowerCase()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ padding: "7px 14px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#444" }}
              >
                ⬇️ Export CSV
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div style={{ borderRadius: 12, padding: 16, background: currentPackagesWaiting > 0 ? "#fff8e1" : "#fafafa", border: `1px solid ${currentPackagesWaiting > 0 ? "#f0c040" : "#eee"}` }}>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Waiting for Pickup</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: currentPackagesWaiting > 0 ? "#b8860b" : "#333" }}>
                {currentPackagesWaiting}
              </div>
            </div>
            <div style={{ borderRadius: 12, padding: 16, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Total Picked Up</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#333" }}>
                {Number(profileData?.packagesDelivered) || 0}
              </div>
            </div>
          </div>
          {packagesLoading ? (
            <p style={{ color: "#999", fontSize: 14 }}>Loading history...</p>
          ) : packageHistory.length === 0 ? (
            <p style={{ color: "#999", fontSize: 14, margin: 0 }}>No package history yet. Your deliveries will appear here.</p>
          ) : (
            <div>
              {packageHistory.map((pkg) => (
                <div key={pkg.partnerId} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>📍 {pkg.partnerName}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>Received</div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{pkg.totalPickedUp}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>Waiting</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: pkg.currentWaiting > 0 ? "#b8860b" : "#333" }}>{pkg.currentWaiting}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account */}
        <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#faf7ef" }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>⚙️ Account</h3>

          {/* Preferred Location */}
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: profileData?.prefLocation ? "#f0faf0" : "#fff8e1", border: `1px solid ${profileData?.prefLocation ? "#b2dfdb" : "#f0c040"}` }}>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Preferred Location</div>
            {profileData?.prefLocation ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{profileData.prefLocation.businessName}</div>
                {profileData.prefLocation.streetAddress && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {[profileData.prefLocation.streetAddress, profileData.prefLocation.city, profileData.prefLocation.state].filter(Boolean).join(", ")}
                  </div>
                )}
              </>
            ) : (
              <Link to="/profile/settings" style={{ fontSize: 13, color: "#b8860b", fontWeight: 600 }}>
                ⚠️ No location set — tap to choose one
              </Link>
            )}
          </div>

          {/* Subscription details */}
          {hasActiveSubscription && (() => {
            const daysLeft = getDaysLeft(profileData?.subscriptionEndsAt);
            const urgentColor = daysLeft <= 7 ? "#dc3545" : daysLeft <= 14 ? "#fd7e14" : "#28a745";
            return (
              <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "#fff", border: "1px solid #eee" }}>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Subscription</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#999" }}>Started</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(profileData?.subscribedAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#999" }}>Ends</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(profileData?.subscriptionEndsAt)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "#999" }}>Days Remaining</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: urgentColor }}>{daysLeft}</div>
                  {daysLeft <= 7 && <span style={{ fontSize: 12, color: urgentColor }}>— renew soon!</span>}
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <Link
              to="/profile/settings"
              style={{ display: "block", padding: "10px 16px", background: "#121212", color: "#fff", borderRadius: 10, fontWeight: 600, textDecoration: "none", textAlign: "center", fontSize: 14 }}
            >
              ⚙️ Settings
            </Link>
            {!hasActiveSubscription && (
              <Link
                to="/plans"
                style={{ display: "block", padding: "10px 16px", background: "#d4af37", color: "#121212", borderRadius: 10, fontWeight: 700, textDecoration: "none", textAlign: "center", fontSize: 14 }}
              >
                Subscribe Now
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{ padding: "10px 16px", background: "#f5f5f5", color: "#555", borderRadius: 10, fontWeight: 600, border: "1px solid #ddd", cursor: "pointer", fontSize: 14 }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
