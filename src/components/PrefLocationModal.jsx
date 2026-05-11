import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";

const PrefLocationModal = ({ user, onDone, required = false }) => {
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "partners"), where("approved", "==", true))
        );
        setPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading partners:", err);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const partner = partners.find((p) => p.id === selected);
      await updateDoc(doc(db, "users", user.uid), {
        prefLocation: {
          id: selected,
          businessName: partner?.businessName || "Unknown",
          streetAddress: partner?.streetAddress || "",
          city: partner?.city || "",
          state: partner?.state || "",
        }
      });
      onDone();
    } catch (err) {
      console.error("Error saving preferred location:", err);
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 12, color: "#8a6a00", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          Welcome to Porch P.O. Box
        </div>
        <h2 style={{ margin: "0 0 10px" }}>Choose Your Preferred Location</h2>
        <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
          {required
            ? "Please select a partner location before subscribing. This is where your packages will be delivered."
            : "Select the partner location where you'd like your packages delivered. You can change this anytime in your profile settings."}
        </p>

        {partners.length === 0 ? (
          <p style={{ color: "#888" }}>Loading locations...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, maxHeight: 280, overflowY: "auto" }}>
            {partners.map((partner) => (
              <label
                key={partner.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `2px solid ${selected === partner.id ? "#d4af37" : "#eee"}`,
                  background: selected === partner.id ? "#fffdf0" : "#fafafa",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="prefLocation"
                  value={partner.id}
                  checked={selected === partner.id}
                  onChange={() => setSelected(partner.id)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{partner.businessName}</div>
                  {(partner.streetAddress || partner.city) && (
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                      {[partner.streetAddress, partner.city, partner.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {partner.storeHours && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{partner.storeHours}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          {!required && (
            <button
              type="button"
              onClick={onDone}
              style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
            >
              Skip for now
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!selected || saving}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: selected ? "#121212" : "#ccc",
              color: "#fff",
              cursor: selected ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrefLocationModal;
