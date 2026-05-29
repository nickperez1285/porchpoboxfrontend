import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { updateEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import PrefLocationModal from "./PrefLocationModal";
import SubscriptionSettings from "./SubscriptionSettings";
import "./UserSettings.css";

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "Not set";
};

const getDaysLeft = (value) => {
  const date = toDate(value);
  if (!date) return null;

  return Math.max(
    0,
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
};

const getStatusDisplay = (status) => {
  switch (status) {
    case "active":
      return { label: "Active", className: "settings-status--active" };
    case "trial":
      return { label: "Trial", className: "settings-status--trial" };
    case "inactive":
    case "canceled":
      return { label: "Inactive", className: "settings-status--inactive" };
    default:
      return { label: "Unknown", className: "settings-status--unknown" };
  }
};

const UserSettings = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfileData(snap.data());
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.uid]);

  useEffect(() => {
    if (profileData) {
      setName(user.displayName || profileData.name || "");
      setEmail(user.email || profileData.email || "");
      setPhoneNumber(profileData.phoneNumber || "");
      setStreetAddress(profileData.streetAddress || "");
      setCity(profileData.city || "");
      setState(profileData.state || "");
      setZipCode(profileData.zipCode || "");
      setNotificationsEnabled(profileData.notificationsEnabled !== false);
    }
  }, [profileData, user.displayName, user.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (email !== user.email) await updateEmail(auth.currentUser, email);
      if (name !== user.displayName)
        await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), {
        name,
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zipCode,
      });
      setSuccess("Settings saved.");
      setEditing(false);
      setProfileData((prev) => ({
        ...prev,
        name,
        email,
        phoneNumber,
        streetAddress,
        city,
        state,
        zipCode,
      }));
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNotifToggle = async () => {
    const next = !notificationsEnabled;
    setSavingNotif(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationsEnabled: next,
      });
      setNotificationsEnabled(next);
      setProfileData((prev) => ({ ...prev, notificationsEnabled: next }));
    } catch (err) {
      console.error("Error saving notification setting:", err);
    } finally {
      setSavingNotif(false);
    }
  };

  if (loading)
    return (
      <div style={{ maxWidth: 760, margin: "80px auto", padding: "0 20px" }}>
        <p>Loading...</p>
      </div>
    );

  const handlePrefDone = async () => {
    setShowPrefModal(false);
    // Refresh profile data to show updated prefLocation
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfileData(snap.data());
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const shouldHighlightLocation =
    searchParams.get("highlight") === "location" && !profileData?.prefLocation;
  const subscriptionStatus = getStatusDisplay(profileData?.status);
  const hasSubscriptionDates = Boolean(
    profileData?.subscribedAt || profileData?.subscriptionEndsAt,
  );
  const daysLeft = getDaysLeft(profileData?.subscriptionEndsAt);
  const renewalClass =
    typeof daysLeft !== "number"
      ? "settings-renewal--unknown"
      : daysLeft <= 7
        ? "settings-renewal--urgent"
        : daysLeft <= 14
          ? "settings-renewal--soon"
          : "settings-renewal--ok";

  return (
    <div className="settings-container">
      {showPrefModal && (
        <PrefLocationModal user={user} onDone={handlePrefDone} />
      )}
      <div className="settings-hero">
        <div className="settings-hero-eyebrow">User Profile</div>
        <h2 style={{ margin: "8px 0 6px" }}>Settings</h2>
        <p style={{ margin: 0, color: "#d6d6d6" }}>
          Manage your contact details, delivery preferences, and subscription.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link to="/profile">← Back to Profile</Link>
      </div>

      {success && (
        <p style={{ color: "#1a7f37", marginBottom: 16 }}>{success}</p>
      )}

      {!editing ? (
        <div className="settings-grid">
          <div className="settings-card">
            <h3 style={{ marginTop: 0 }}>Contact Information</h3>
            <div style={{ marginBottom: 14 }}>
              <div className="settings-label">Name</div>
              <div className="settings-value">
                {profileData?.name || user.displayName || "Not provided"}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="settings-label">Email</div>
              <div className="settings-value">
                {user.email || "Not available"}
              </div>
            </div>
            <div>
              <div className="settings-label">Phone</div>
              <div className="settings-value">
                {profileData?.phoneNumber || "Not provided"}
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
            <div style={{ marginBottom: 14 }}>
              <div className="settings-label">Street Address</div>
              <div className="settings-value">
                {profileData?.streetAddress || "Not provided"}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="settings-label">City</div>
              <div className="settings-value">
                {profileData?.city || "Not provided"}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <div className="settings-label">State</div>
                <div className="settings-value">
                  {profileData?.state || "Not provided"}
                </div>
              </div>
              <div>
                <div className="settings-label">ZIP Code</div>
                <div className="settings-value">
                  {profileData?.zipCode || "Not provided"}
                </div>
              </div>
            </div>
          </div>

          <div
            className="settings-card-full"
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <Link
              to={`/forgot-password?email=${encodeURIComponent(user.email || "")}`}
            >
              Change Password
            </Link>
          </div>

          <div className="settings-card settings-card-full">
            <div className="settings-subscription-header">
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>Subscription</h3>
                <p className="settings-subscription-copy">
                  Review your current subscription and manage plan, renewal, and
                  discounts.
                </p>
              </div>
              <span
                className={`settings-status-pill ${subscriptionStatus.className}`}
              >
                {subscriptionStatus.label}
              </span>
            </div>

            {hasSubscriptionDates ? (
              <>
                <div className="settings-subscription-dates">
                  <div>
                    <div className="settings-subscription-label">Started</div>
                    <div className="settings-subscription-value">
                      {formatDate(profileData?.subscribedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="settings-subscription-label">
                      Renews/Ends
                    </div>
                    <div className="settings-subscription-value">
                      {formatDate(profileData?.subscriptionEndsAt)}
                    </div>
                  </div>
                  <div>
                    <div className="settings-subscription-label">Days Left</div>
                    <div
                      className={`settings-subscription-value ${renewalClass}`}
                    >
                      {typeof daysLeft === "number" ? daysLeft : "Not set"}
                    </div>
                  </div>
                </div>

                {typeof daysLeft === "number" && daysLeft <= 7 ? (
                  <div className={`settings-renewal-alert ${renewalClass}`}>
                    Renew soon to avoid interruptions to package receiving.
                  </div>
                ) : null}
              </>
            ) : (
              <p className="settings-subscription-empty">
                No active subscription dates are on file yet. Choose a plan
                below to start or update your subscription.
              </p>
            )}

            <SubscriptionSettings user={user} profileData={profileData} />
          </div>

          <div className="settings-card settings-card-full">
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>🔔 Notifications</h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666" }}>
              When on, you get an email when a package is checked in
              {profileData?.phoneNumber
                ? " and a text message to your phone on file"
                : ""}
              {/* . Add a phone number in Edit to enable SMS alerts. */}
            </p>
            <div className="notif-toggle-wrap">
              <button
                type="button"
                onClick={handleNotifToggle}
                disabled={savingNotif}
                className="notif-toggle-btn"
                style={{
                  background: notificationsEnabled ? "#1a7f37" : "#ccc",
                }}
                aria-label="Toggle notifications"
              >
                <span
                  className="notif-toggle-circle"
                  style={{ left: notificationsEnabled ? 26 : 3 }}
                />
              </button>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: notificationsEnabled ? "#1a7f37" : "#888",
                }}
              >
                {notificationsEnabled ? "On" : "Off"}
              </span>
              {savingNotif && (
                <span style={{ fontSize: 13, color: "#888" }}>Saving...</span>
              )}
            </div>
          </div>

          <div
            className={`settings-card settings-card-full ${shouldHighlightLocation ? "location-highlight" : ""}`}
          >
            <h3 style={{ marginTop: 0 }}>Preferred Location</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 14px" }}>
              This is where your packages will be delivered. It was
              automatically set when your first package was checked in. You can
              change it anytime.
            </p>
            {profileData?.prefLocation ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>
                  {profileData.prefLocation.businessName}
                </div>
                {profileData.prefLocation.streetAddress && (
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {[
                      profileData.prefLocation.streetAddress,
                      profileData.prefLocation.city,
                      profileData.prefLocation.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#888", margin: 0 }}>
                No preferred location set yet. It will be set automatically when
                a partner checks in your first package.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowPrefModal(true)}
              style={{ marginTop: 14 }}
            >
              {profileData?.prefLocation ? "Change Location" : "Set Location"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="settings-grid">
          <div className="settings-card">
            <h3 style={{ marginTop: 0 }}>Contact Information</h3>
            {[
              {
                label: "Full Name",
                value: name,
                setter: setName,
                type: "text",
                autoComplete: "name",
              },
              {
                label: "Email",
                value: email,
                setter: setEmail,
                type: "email",
                autoComplete: "email",
              },
              {
                label: "Phone",
                value: phoneNumber,
                setter: setPhoneNumber,
                type: "tel",
                autoComplete: "tel",
              },
            ].map(({ label, value, setter, type, autoComplete }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div className="settings-label" style={{ marginBottom: 4 }}>
                  {label}
                </div>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  autoComplete={autoComplete}
                  required
                  className="settings-input"
                />
              </div>
            ))}
          </div>

          <div className="settings-card">
            <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
            {[
              {
                label: "Street Address",
                value: streetAddress,
                setter: setStreetAddress,
                autoComplete: "street-address",
              },
              {
                label: "City",
                value: city,
                setter: setCity,
                autoComplete: "address-level2",
              },
              {
                label: "State",
                value: state,
                setter: setState,
                autoComplete: "address-level1",
              },
              {
                label: "ZIP Code",
                value: zipCode,
                setter: setZipCode,
                autoComplete: "postal-code",
              },
            ].map(({ label, value, setter, autoComplete }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div className="settings-label" style={{ marginBottom: 4 }}>
                  {label}
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  autoComplete={autoComplete}
                  required
                  className="settings-input"
                />
              </div>
            ))}
          </div>

          {error && (
            <p style={{ color: "red", gridColumn: "1 / -1" }}>{error}</p>
          )}

          <div
            className="settings-card-full"
            style={{ display: "flex", gap: 12 }}
          >
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserSettings;
