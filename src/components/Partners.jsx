import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import CustomerList from "./CustomerList";
import PartnerStatusLegend from "./PartnerStatusLegend";
import { db } from "../firebase";

const Partners = ({ user, partnerProfile, authLoading }) => {
    const [packageCountTotal, setPackageCountTotal] = useState(0);

    useEffect(() => {
        if (!partnerProfile?.id || !partnerProfile.approved) {
            setPackageCountTotal(0);
            return () => {};
        }

        return onSnapshot(
            doc(db, "partners", partnerProfile.id),
            (snapshot) => {
                const data = snapshot.exists() ? snapshot.data() : {};
                setPackageCountTotal(Number(data.packageCheckInCount) || 0);
            },
            (error) => {
                console.error("Error loading vendor package totals:", error);
                setPackageCountTotal(0);
            }
        );
    }, [partnerProfile]);

    if (authLoading) {
        return (
            <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center" }}>
                <h2>Partner Portal</h2>
                <p>Loading partner access...</p>
            </div>
        );
    }

    if (user && partnerProfile) {
        if (!partnerProfile.approved) {
            return (
                <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
                    <div
                        style={{
                            background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
                            color: "#f5f5f5",
                            borderRadius: 20,
                            padding: "28px 24px",
                            textAlign: "center"
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>Partner Portal</h2>
                        <p style={{ color: "#d6d6d6" }}>
                            {partnerProfile.status === "deactivated"
                                ? "Your partner account has been deactivated. Please contact Porch P.O. Box for assistance."
                                : "Your registration information has been received and your request to become a partner is being reviewed."}
                        </p>
                        <p style={{ marginBottom: 0 }}>
                            <Link to="/partner/profile">Partner Profile</Link>
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ maxWidth: 1080, margin: "60px auto", padding: "0 20px" }}>
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
                        <div style={{ maxWidth: 540 }}>
                            <div
                                style={{
                                    color: "#d4af37",
                                    fontSize: 12,
                                    letterSpacing: 1.2,
                                    textTransform: "uppercase"
                                }}
                            >
                                Partner Portal
                            </div>
                            <h2 style={{ margin: "10px 0 8px" }}>{partnerProfile.businessName}</h2>
                            <p style={{ margin: 0, color: "#d6d6d6", lineHeight: 1.6 }}>
                                Review active customer deliveries, manage package intake,
                                and clear delivered packages from your location.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 14,
                                flex: "1 1 320px"
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
                                    Packages In Stock
                                </div>
                                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
                                    {packageCountTotal}
                                </div>
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
                                    Actions
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <Link to="/partner/package-check-in">Check In Packages</Link>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <Link to="/partner/profile">Partner Profile</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "#fff",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: 20,
                        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)"
                    }}
                >
                    <PartnerStatusLegend />
                    <CustomerList
                      vendorId={partnerProfile.id}
                      partnerLocationName={
                        partnerProfile.businessName ||
                        partnerProfile.streetAddress ||
                        "Unnamed partner"
                      }
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
            <div
                style={{
                    background: "linear-gradient(135deg, #121212 0%, #1d1d1d 100%)",
                    color: "#f5f5f5",
                    borderRadius: 20,
                    padding: "28px 24px",
                    textAlign: "center"
                }}
            >
                <h2 style={{ marginTop: 0 }}>Partner Portal</h2>
                <p style={{ color: "#d6d6d6" }}>
                    Partners can sign in to review customer packages, check in new deliveries,
                    and manage their location profile.
                </p>
                <p>
                    <Link to="/partner/login">Partner Login</Link>
                </p>
                <p>
                    <Link to="/partner/register">Become a Partner</Link>
                </p>
                {user && !partnerProfile && (
                    <p>This account is signed in, but it is not registered as a partner.</p>
                )}
            </div>
        </div>
    );
};

export default Partners;
