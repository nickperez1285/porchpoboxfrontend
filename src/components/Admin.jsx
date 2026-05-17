import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { apiPost } from "../utils/apiClient";
import { auth, db } from "../firebase";

const Admin = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingVendorId, setUpdatingVendorId] = useState("");
  const [error, setError] = useState("");
  const [expandedCustomerIds, setExpandedCustomerIds] = useState([]);
  const [expandedVendorIds, setExpandedVendorIds] = useState([]);
  const [customerSortBy, setCustomerSortBy] = useState("name");
  const [todayEntries, setTodayEntries] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (logoutError) {
      console.error("Error signing out admin:", logoutError);
    }
  };

  const updateVendorApproval = async (vendorId, approved) => {
    setUpdatingVendorId(vendorId);
    try {
      const vendor = vendors.find((entry) => entry.id === vendorId);

      await updateDoc(doc(db, "partners", vendorId), {
        approved,
        status: approved ? "approved" : "deactivated",
        approvedAt: approved ? serverTimestamp() : null,
      });

      if (approved && vendor && !vendor.approved) {
        try {
          const response = await apiPost("/api/notifications/partner-approved", {
            businessName: vendor.businessName,
            email: vendor.email,
            streetAddress: vendor.streetAddress,
            city: vendor.city,
            state: vendor.state,
            zipCode: vendor.zipCode,
            referredBy: vendor.referredBy || "",
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            console.error(
              "Partner approval email failed:",
              errorBody?.message || `HTTP ${response.status}`,
            );
            setError(
              "Partner approved, but the welcome email could not be sent.",
            );
          }
        } catch (emailError) {
          console.error("Partner approval email failed:", emailError);
          setError(
            "Partner approved, but the welcome email could not be sent.",
          );
        }
      }

      setVendors((currentVendors) =>
        currentVendors.map((vendor) =>
          vendor.id === vendorId
            ? {
                ...vendor,
                approved,
                status: approved ? "approved" : "deactivated",
              }
            : vendor,
        ),
      );
    } catch (updateError) {
      console.error("Error updating vendor status:", updateError);
      setError(`Unable to ${approved ? "approve" : "deactivate"} partner.`);
    } finally {
      setUpdatingVendorId("");
    }
  };

  const toggleCustomerExpanded = (customerId) => {
    setExpandedCustomerIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId],
    );
  };

  const toggleVendorExpanded = (vendorId) => {
    setExpandedVendorIds((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId],
    );
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [customerSnapshot, vendorSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "partners")),
        ]);

        const vendorDocs = vendorSnapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));

        const vendorPackageSnapshots = await Promise.all(
          vendorDocs.map((vendor) =>
            getDocs(collection(db, "partners", vendor.id, "packageCounts")),
          ),
        );

        const customerPackageCounts = {};
        const customerPackageLocations = {};

        vendorPackageSnapshots.forEach((snapshot, vendorIndex) => {
          const vendor = vendorDocs[vendorIndex];
          const locationName =
            vendor?.businessName || vendor?.streetAddress || "Unnamed partner";
          snapshot.docs.forEach((entry) => {
            const packageCount = entry.data().count || 0;
            customerPackageCounts[entry.id] =
              (customerPackageCounts[entry.id] || 0) + packageCount;
            if (packageCount > 0) {
              if (!customerPackageLocations[entry.id]) {
                customerPackageLocations[entry.id] = [];
              }
              if (!customerPackageLocations[entry.id].includes(locationName)) {
                customerPackageLocations[entry.id].push(locationName);
              }
            }
          });
        });

        setCustomers(
          customerSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
            packageCount: customerPackageCounts[entry.id] || 0,
            packageLocations: customerPackageLocations[entry.id] || [],
          })),
        );

        setVendors(
          vendorDocs.map((vendor, index) => ({
            ...vendor,
            packageCountTotal: vendorPackageSnapshots[index].docs.reduce(
              (sum, entry) => sum + (entry.data().count || 0),
              0,
            ),
          })),
        );

        // Load referrer names for vendors that have a referredBy code
        const vendorsWithReferral = vendorDocs.filter((v) => v.referredBy);
        if (vendorsWithReferral.length > 0) {
          const referrerSnap = await getDocs(
            query(
              collection(db, "users"),
              where(
                "referralCode",
                "in",
                vendorsWithReferral.map((v) => v.referredBy),
              ),
            ),
          );
          const referrerMap = {};
          referrerSnap.docs.forEach((d) => {
            referrerMap[d.data().referralCode] =
              d.data().name || d.data().email || "Unknown";
          });
          setVendors((prev) =>
            prev.map((v) =>
              v.referredBy
                ? {
                    ...v,
                    referrerName: referrerMap[v.referredBy] || v.referredBy,
                  }
                : v,
            ),
          );
        }
      } catch (fetchError) {
        console.error("Error loading admin data:", fetchError);
        setError(
          "Unable to load admin data. Firestore rules must allow your admin UID to read users and partners.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const partnerMap = {};
    const logMap = {};
    let signupEntries = [];
    const unsubscribes = [];

    const merge = () => {
      const all = [...signupEntries, ...Object.values(logMap).flat()].filter(
        (e) => {
          const t = e.timestamp?.toDate?.() || null;
          return t && t >= startOfDay;
        },
      );
      all.sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(0);
        const tb = b.timestamp?.toDate?.() || new Date(0);
        return tb - ta;
      });
      setTodayEntries(all);
    };

    const initTodayLog = async () => {
      try {
        const partnerSnap = await getDocs(collection(db, "partners"));
        partnerSnap.docs.forEach((d) => {
          partnerMap[d.id] = d.data().businessName || "Unnamed Partner";
        });

        const signupUnsub = onSnapshot(
          collection(db, "activityLog"),
          (snap) => {
            signupEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            merge();
          },
          (err) => console.error("Today signup log error:", err),
        );
        unsubscribes.push(signupUnsub);

        partnerSnap.docs.forEach((partnerDoc) => {
          const partnerId = partnerDoc.id;
          const unsub = onSnapshot(
            collection(db, "partners", partnerId, "activityLog"),
            (snap) => {
              logMap[partnerId] = snap.docs.map((d) => ({
                id: d.id,
                partnerId,
                partnerName: partnerMap[partnerId],
                ...d.data(),
              }));
              merge();
            },
            (err) => console.error("Today partner log error:", err),
          );
          unsubscribes.push(unsub);
        });
      } catch (err) {
        console.error("Error loading today activity:", err);
      }
    };

    initTodayLog();
    return () => unsubscribes.forEach((u) => u());
  }, []);

  const sortedCustomers = useMemo(() => {
    const customersCopy = [...customers];

    if (customerSortBy === "packageCount") {
      return customersCopy.sort((left, right) => {
        if ((right.packageCount || 0) !== (left.packageCount || 0)) {
          return (right.packageCount || 0) - (left.packageCount || 0);
        }

        return (left.name || "").localeCompare(right.name || "");
      });
    }

    return customersCopy.sort((left, right) =>
      (left.name || "").localeCompare(right.name || ""),
    );
  }, [customerSortBy, customers]);

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

  const getCustomerBackgroundColor = (customer) => {
    const isActive = customer.status === "active";
    const packageCount = customer.packageCount || 0;

    if (isActive) return "#d4edda";

    if (!isActive && packageCount > 1) {
      return "#ffd9d9";
    }

    if (!isActive && packageCount === 1) {
      return "#fff6bf";
    }

    return "#ffffff";
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 960,
          margin: "80px auto",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#888", fontSize: 16 }}>Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #f0c040",
            borderRadius: 12,
            padding: 20,
            color: "#7a5c00",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const totalCustomerPackages = customers.reduce(
    (sum, customer) => sum + (customer.packageCount || 0),
    0,
  );
  const approvedVendorCount = vendors.filter(
    (vendor) => vendor.approved,
  ).length;

  return (
    <div style={{ maxWidth: 1180, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "30px 28px",
          marginBottom: 24,
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
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
          <div style={{ maxWidth: 560 }}>
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
            <h2 style={{ margin: "10px 0 8px" }}>
              Customer and Partner Oversight
            </h2>
            <p style={{ margin: 0, color: "#d6d6d6", lineHeight: 1.6 }}>
              Review all customer and partner records, monitor package volume,
              and manage partner approval status from a single dashboard.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
              flex: "1 1 360px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#c8c8c8",
                }}
              >
                Customers
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                {customers.length}
              </div>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#c8c8c8",
                }}
              >
                Approved Partners
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                {approvedVendorCount}
              </div>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#c8c8c8",
                }}
              >
                Packages
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                {totalCustomerPackages}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Link
          to="/admin/activity-log"
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.08)",
            color: "#d4af37",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            border: "1px solid rgba(212,175,55,0.3)",
            textDecoration: "none",
          }}
        >
          📋 Full Activity Log
        </Link>
        <Link
          to="/admin/payouts"
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.08)",
            color: "#d4af37",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            border: "1px solid rgba(212,175,55,0.3)",
            textDecoration: "none",
          }}
        >
          💰 Payout Management
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            background: "#f5f5f5",
            color: "#555",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "start",
        }}
      >
        <section
          style={{
            background: "#fff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: 24,
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
              Customers
            </div>
            <h3 style={{ margin: "8px 0 0" }}>Customer Accounts</h3>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              onClick={() => setCustomerSortBy("name")}
              style={{
                background: customerSortBy === "name" ? "#111" : "#f0f0f0",
                color: customerSortBy === "name" ? "#fff" : "#111",
                border: "1px solid #ccc",
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              Sort by Name
            </button>
            <button
              type="button"
              onClick={() => setCustomerSortBy("packageCount")}
              style={{
                background:
                  customerSortBy === "packageCount" ? "#111" : "#f0f0f0",
                color: customerSortBy === "packageCount" ? "#fff" : "#111",
                border: "1px solid #ccc",
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              Sort by Package Count
            </button>
          </div>
          {customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                maxHeight: 720,
                overflowY: "auto",
              }}
            >
              {sortedCustomers.map((customer) => (
                <li
                  key={customer.id}
                  style={{
                    padding: 14,
                    border: "1px solid #e8e8e8",
                    borderRadius: 12,
                    marginBottom: 10,
                    background: getCustomerBackgroundColor(customer),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {customer.name || "Unnamed user"}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#666", marginTop: 2 }}
                      >
                        {customer.email || ""}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {customer.packageCount > 0 && (
                        <span
                          style={{
                            background: "#121212",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          📦 {customer.packageCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleCustomerExpanded(customer.id)}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #ccc",
                          background: "#f5f5f5",
                          borderRadius: 6,
                          color: "#444",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {expandedCustomerIds.includes(customer.id)
                          ? "Hide ▲"
                          : "Info ▼"}
                      </button>
                    </div>
                  </div>
                  {expandedCustomerIds.includes(customer.id) && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        fontSize: 13,
                        color: "#444",
                      }}
                    >
                      <div>
                        <span style={{ color: "#888" }}>Status:</span>{" "}
                        {customer.status || "inactive"}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Days Left:</span>{" "}
                        {getDaysLeft(customer.subscriptionEndsAt)}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Subscribed:</span>{" "}
                        {formatDate(customer.subscribedAt)}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Ends:</span>{" "}
                        {formatDate(customer.subscriptionEndsAt)}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Phone:</span>{" "}
                        {customer.phoneNumber || "—"}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Location:</span>{" "}
                        {customer.packageLocations?.length
                          ? customer.packageLocations.join(", ")
                          : "—"}
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "#888" }}>Address:</span>{" "}
                        {[
                          customer.streetAddress,
                          customer.city,
                          customer.state,
                          customer.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          style={{
            background: "#fff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: 24,
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
              Partners
            </div>
            <h3 style={{ margin: "8px 0 0" }}>Partner Accounts</h3>
          </div>
          {vendors.length === 0 ? (
            <p>No partners found.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                maxHeight: 720,
                overflowY: "auto",
              }}
            >
              {vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  style={{
                    padding: 14,
                    border: "1px solid #e8e8e8",
                    borderRadius: 12,
                    marginBottom: 10,
                    background: vendor.approved ? "#fff" : "#fff8f8",
                    borderLeft:
                      !vendor.approved && vendor.status !== "deactivated"
                        ? "3px solid #f0a500"
                        : vendor.status === "deactivated"
                          ? "3px solid #dc3545"
                          : "1px solid #e8e8e8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {vendor.businessName || "Unnamed partner"}
                      </div>
                      {vendor.referrerName && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6d28d9",
                            marginTop: 2,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>Referrer:</span>{" "}
                          {vendor.referrerName}
                        </div>
                      )}
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        <span
                          style={{
                            background:
                              vendor.status === "deactivated"
                                ? "#ffd9d9"
                                : vendor.approved
                                  ? "#d4edda"
                                  : "#fff3cd",
                            color:
                              vendor.status === "deactivated"
                                ? "#c00"
                                : vendor.approved
                                  ? "#1a7f37"
                                  : "#856404",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {vendor.status === "deactivated"
                            ? "Deactivated"
                            : vendor.approved
                              ? "Approved"
                              : "Pending Review"}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {vendor.packageCountTotal > 0 && (
                        <span
                          style={{
                            background: "#121212",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          📦 {vendor.packageCountTotal}
                        </span>
                      )}
                      <Link
                        to={`/admin/partner/${vendor.id}`}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #0b57d0",
                          borderRadius: 6,
                          color: "#0b57d0",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Portal
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleVendorExpanded(vendor.id)}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #ccc",
                          background: "#f5f5f5",
                          borderRadius: 6,
                          color: "#444",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {expandedVendorIds.includes(vendor.id)
                          ? "Hide ▲"
                          : "Info ▼"}
                      </button>
                    </div>
                  </div>
                  {expandedVendorIds.includes(vendor.id) && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        fontSize: 13,
                        color: "#444",
                      }}
                    >
                      <div>
                        <span style={{ color: "#888" }}>Email:</span>{" "}
                        {vendor.email || "—"}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Phone:</span>{" "}
                        {vendor.phoneNumber || "—"}
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Hours:</span>{" "}
                        {vendor.storeHours || "—"}
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "#888" }}>Address:</span>{" "}
                        {[
                          vendor.streetAddress,
                          vendor.city,
                          vendor.state,
                          vendor.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    {!vendor.approved ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Activate ${vendor.businessName || "this partner"} and send the welcome instructions email?`,
                            )
                          ) {
                            updateVendorApproval(vendor.id, true);
                          }
                        }}
                        disabled={updatingVendorId === vendor.id}
                        style={{
                          padding: "7px 16px",
                          background: "#1a7f37",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        {updatingVendorId === vendor.id
                          ? "Updating..."
                          : "✓ Activate"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to deactivate ${vendor.businessName || "this partner"}? They will no longer be able to access the portal.`,
                            )
                          ) {
                            updateVendorApproval(vendor.id, false);
                          }
                        }}
                        disabled={updatingVendorId === vendor.id}
                        style={{
                          padding: "7px 16px",
                          background: "#dc3545",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        {updatingVendorId === vendor.id
                          ? "Updating..."
                          : "Deactivate"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div
        style={{
          marginTop: 32,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#8a6a00",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Live
            </div>
            <h3 style={{ margin: "6px 0 0" }}>Today's Activity</h3>
          </div>
          <Link
            to="/admin/activity-log"
            style={{ fontSize: 14, color: "#0b57d0", fontWeight: 600 }}
          >
            View Complete Log →
          </Link>
        </div>
        {todayEntries.length === 0 ? (
          <p style={{ color: "#888", margin: 0 }}>
            No activity recorded today yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "#f8f5ea", textAlign: "left" }}>
                  {["Time", "Type", "Partner", "User", "Packages"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        fontWeight: 600,
                        color: "#8a6a00",
                        textTransform: "uppercase",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayEntries.map((entry, i) => {
                  const isSignup = entry.type === "signup";
                  const typeColors = {
                    "check-in": {
                      bg: "#e6f4ea",
                      color: "#1a7f37",
                      label: "Check In",
                    },
                    delivery: {
                      bg: "#fff3cd",
                      color: "#856404",
                      label: "Delivered",
                    },
                    signup: {
                      bg: "#e8f0fe",
                      color: "#1a56db",
                      label: "Sign Up",
                    },
                    subscription: {
                      bg: "#f3e8ff",
                      color: "#6d28d9",
                      label: "Subscription",
                    },
                  };
                  const ts = typeColors[entry.type] || {
                    bg: "#f0f0f0",
                    color: "#444",
                    label: entry.type,
                  };
                  const time = entry.timestamp?.toDate
                    ? entry.timestamp.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  return (
                    <tr
                      key={`${entry.partnerId || "g"}-${entry.id}`}
                      style={{
                        borderTop: "1px solid #eee",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "#555",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {time}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            background: ts.bg,
                            color: ts.color,
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {ts.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {isSignup ? (
                          <span style={{ color: "#aaa" }}>—</span>
                        ) : (
                          <Link
                            to={`/admin/partner/${entry.partnerId}`}
                            style={{ color: "#0b57d0", fontWeight: 600 }}
                          >
                            {entry.partnerName}
                          </Link>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600 }}>
                          {isSignup
                            ? entry.userName
                            : entry.customerName || "Unknown"}
                        </div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {isSignup ? entry.userEmail : entry.customerEmail}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: isSignup ? "#aaa" : "#111",
                          fontWeight: 600,
                        }}
                      >
                        {isSignup ? "—" : entry.packageCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
