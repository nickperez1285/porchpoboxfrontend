import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const AdminActivityLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPartner, setFilterPartner] = useState("all");
  const [partners, setPartners] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let unsubscribes = [];
    const partnerMap = {};
    const logMap = {};
    let signupEntries = [];

    const merge = () => {
      const all = [...signupEntries, ...Object.values(logMap).flat()];
      all.sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(0);
        const tb = b.timestamp?.toDate?.() || new Date(0);
        return tb - ta;
      });
      setEntries(all);
    };

    const init = async () => {
      try {
        const snap = await getDocs(collection(db, "partners"));
        const partnerList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPartners(partnerList);
        partnerList.forEach((p) => {
          partnerMap[p.id] = p.businessName || "Unnamed Partner";
        });

        setLoading(false);

        // Listen to global signup log
        const signupUnsub = onSnapshot(
          collection(db, "activityLog"),
          (snapshot) => {
            signupEntries = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            merge();
          },
          (err) => console.error("Error loading signup log:", err),
        );
        unsubscribes.push(signupUnsub);

        // Listen to each partner's activityLog
        partnerList.forEach((partner) => {
          const unsub = onSnapshot(
            collection(db, "partners", partner.id, "activityLog"),
            (snapshot) => {
              logMap[partner.id] = snapshot.docs.map((d) => ({
                id: d.id,
                partnerId: partner.id,
                partnerName: partnerMap[partner.id],
                ...d.data(),
              }));
              merge();
            },
            (err) => {
              console.error(`Error loading log for ${partner.id}:`, err);
            },
          );
          unsubscribes.push(unsub);
        });
      } catch (err) {
        console.error("Error loading admin activity log:", err);
        setError("Unable to load activity log.");
        setLoading(false);
      }
    };

    init();
    return () => unsubscribes.forEach((u) => u());
  }, []);

  const formatTimestamp = (value) => {
    if (!value) return "Unknown";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString();
  };

  const getTypeStyle = (type) => {
    if (type === "check-in")
      return { background: "#e6f4ea", color: "#1a7f37", label: "Check In" };
    if (type === "delivery")
      return { background: "#fff3cd", color: "#856404", label: "Delivered" };
    if (type === "signup")
      return { background: "#e8f0fe", color: "#1a56db", label: "Sign Up" };
    if (type === "subscription")
      return { background: "#f3e8ff", color: "#6d28d9", label: "Subscription" };
    if (type === "payout-created")
      return {
        background: "#e8f5e9",
        color: "#1a7f37",
        label: "Payout Created",
      };
    if (type === "payout-paid")
      return { background: "#d4edda", color: "#0f5132", label: "Payout Paid" };
    if (type === "payout-deleted")
      return { background: "#ffd9d9", color: "#c00", label: "Payout Deleted" };
    return { background: "#f0f0f0", color: "#444", label: type };
  };

  const filtered = entries.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (
      filterPartner !== "all" &&
      (e.type === "signup" || e.type === "subscription")
    )
      return false;
    if (filterPartner !== "all" && e.partnerId !== filterPartner) return false;
    return true;
  });

  const isPayoutType = (type) =>
    ["payout-created", "payout-paid", "payout-deleted"].includes(type);

  return (
    <div style={{ maxWidth: 1180, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: isMobile ? 0 : 24,
          padding: isMobile ? "30px 20px" : "30px 28px",
          margin: isMobile ? "0 -20px 24px" : "0 0 24px",
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
          Admin Portal
        </div>
        <h2 style={{ margin: "10px 0 6px" }}>Comprehensive Activity Log</h2>
        <p style={{ margin: 0, color: "#d6d6d6", lineHeight: 1.6 }}>
          Live feed of every check-in and delivery across all partner locations.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link to="/admin">← Back to Admin</Link>
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}
      >
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        >
          <option value="all">All Types</option>
          <option value="check-in">Check Ins</option>
          <option value="delivery">Deliveries</option>
          <option value="signup">Sign Ups</option>
          <option value="subscription">Subscriptions</option>
          <option value="payout-created">Payout Created</option>
          <option value="payout-paid">Payout Paid</option>
          <option value="payout-deleted">Payout Deleted</option>
        </select>

        <select
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        >
          <option value="all">All Partners</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.businessName || "Unnamed Partner"}
            </option>
          ))}
        </select>

        <div
          style={{
            marginLeft: "auto",
            fontSize: 14,
            color: "#666",
            alignSelf: "center",
          }}
        >
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </div>
      </div>

      {loading ? (
        <p>Loading activity log...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#666" }}>No activity recorded yet.</p>
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
                {["Date & Time", "Partner", "Type", "Customer", "Packages"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 18px",
                        fontWeight: 600,
                        color: "#8a6a00",
                        textTransform: "uppercase",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const typeStyle = getTypeStyle(entry.type);
                const isGlobal =
                  entry.type === "signup" || entry.type === "subscription";
                return (
                  <tr
                    key={`${entry.partnerId || "global"}-${entry.id}`}
                    style={{
                      borderTop: "1px solid #eee",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 18px",
                        color: "#444",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      {isGlobal ? (
                        <span style={{ color: "#888", fontStyle: "italic" }}>
                          —
                        </span>
                      ) : (
                        <Link
                          to={`/admin/partner/${entry.partnerId}`}
                          style={{ fontWeight: 600, color: "#0b57d0" }}
                        >
                          {entry.partnerName}
                        </Link>
                      )}
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
                            ${entry.amount} · {entry.subscriberCount} subscriber
                            {entry.subscriberCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {isGlobal
                              ? entry.userName
                              : entry.customerName || "Unknown"}
                          </div>
                          <div style={{ fontSize: 12, color: "#888" }}>
                            {isGlobal ? entry.userEmail : entry.customerEmail}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#aaa" }}>
                      {isPayoutType(entry.type)
                        ? "—"
                        : isGlobal
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

export default AdminActivityLog;
