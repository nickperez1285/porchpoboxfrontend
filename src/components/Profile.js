import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebase";

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
  const hasActiveSubscription = Boolean(
    profileData?.status === "active" &&
    (profileData?.subscribedAt || profileData?.subscriptionEndsAt),
  );

  const statusInfo = profileData?.status ? getStatusDisplay(profileData.status) : null;

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        if (!isCancelled && profileSnapshot.exists()) {
          setProfileData(profileSnapshot.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

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
                currentWaiting: Number(historyEntry.currentWaiting) || 0
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

    loadProfile();
    let unsubscribePackageHistory = () => {};

    subscribeToPackageHistory().then((unsubscribe) => {
      unsubscribePackageHistory = unsubscribe;
    });

    return () => {
      isCancelled = true;
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
    <div style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
          color: "#f5f5f5",
          borderRadius: 18,
          padding: "28px 24px",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#d4af37",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              User Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>
              {user.displayName || profileData?.name || "Account Holder"}
            </h2>
            <p style={{ margin: 0, color: "#d6d6d6" }}>
              Manage your account details and mailing information.
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              background: statusInfo ? statusInfo.bgColor : "rgba(255, 255, 255, 0.06)",
              border: statusInfo ? `1px solid ${statusInfo.color}40` : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            {statusInfo ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: statusInfo.color,
                    fontWeight: 600,
                  }}
                >
                  Account Status
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, color: statusInfo.color }}>
                  {statusInfo.label}
                </div>
                <div style={{ marginTop: 4, fontSize: 14, color: "#666" }}>
                  {statusInfo.description}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "#c8c8c8",
                  }}
                >
                  Primary Email
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>
                  {user.email || "Not available"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Contact Information</h3>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Name
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {user.displayName || profileData?.name || "Not provided"}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Email
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {user.email || "Not available"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Phone
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {profileData?.phoneNumber || "Not provided"}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link to="/profile/edit">Edit</Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Street Address
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {profileData?.streetAddress || "Not provided"}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              City
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>
              {profileData?.city || "Not provided"}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                State
              </div>
              <div style={{ marginTop: 4, fontSize: 18 }}>
                {profileData?.state || "Not provided"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Zip Code
              </div>
              <div style={{ marginTop: 4, fontSize: 18 }}>
                {profileData?.zipCode || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Package History</h3>
          {packagesLoading ? (
            <p style={{ color: "#666" }}>Loading package history...</p>
          ) : packageHistory.length === 0 ? (
            <p style={{ color: "#666" }}>No packages have been checked in yet.</p>
          ) : (
            <div>
              {packageHistory.map((pkg) => (
                <div
                  key={pkg.partnerId}
                  style={{
                    marginBottom: 18,
                    paddingBottom: 18,
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: "#333"
                    }}
                  >
                    {pkg.partnerName}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                        Total Received
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {pkg.totalReceived}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                        Picked Up
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {pkg.totalPickedUp}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                        Waiting
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {pkg.currentWaiting}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#faf7ef",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Account Type
            </div>
            <div style={{ marginTop: 4, fontSize: 18 }}>Customer</div>
          </div>
          {hasActiveSubscription && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Subscription Status
                </div>
                <div style={{ marginTop: 4, fontSize: 18 }}>
                  {profileData?.status}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Subscribed On
                </div>
                <div style={{ marginTop: 4, fontSize: 18 }}>
                  {formatDate(profileData?.subscribedAt)}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Subscription Ends
                </div>
                <div style={{ marginTop: 4, fontSize: 18 }}>
                  {formatDate(profileData?.subscriptionEndsAt)}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Days Left
                </div>
                <div style={{ marginTop: 4, fontSize: 18 }}>
                  {getDaysLeft(profileData?.subscriptionEndsAt)}
                </div>
              </div>
            </>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
