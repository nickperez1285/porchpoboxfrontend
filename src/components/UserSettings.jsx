import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updateEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import PrefLocationModal from "./PrefLocationModal";

const UserSettings = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);

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
      if (name !== user.displayName) await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name, email, phoneNumber, streetAddress, city, state, zipCode });
      setSuccess("Settings saved.");
      setEditing(false);
      setProfileData((prev) => ({ ...prev, name, email, phoneNumber, streetAddress, city, state, zipCode }));
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
      await updateDoc(doc(db, "users", user.uid), { notificationsEnabled: next });
      setNotificationsEnabled(next);
      setProfileData((prev) => ({ ...prev, notificationsEnabled: next }));
    } catch (err) {
      console.error("Error saving notification setting:", err);
    } finally {
      setSavingNotif(false);
    }
  };

  if (loading) return <div style={{ maxWidth: 760, margin: "80px auto", padding: "0 20px" }}><p>Loading...</p></div>;

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

  return (
    <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
      {showPrefModal && (
        <PrefLocationModal user={user} onDone={handlePrefDone} />
      )}
      <div
        style={{
          background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
          color: "#f5f5f5",
          borderRadius: 18,
          padding: "28px 24px",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
          User Profile
        </div>
        <h2 style={{ margin: "8px 0 6px" }}>Settings</h2>
        <p style={{ margin: 0, color: "#d6d6d6" }}>Manage your contact details and mailing address.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link to="/profile">← Back to Profile</Link>
      </div>

      {success && <p style={{ color: "#1a7f37", marginBottom: 16 }}>{success}</p>}

      {!editing ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Contact Information</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Name</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.name || user.displayName || "Not provided"}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Email</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{user.email || "Not available"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Phone</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.phoneNumber || "Not provided"}</div>
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>Street Address</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.streetAddress || "Not provided"}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>City</div>
              <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.city || "Not provided"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>State</div>
                <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.state || "Not provided"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>ZIP Code</div>
                <div style={{ marginTop: 4, fontSize: 18 }}>{profileData?.zipCode || "Not provided"}</div>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => setEditing(true)}>Edit</button>
            <Link to={`/forgot-password?email=${encodeURIComponent(user.email || "")}`}>Change Password</Link>
          </div>

          <div style={{ gridColumn: "1 / -1", border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>🔔 Notifications</h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666" }}>Receive an email when a package is checked in at your location.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                onClick={handleNotifToggle}
                disabled={savingNotif}
                style={{
                  width: 52, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
                  background: notificationsEnabled ? "#1a7f37" : "#ccc",
                  position: "relative", transition: "background 0.2s", flexShrink: 0
                }}
                aria-label="Toggle notifications"
              >
                <span style={{
                  position: "absolute", top: 3, left: notificationsEnabled ? 26 : 3,
                  width: 22, height: 22, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                }} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 600, color: notificationsEnabled ? "#1a7f37" : "#888" }}>
                {notificationsEnabled ? "On" : "Off"}
              </span>
              {savingNotif && <span style={{ fontSize: 13, color: "#888" }}>Saving...</span>}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Preferred Location</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 14px" }}>
              This is where your packages will be delivered. It was automatically set when your first package was checked in. You can change it anytime.
            </p>
            {profileData?.prefLocation ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>
                  {profileData.prefLocation.businessName}
                </div>
                {profileData.prefLocation.streetAddress && (
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {[profileData.prefLocation.streetAddress, profileData.prefLocation.city, profileData.prefLocation.state].filter(Boolean).join(", ")}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#888", margin: 0 }}>No preferred location set yet. It will be set automatically when a partner checks in your first package.</p>
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
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Contact Information</h3>
            {[
              { label: "Full Name", value: name, setter: setName, type: "text", autoComplete: "name" },
              { label: "Email", value: email, setter: setEmail, type: "email", autoComplete: "email" },
              { label: "Phone", value: phoneNumber, setter: setPhoneNumber, type: "tel", autoComplete: "tel" },
            ].map(({ label, value, setter, type, autoComplete }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                <input type={type} value={value} onChange={(e) => setter(e.target.value)} autoComplete={autoComplete} required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Mailing Address</h3>
            {[
              { label: "Street Address", value: streetAddress, setter: setStreetAddress, autoComplete: "street-address" },
              { label: "City", value: city, setter: setCity, autoComplete: "address-level2" },
              { label: "State", value: state, setter: setState, autoComplete: "address-level1" },
              { label: "ZIP Code", value: zipCode, setter: setZipCode, autoComplete: "postal-code" },
            ].map(({ label, value, setter, autoComplete }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                <input type="text" value={value} onChange={(e) => setter(e.target.value)} autoComplete={autoComplete} required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          {error && <p style={{ color: "red", gridColumn: "1 / -1" }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, gridColumn: "1 / -1" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            <button type="button" onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserSettings;
