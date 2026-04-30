import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
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
      await updateDoc(doc(db, "vendors", vendorId), {
        approved,
        status: approved ? "approved" : "deactivated",
        approvedAt: approved ? serverTimestamp() : null
      });

      setVendors((currentVendors) =>
        currentVendors.map((vendor) =>
          vendor.id === vendorId
            ? { ...vendor, approved, status: approved ? "approved" : "deactivated" }
            : vendor
        )
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
        : [...current, customerId]
    );
  };

  const toggleVendorExpanded = (vendorId) => {
    setExpandedVendorIds((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId]
    );
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [customerSnapshot, vendorSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "vendors"))
        ]);

        const vendorDocs = vendorSnapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data()
        }));

        const vendorPackageSnapshots = await Promise.all(
          vendorDocs.map((vendor) =>
            getDocs(collection(db, "vendors", vendor.id, "packageCounts"))
          )
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
            packageLocations: customerPackageLocations[entry.id] || []
          }))
        );

        setVendors(
          vendorDocs.map((vendor, index) => ({
            ...vendor,
            packageCountTotal: vendorPackageSnapshots[index].docs.reduce(
              (sum, entry) => sum + (entry.data().count || 0),
              0
            )
          }))
        );
      } catch (fetchError) {
        console.error("Error loading admin data:", fetchError);
        setError("Unable to load admin data. Firestore rules must allow your admin UID to read users and partners.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
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
      (left.name || "").localeCompare(right.name || "")
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
      <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
        <h2>Admin</h2>
        <p>Loading customers and partners...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
        <h2>Admin</h2>
        <p>{error}</p>
      </div>
    );
  }

  const totalCustomerPackages = customers.reduce(
    (sum, customer) => sum + (customer.packageCount || 0),
    0
  );
  const approvedVendorCount = vendors.filter((vendor) => vendor.approved).length;

  return (
    <div style={{ maxWidth: 1180, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
          color: "#f5f5f5",
          borderRadius: 24,
          padding: "30px 28px",
          marginBottom: 24,
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-start"
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div
              style={{
                color: "#d4af37",
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: "uppercase"
              }}
            >
              Admin Portal
            </div>
            <h2 style={{ margin: "10px 0 8px" }}>Customer and Partner Oversight</h2>
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
              flex: "1 1 360px"
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16
              }}
            >
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
                Customers
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{customers.length}</div>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16
              }}
            >
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
                Approved Partners
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{approvedVendorCount}</div>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16
              }}
            >
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
                Packages
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{totalCustomerPackages}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "start"
        }}
      >
        <section
          style={{
            background: "#fff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#8a6a00",
                letterSpacing: 1,
                textTransform: "uppercase"
              }}
            >
              Customers
            </div>
            <h3 style={{ margin: "8px 0 0" }}>Customer Accounts</h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setCustomerSortBy("name")}
              style={{
                background: customerSortBy === "name" ? "#111" : "#f0f0f0",
                color: customerSortBy === "name" ? "#fff" : "#111",
                border: "1px solid #ccc",
                borderRadius: 999,
                padding: "8px 14px"
              }}
            >
              Sort by Name
            </button>
            <button
              type="button"
              onClick={() => setCustomerSortBy("packageCount")}
              style={{
                background: customerSortBy === "packageCount" ? "#111" : "#f0f0f0",
                color: customerSortBy === "packageCount" ? "#fff" : "#111",
                border: "1px solid #ccc",
                borderRadius: 999,
                padding: "8px 14px"
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
                overflowY: "auto"
              }}
            >
              {sortedCustomers.map((customer) => (
                <li
                  key={customer.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ccc",
                    borderRadius: 10,
                    marginBottom: 12,
                    background: getCustomerBackgroundColor(customer)
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{customer.name || "Unnamed user"}</strong>
                    <div>{customer.packageCount || 0}: PKGS</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCustomerExpanded(customer.id)}
                    style={{
                      marginTop: 8,
                      padding: 0,
                      border: "none",
                      background: "none",
                      color: "#0b57d0",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {expandedCustomerIds.includes(customer.id) ? "Hide Info" : "Info"}
                  </button>
                  {expandedCustomerIds.includes(customer.id) && (
                    <div style={{ marginTop: 12 }}>
                      <div>Status: {customer.status || "inactive"}</div>
                      <div>Subscribed: {formatDate(customer.subscribedAt)}</div>
                      <div>Ends: {formatDate(customer.subscriptionEndsAt)}</div>
                      <div>Days Left: {getDaysLeft(customer.subscriptionEndsAt)}</div>
                      <div>Email: {customer.email || "No email"}</div>
                      <div>Phone: {customer.phoneNumber || "No phone number"}</div>
                      <div>
                        Checked In At: {customer.packageLocations?.length
                          ? customer.packageLocations.join(", ")
                          : "No checked-in location"}
                      </div>
                      <div>
                        Address: {customer.streetAddress || "No street address"}
                        {customer.city ? `, ${customer.city}` : ""}
                        {customer.state ? `, ${customer.state}` : ""}
                        {customer.zipCode ? ` ${customer.zipCode}` : ""}
                      </div>
                      <div>User ID: {customer.id}</div>
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
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#8a6a00",
                letterSpacing: 1,
                textTransform: "uppercase"
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
                overflowY: "auto"
              }}
            >
              {vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ccc",
                    borderRadius: 10,
                    marginBottom: 12,
                    backgroundColor: vendor.approved ? "#ffffff" : "#ffdddd"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{vendor.businessName || "Unnamed partner"}</strong>
                    <div>{vendor.packageCountTotal || 0}: PKGS</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVendorExpanded(vendor.id)}
                    style={{
                      marginTop: 8,
                      padding: 0,
                      border: "none",
                      background: "none",
                      color: "#0b57d0",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {expandedVendorIds.includes(vendor.id) ? "Hide Info" : "Info"}
                  </button>
                  {expandedVendorIds.includes(vendor.id) && (
                    <div style={{ marginTop: 12 }}>
                      <div>Email: {vendor.email || "No email"}</div>
                      <div>Phone: {vendor.phoneNumber || "No phone number"}</div>
                      <div>
                        Status: {vendor.status === "deactivated"
                          ? "Deactivated"
                          : vendor.approved
                            ? "Approved"
                            : "Pending Review"}
                      </div>
                      <div>
                        Address: {vendor.streetAddress || "No street address"}
                        {vendor.city ? `, ${vendor.city}` : ""}
                        {vendor.state ? `, ${vendor.state}` : ""}
                        {vendor.zipCode ? ` ${vendor.zipCode}` : ""}
                      </div>
                      <div>Store Hours: {vendor.storeHours || "Not provided"}</div>
                      <div>Partner ID: {vendor.id}</div>
                    </div>
                  )}
                  {!vendor.approved ? (
                    <button
                      type="button"
                      onClick={() => updateVendorApproval(vendor.id, true)}
                      disabled={updatingVendorId === vendor.id}
                      style={{ marginTop: 12 }}
                    >
                      {updatingVendorId === vendor.id ? "Updating..." : "Approve"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateVendorApproval(vendor.id, false)}
                      disabled={updatingVendorId === vendor.id}
                      style={{ marginTop: 12 }}
                    >
                      {updatingVendorId === vendor.id ? "Updating..." : "Deactivate"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Admin;
