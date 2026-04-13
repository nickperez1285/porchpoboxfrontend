import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const Admin = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingVendorId, setUpdatingVendorId] = useState("");
  const [error, setError] = useState("");

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
      setError(`Unable to ${approved ? "approve" : "deactivate"} vendor.`);
    } finally {
      setUpdatingVendorId("");
    }
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [customerSnapshot, vendorSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "vendors"))
        ]);

        setCustomers(
          customerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );

        setVendors(
          vendorSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      } catch (fetchError) {
        console.error("Error loading admin data:", fetchError);
        setError("Unable to load admin data. Firestore rules must allow your admin UID to read users and vendors.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
        <h2>Admin</h2>
        <p>Loading customers and vendors...</p>
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

  return (
    <div style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <center><h2>Admin Portal</h2></center>

      </div>
      <hr />
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "start"
        }}
      >
        <section>
          <h3>Customers</h3>
          {customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {customers.map((customer) => (
                <li
                  key={customer.id}
                  style={{ padding: 16, border: "1px solid #ccc", marginBottom: 12 }}
                >
                  <strong>{customer.name || "Unnamed user"}</strong>
                  <div>Email: {customer.email || "No email"}</div>
                  <div>Phone: {customer.phoneNumber || "No phone number"}</div>
                  <div>
                    Address: {customer.streetAddress || "No street address"}
                    {customer.city ? `, ${customer.city}` : ""}
                    {customer.state ? `, ${customer.state}` : ""}
                    {customer.zipCode ? ` ${customer.zipCode}` : ""}
                  </div>
                  <div>User ID: {customer.id}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Vendors</h3>
          {vendors.length === 0 ? (
            <p>No vendors found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ccc",
                    marginBottom: 12,
                    backgroundColor: vendor.approved ? "#ffffff" : "#ffdddd"
                  }}
                >
                  <strong>{vendor.businessName || "Unnamed vendor"}</strong>
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
                  <div>Vendor ID: {vendor.id}</div>
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
