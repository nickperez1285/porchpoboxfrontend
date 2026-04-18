import React from "react";
import { Link } from "react-router-dom";
import CustomerList from "./CustomerList";

const Vendors = ({ user, vendorProfile, authLoading }) => {
    if (authLoading) {
        return (
            <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center" }}>
                <h2>Vendor Portal</h2>
                <p>Loading vendor access...</p>
            </div>
        );
    }

    if (user && vendorProfile) {
        if (!vendorProfile.approved) {
            return (
                <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center" }}>
                    <h2>Vendor Portal</h2>
                    <p>
                        {vendorProfile.status === "deactivated"
                            ? "Your vendor account has been deactivated. Please contact Porch P.O. Box for assistance."
                            : "Your registration information has been received and your request to become a vendor is being reviewed."}
                    </p>
                    <p>
                        <Link to="/vendor/profile">Vendor Profile</Link>
                    </p>
                </div>
            );
        }

        return (
            <div style={{ maxWidth: 900, margin: "60px auto" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2>Vendor Portal</h2>
                    <p>Welcome {vendorProfile.businessName}</p>
                    <p>Packages checked in: {vendorProfile.packageCheckInCount || 0}</p>
                    <p>
                        <Link to="/vendor/package-check-in">Package Check In</Link>
                    </p>
                </div>
                <CustomerList vendorId={vendorProfile.id} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center" }}>
            <h2>Vendor Portal</h2>
            <p>Vendors can sign in to view the customer list and manage their account.</p>
            <p>
                <Link to="/vendor/login">Vendor Login</Link>
            </p>
            <p>
                <Link to="/vendor/register">Vendor Registration</Link>
            </p>
            {user && !vendorProfile && (
                <p>This account is signed in, but it is not registered as a vendor.</p>
            )}
        </div>
    );
};

export default Vendors;
