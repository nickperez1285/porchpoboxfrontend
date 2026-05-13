import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { db } from "../firebase";
import PartnerStatusLegend from "./PartnerStatusLegend";
import "./PackageCheckIn.css";

const rowStatusClass = (user) => {
  if (user.status === "active") return "pkg-checkin__row--active";
  if (user.status === "trial") return "pkg-checkin__row--trial";
  return "pkg-checkin__row--inactive";
};

const PackageCheckIn = ({ partnerProfile, onPackagesCheckedIn }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [packageQuantities, setPackageQuantities] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [usersSnapshot, packageCountsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(
            collection(db, "partners", partnerProfile.id, "packageCounts"),
          ),
        ]);

        const packageCounts = Object.fromEntries(
          packageCountsSnapshot.docs.map((entry) => [
            entry.id,
            {
              count: Number(entry.data().count) || 0,
              totalReceived:
                Number(entry.data().totalReceived) ||
                Number(entry.data().count) ||
                0,
              totalPickedUp: Number(entry.data().totalPickedUp) || 0,
            },
          ]),
        );

        setUsers(
          usersSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
            packagesCheckedIn: Number(entry.data().packagesCheckedIn) || 0,
            packagesDelivered: Number(entry.data().packagesDelivered) || 0,
            packageCount: packageCounts[entry.id]?.count || 0,
            totalReceived: packageCounts[entry.id]?.totalReceived || 0,
            totalPickedUp: packageCounts[entry.id]?.totalPickedUp || 0,
          })),
        );
      } catch (loadError) {
        console.error("Error loading users for package check in:", loadError);
        setError("Unable to load users for package check in.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [partnerProfile.id]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(term),
    );
  }, [search, users]);

  const toggleExpanded = (userId) => {
    setExpandedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const getNormalizedPackageQuantity = (userId) =>
    Math.max(1, Number(packageQuantities[userId]) || 1);

  const toggleSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
    setPackageQuantities((current) => ({
      ...current,
      [userId]: current[userId] ?? "1",
    }));
  };

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id),
  );
  const totalSelectedPackages = selectedUsers.reduce(
    (sum, user) => sum + getNormalizedPackageQuantity(user.id),
    0,
  );

  const updatePackageQuantity = (userId, nextValue) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: nextValue,
    }));
  };

  const finalizePackageQuantity = (userId) => {
    setPackageQuantities((current) => ({
      ...current,
      [userId]: String(getNormalizedPackageQuantity(userId)),
    }));
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/package-check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorName:
              partnerProfile.businessName ||
              partnerProfile.streetAddress ||
              "Your Porch P.O. Box Location",
            partnerId: partnerProfile.id,
            recipients: selectedUsers.map((user) => ({
              id: user.id,
              name: user.name || "Customer",
              email: user.email,
              packageCount: getNormalizedPackageQuantity(user.id),
            })),
          }),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        let body = null;

        try {
          body = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          body = null;
        }

        throw new Error(
          body?.message || responseText || "Package notification email failed.",
        );
      }

      if (onPackagesCheckedIn) {
        await onPackagesCheckedIn();
      }

      navigate("/partner");
    } catch (submitError) {
      console.error("Error checking in packages:", submitError);
      setError(submitError.message);
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const locationLabel =
    partnerProfile.businessName ||
    partnerProfile.streetAddress ||
    "Your location";

  return (
    <div className="pkg-checkin">
      <div className="pkg-checkin__inner">
        <header className="pkg-checkin__hero">
          <div className="pkg-checkin__hero-top">
            <div>
              <div className="pkg-checkin__eyebrow">Partner</div>
              <h2 className="pkg-checkin__title">Package check-in</h2>
              <p className="pkg-checkin__lead">
                Select customers, set how many packages arrived, then confirm.
                Customers get an email when you check in.
              </p>
              <p className="pkg-checkin__lead" style={{ marginTop: 8, fontSize: 13, color: "#b0b0b0" }}>
                Checking in at: <strong style={{ color: "#e8d9a8" }}>{locationLabel}</strong>
              </p>
            </div>
            <Link className="pkg-checkin__back" to="/partner">
              ← Back to portal
            </Link>
          </div>
        </header>

        <div className="pkg-checkin__legend-wrap">
          <PartnerStatusLegend />
        </div>

        <div className="pkg-checkin__toolbar">
          <input
            type="search"
            className="pkg-checkin__search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search customers"
          />
          <div className="pkg-checkin__badge">
            {totalSelectedPackages} package{totalSelectedPackages !== 1 ? "s" : ""} selected
          </div>
        </div>

        {error ? <p className="pkg-checkin__alert" role="alert">{error}</p> : null}

        {loading ? (
          <div className="pkg-checkin__list-card">
            <div className="pkg-checkin__loading">Loading customers…</div>
          </div>
        ) : (
          <div className="pkg-checkin__list-card">
            <div className="pkg-checkin__list-head">
              <span>Customers ({filteredUsers.length})</span>
              <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                Qty · Include
              </span>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="pkg-checkin__empty">
                {users.length === 0
                  ? "No customer accounts found."
                  : "No customers match your search."}
              </div>
            ) : (
              <ul className="pkg-checkin__list">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    className={`pkg-checkin__row ${rowStatusClass(user)}`}
                  >
                    <div className="pkg-checkin__row-main">
                      <div>
                        <span className="pkg-checkin__name">
                          {user.name || "Unnamed user"}
                        </span>
                        <button
                          type="button"
                          className="pkg-checkin__info-btn"
                          onClick={() => toggleExpanded(user.id)}
                        >
                          {expandedUserIds.includes(user.id)
                            ? "Hide details"
                            : "Details"}
                        </button>
                      </div>
                      {expandedUserIds.includes(user.id) && (
                        <div className="pkg-checkin__meta">
                          <div className="pkg-checkin__meta-row">
                            Email: {user.email || "—"}
                          </div>
                          <div className="pkg-checkin__meta-row">
                            Phone: {user.phoneNumber || "—"}
                          </div>
                          <div className="pkg-checkin__meta-row">
                            Address:{" "}
                            {user.streetAddress || "—"}
                            {user.city ? `, ${user.city}` : ""}
                            {user.state ? `, ${user.state}` : ""}
                            {user.zipCode ? ` ${user.zipCode}` : ""}
                          </div>
                          <div className="pkg-checkin__meta-row">
                            At your location — waiting: {user.packageCount} ·
                            received (lifetime): {user.totalReceived} · picked
                            up: {user.totalPickedUp}
                          </div>
                          <div className="pkg-checkin__meta-row">
                            Subscription status: {user.status || "unknown"}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pkg-checkin__controls">
                      <input
                        type="number"
                        className="pkg-checkin__qty"
                        min="1"
                        step="1"
                        value={packageQuantities[user.id] ?? "1"}
                        onChange={(event) =>
                          updatePackageQuantity(user.id, event.target.value)
                        }
                        onBlur={() => finalizePackageQuantity(user.id)}
                        aria-label={`Package count for ${user.name || "customer"}`}
                      />
                      <div className="pkg-checkin__select-wrap">
                        <input
                          type="checkbox"
                          className="pkg-checkin__checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleSelection(user.id)}
                          aria-label={`Include ${user.name || "customer"} in check-in`}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="pkg-checkin__actions">
          <button
            type="button"
            className="pkg-checkin__btn-primary"
            onClick={() => setShowConfirm(true)}
            disabled={totalSelectedPackages === 0 || submitting}
          >
            Check in packages
          </button>
          <button
            type="button"
            className="pkg-checkin__btn-secondary"
            onClick={() => navigate("/partner")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>

      {showConfirm && (() => {
        const inactiveSelected = selectedUsers.filter(
          (u) => u.status !== "active" && u.status !== "trial",
        );
        return (
          <div
            className="pkg-checkin-modal__backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pkg-checkin-confirm-title"
          >
            <div className="pkg-checkin-modal__panel">
              <h2 id="pkg-checkin-confirm-title" className="pkg-checkin-modal__title">
                Confirm check-in
              </h2>
              <p className="pkg-checkin-modal__text">
                You are about to check in{" "}
                <strong>
                  {totalSelectedPackages} package
                  {totalSelectedPackages !== 1 ? "s" : ""}
                </strong>{" "}
                for{" "}
                <strong>
                  {selectedUsers.length} customer
                  {selectedUsers.length !== 1 ? "s" : ""}
                </strong>
                . Notification emails will be sent when applicable.
              </p>

              {inactiveSelected.length > 0 && (
                <div className="pkg-checkin-modal__warn">
                  <div className="pkg-checkin-modal__warn-title">
                    Payment may be required
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "#7a0000" }}>
                    The following customer
                    {inactiveSelected.length !== 1 ? "s are" : " is"}{" "}
                    <strong>inactive</strong> (trial used or subscription
                    lapsed):
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {inactiveSelected.map((u) => (
                      <li
                        key={u.id}
                        style={{ fontSize: 13, color: "#7a0000", fontWeight: 600 }}
                      >
                        {u.name || u.email || "Unknown user"}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#a00" }}>
                    You may still accept their package; remind them they need an
                    active plan to continue.
                  </p>
                </div>
              )}

              <div className="pkg-checkin-modal__actions">
                <button
                  type="button"
                  className="pkg-checkin-modal__btn-cancel"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                >
                  Go back
                </button>
                <button
                  type="button"
                  className="pkg-checkin-modal__btn-confirm"
                  onClick={handleCheckIn}
                  disabled={submitting}
                >
                  {submitting ? "Checking in…" : "Confirm check-in"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PackageCheckIn;
