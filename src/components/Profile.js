import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const hasActiveSubscription = Boolean(
    profileData?.status === "active" &&
    (profileData?.subscribedAt || profileData?.subscriptionEndsAt)
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        if (profileSnapshot.exists()) {
          setProfileData(profileSnapshot.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadProfile();
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
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)"
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
          <div>
            <p style={{ margin: 0, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }}>
              User Profile
            </p>
            <h2 style={{ margin: "8px 0 6px" }}>{user.displayName || profileData?.name || "Account Holder"}</h2>
            <p style={{ margin: 0, color: "#d6d6d6" }}>
              Manage your account details and mailing information.
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
              padding: 16
            }}
          >
            {hasActiveSubscription ? (
              <>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
                  Subscription Status
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>
                  {profileData?.status}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#c8c8c8" }}>
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
          gap: 20
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 24,
            background: "#fff"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Contact Information</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Name</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{user.displayName || profileData?.name || "Not provided"}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Email</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{user.email || "Not available"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Phone</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.phoneNumber || "Not provided"}</div>
          </div>
        </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "#fff"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Street Address</div>
          <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.streetAddress || "Not provided"}</div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>City</div>
          <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.city || "Not provided"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>State</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.state || "Not provided"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Zip Code</div>
            <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.zipCode || "Not provided"}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "#faf7ef"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Account</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Account Type</div>
          <div style={{ marginTop: 4, fontSize: 18 }}>Customer</div>
        </div>
        {hasActiveSubscription && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Subscription Status</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.status}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Subscribed On</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{formatDate(profileData?.subscribedAt)}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Subscription Ends</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{formatDate(profileData?.subscriptionEndsAt)}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Days Left</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{getDaysLeft(profileData?.subscriptionEndsAt)}</div>
            </div>
          </>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/profile/edit">Edit</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
    </div >
  );
};

export default Profile;
