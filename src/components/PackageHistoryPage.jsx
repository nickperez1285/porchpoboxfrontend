import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const PackageHistoryPage = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ received: 0, pickedUp: 0, waiting: 0 });

  // Helper function to determine styling and label for activity types
  const getTypeStyle = (type) => {
    if (type === "check-in")
      return { background: "#fff8e1", color: "#856404", label: "📦 Received" };
    if (type === "delivery")
      return { background: "#d4edda", color: "#1a7f37", label: "✓ Picked Up" };
    if (type === "subscription" || type === "signup")
      return { background: "#e7f1ff", color: "#0b57d0", label: "✓ Account" };
    return { background: "#f0f0f0", color: "#444", label: type }; // Default
  };

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      try {
        const allEntries = [];
        let receivedCount = 0;
        let pickedUpCount = 0;
        let waitingCount = 0;

        // 1. Fetch global activity (Signups, Subscriptions) from root log
        try {
          const globalLogSnap = await getDocs(
            query(
              collection(db, "activityLog"),
              where("userId", "==", user.uid),
            ),
          );
          globalLogSnap.docs.forEach((d) => {
            allEntries.push({ id: d.id, ...d.data() });
          });
        } catch (err) {
          console.error("Error loading root activity log:", err);
        }

        // 2. Fetch partner-specific activity (Check-ins, Deliveries)
        const partnersSnap = await getDocs(
          query(collection(db, "partners"), where("approved", "==", true)),
        );

        await Promise.all(
          partnersSnap.docs.map(async (partnerDoc) => {
            const partner = { id: partnerDoc.id, ...partnerDoc.data() };

            // Aggregate source-of-truth counts for the summary
            try {
              const countSnap = await getDoc(
                doc(db, "partners", partner.id, "packageCounts", user.uid),
              );
              if (countSnap.exists()) {
                const d = countSnap.data();
                receivedCount += Number(d.totalReceived) || 0;
                pickedUpCount += Number(d.totalPickedUp) || 0;
                waitingCount += Number(d.count) || 0;
              }
            } catch (e) {
              // skip if document doesn't exist or permissions fail
            }

            try {
              const logSnap = await getDocs(
                query(
                  collection(db, "partners", partner.id, "activityLog"),
                  where("customerId", "==", user.uid),
                ),
              );
              logSnap.docs.forEach((d) => {
                allEntries.push({
                  id: d.id,
                  partnerId: partner.id,
                  partnerName:
                    partner.businessName ||
                    partner.streetAddress ||
                    "Unknown Partner",
                  partnerAddress: [
                    partner.streetAddress,
                    partner.city,
                    partner.state,
                  ]
                    .filter(Boolean)
                    .join(", "),
                  ...d.data(),
                });
              });
            } catch {
              // permission denied for partners with no entries — skip silently
            }
          }),
        );

        allEntries.sort((a, b) => {
          const ta = a.timestamp?.toDate?.() || new Date(0);
          const tb = b.timestamp?.toDate?.() || new Date(0);
          return tb - ta;
        });

        setEntries(allEntries);
        setStats({
          received: receivedCount,
          pickedUp: pickedUpCount,
          waiting: waitingCount,
        });
      } catch (err) {
        console.error("Error loading package history:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid]);

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)",
            color: "#f5f5f5",
            borderRadius: 22,
            padding: "28px 28px",
            marginBottom: 28,
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#d4af37",
              letterSpacing: 1.6,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            My Account
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Package History
          </div>
          <div style={{ fontSize: 14, color: "#999" }}>
            A full record of every package received and picked up.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            {[
              { label: "Total Received", value: stats.received },
              { label: "Total Picked Up", value: stats.pickedUp },
              { label: "Currently Waiting", value: stats.waiting },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "12px 16px",
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
                  {s.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Link
            to="/profile"
            style={{ fontSize: 14, color: "#0b57d0", fontWeight: 600 }}
          >
            ← Back to Profile
          </Link>
        </div>

        {loading ? (
          <p style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>
            Loading history...
          </p>
        ) : entries.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              textAlign: "center",
              border: "1px solid #ebebeb",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>
              No package history yet
            </div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 6 }}>
              Your deliveries will appear here once a partner checks in your
              first package.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((entry) => {
              const isCheckIn = entry.type === "check-in";
              const isSubscription = entry.type === "subscription";
              const isSignup = entry.type === "signup";
              const accent = isCheckIn
                ? "#d4af37"
                : isSubscription || isSignup
                  ? "#0b57d0"
                  : "#1a7f37";
              return (
                <div
                  key={`${entry.partnerId}-${entry.id}`}
                  style={{
                    background: "#fff",
                    border: "1px solid #ebebeb",
                    borderLeft: `4px solid ${accent}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: isCheckIn
                            ? "#fff8e1"
                            : isSubscription || isSignup
                              ? "#e7f1ff"
                              : "#d4edda",
                          color: isCheckIn
                            ? "#856404"
                            : isSubscription || isSignup
                              ? "#0b57d0"
                              : "#1a7f37",
                        }}
                      >
                        {isCheckIn
                          ? "📦 Received"
                          : isSubscription || isSignup
                            ? "✓ Account"
                            : "✓ Picked Up"}
                      </span>
                      <span style={{ fontSize: 13, color: "#aaa" }}>
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <div
                      style={{ fontWeight: 600, fontSize: 15, color: "#222" }}
                    >
                      {isSubscription || isSignup
                        ? "🏠 Account Activity"
                        : `📍 ${entry.partnerName}`}
                    </div>
                    {entry.partnerAddress && (
                      <div
                        style={{ fontSize: 12, color: "#999", marginTop: 2 }}
                      >
                        {entry.partnerAddress}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: isCheckIn
                          ? "#b8860b"
                          : isSubscription || isSignup
                            ? "#0b57d0"
                            : "#1a7f37",
                      }}
                    >
                      {isSubscription || isSignup ? (
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                          {isSubscription ? "Subscribed" : "Signed Up"}
                        </span>
                      ) : (
                        <>
                          {entry.packageCount}{" "}
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#aaa",
                            }}
                          >
                            pkg{entry.packageCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageHistoryPage;
