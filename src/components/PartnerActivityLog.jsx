import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

const formatTimestamp = (value) => {
  if (!value) return "Unknown time";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString();
};

const getTypeStyle = (type) => {
  if (type === "check-in")
    return { background: "#e6f4ea", color: "#1a7f37", label: "Check In" };
  if (type === "delivery")
    return { background: "#fff3cd", color: "#856404", label: "Delivered" };
  if (type === "subscription")
    return { background: "#e7f1ff", color: "#0b57d0", label: "Subscribed" };
  if (type === "payout-created")
    return { background: "#e8f5e9", color: "#1a7f37", label: "Payout Created" };
  if (type === "payout-paid")
    return { background: "#d4edda", color: "#0f5132", label: "Payout Paid" };
  return { background: "#f0f0f0", color: "#444", label: type };
};

const PartnerActivityLog = ({ partnerProfile }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (!partnerProfile?.id) return;
    const unsubscribes = [];
    let activityEntries = [];
    let payoutEntries = [];

    const merge = () => {
      const all = [...activityEntries, ...payoutEntries].sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(0);
        const tb = b.timestamp?.toDate?.() || new Date(0);
        return tb - ta;
      });
      setEntries(all);
      setLoading(false);
    };

    const actUnsub = onSnapshot(
      collection(db, "partners", partnerProfile.id, "activityLog"),
      (snapshot) => {
        activityEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        merge();
      },
      (err) => {
        console.error("Error loading activity log:", err);
        setError("Unable to load activity log.");
        setLoading(false);
      },
    );
    unsubscribes.push(actUnsub);

    const payoutUnsub = onSnapshot(
      query(
        collection(db, "partners", partnerProfile.id, "payouts"),
        orderBy("createdAt", "desc"),
      ),
      (snapshot) => {
        payoutEntries = snapshot.docs
          .filter((doc) => doc.data().status === "paid")
          .map((doc) => {
            const d = doc.data();
            return {
              id: `payout-${doc.id}`,
              type: "payout-paid",
              timestamp: d.paidAt || d.createdAt,
              month: d.month,
              amount: d.amount,
              subscriberCount: d.subscriberCount,
            };
          });
        merge();
      },
      (err) => console.error("Error loading payouts:", err),
    );
    unsubscribes.push(payoutUnsub);

    return () => unsubscribes.forEach((u) => u());
  }, [partnerProfile?.id]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // 1. Filter by Search Term
    const term = search.toLowerCase().trim();
    if (term) {
      result = result.filter((entry) => {
        const typeInfo = getTypeStyle(entry.type);
        const label = (typeInfo.label || "").toLowerCase();
        const name = (entry.customerName || "").toLowerCase();
        const email = (entry.customerEmail || "").toLowerCase();
        const month = (entry.month || "").toLowerCase();
        return (
          label.includes(term) ||
          name.includes(term) ||
          email.includes(term) ||
          month.includes(term)
        );
      });
    }

    // 2. Filter by Type
    if (filterType !== "all") {
      result = result.filter((entry) => entry.type === filterType);
    }

    // 3. Sort by Timestamp
    result.sort((a, b) => {
      const ta = a.timestamp?.toDate?.() || new Date(0);
      const tb = b.timestamp?.toDate?.() || new Date(0);
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });

    return result;
  }, [entries, search, filterType, sortOrder]);

  const isPayoutType = (type) =>
    ["payout-created", "payout-paid"].includes(type);
  const isSubscription = (type) => type === "subscription";

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "30px 28px",
          marginBottom: 24,
          boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            color: "#d4af37",
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Partner Portal
        </div>
        <h2 style={{ margin: "10px 0 6px" }}>
          {partnerProfile.businessName} — Activity Log
        </h2>
        <p style={{ margin: 0, color: "#d6d6d6", lineHeight: 1.6 }}>
          Package check-ins, deliveries, customer subscriptions at your
          location, and payouts.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link to="/partner">← Back to Partner Portal</Link>
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}
      >
        <input
          type="search"
          placeholder="Search activity by name, email, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 300px",
            padding: "12px 16px",
            borderRadius: 14,
            border: "1px solid #ddd",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="all">All Types</option>
          <option value="check-in">Check Ins</option>
          <option value="delivery">Deliveries</option>
          <option value="subscription">Subscriptions</option>
          <option value="payout-paid">Payouts Paid</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <p>Loading activity log...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#666" }}>No activity recorded yet.</p>
      ) : filteredEntries.length === 0 ? (
        <p style={{ color: "#666" }}>No activity found matching "{search}".</p>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ background: "#f8f5ea", textAlign: "left" }}>
                <th
                  style={{
                    padding: "14px 18px",
                    fontWeight: 600,
                    color: "#8a6a00",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: 1,
                  }}
                >
                  Date &amp; Time
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    fontWeight: 600,
                    color: "#8a6a00",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: 1,
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    fontWeight: 600,
                    color: "#8a6a00",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: 1,
                  }}
                >
                  Details
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    fontWeight: 600,
                    color: "#8a6a00",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: 1,
                  }}
                >
                  Packages / Subscriptions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, i) => {
                const typeStyle = getTypeStyle(entry.type);
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderTop: "1px solid #eee",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td style={{ padding: "12px 18px", color: "#444" }}>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span
                        style={{
                          background: typeStyle.background,
                          color: typeStyle.color,
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {typeStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      {isPayoutType(entry.type) ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {entry.month || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#888" }}>
                            {entry.subscriberCount} subscriber
                            {entry.subscriberCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {entry.customerName || "Unknown"}
                          </div>
                          {entry.customerEmail && (
                            <div style={{ fontSize: 12, color: "#888" }}>
                              {entry.customerEmail}
                            </div>
                          )}
                          {isSubscription(entry.type) && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#0b57d0",
                                marginTop: 4,
                                fontWeight: 600,
                              }}
                            >
                              Subscribed using your location as their delivery
                              address
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: 600 }}>
                      {isPayoutType(entry.type)
                        ? `$${entry.amount}`
                        : isSubscription(entry.type)
                          ? "—"
                          : entry.packageCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartnerActivityLog;
