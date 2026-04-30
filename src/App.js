import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import MainPage from "./components/MainPage";
import Customers from "./components/CustomerList";
import OneTimeProduct from "./components/OneTimeProduct";
import Login from "./components/Login";
import Register from "./components/Register";
import Partners from "./components/Partners";
import Contact from "./components/Contact";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import PartnerProfile from "./components/PartnerProfile";
import PartnerRegister from "./components/PartnerRegister";
import PartnerEditProfile from "./components/PartnerEditProfile";
import PartnerRegistrationPending from "./components/PartnerRegistrationPending";
import PackageCheckIn from "./components/PackageCheckIn";
import Admin from "./components/Admin";
import AdminLogin from "./components/AdminLogin";
import ForgotPassword from "./components/ForgotPassword";
import CheckoutSuccess from "./components/CheckoutSuccess";
import CheckoutCancel from "./components/CheckoutCancel";
import UserTermsPage from "./components/UserTermsPage";
import PartnerTermsPage from "./components/PartnerTermsPage";
import { auth, db } from "./firebase";
import "./App.css";

const ADMIN_UID = "6wVTCBAw4EVHHIFWnFLL57z8qHx2";

const Header = ({ authLoading, isAdmin, user, userStatus, partnerProfile }) => {
  const location = useLocation();
  const hideAuthLinks = [
    "/login",
    "/partner/login",
    "/vendor/login",
    "/admin/login"
  ].includes(location.pathname);
  const onCustomerProfilePage = location.pathname === "/profile";
  const primaryLink = onCustomerProfilePage
    ? { to: "/", label: "Home" }
    : {
      to: user ? (partnerProfile ? "/partner" : "/profile") : "/login",
      label: user ? (partnerProfile ? "Partner Portal" : "Profile") : "Login"
    };

  return (
    <header style={{ position: "relative" }}>
      <center>
        <Link to="/" style={{ color: "gold" }}>
          <h1 className="header">
            <span style={{ position: "absolute", left: "-9999px" }}>
              Porch P.O. Box
            </span>
          </h1>
        </Link>
      </center>
      {!authLoading && !hideAuthLinks && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            display: "flex",
            gap: 12
          }}
        >
          <Link to={primaryLink.to}>{primaryLink.label}</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
          {!user && <Link to="/register">Register</Link>}
        </div>
      )}
    </header>
  );
};

// import AdminCreateUser from "./components/AdminCreateUser";
function App() {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState("");
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdmin = user?.uid === ADMIN_UID;

  const loadPartnerProfile = async (currentUser) => {
    if (!currentUser) {
      setPartnerProfile(null);
      return;
    }

    try {
      const partnerDoc = await getDoc(doc(db, "partners", currentUser.uid));
      setPartnerProfile(
        partnerDoc.exists()
          ? { id: partnerDoc.id, uid: currentUser.uid, ...partnerDoc.data() }
          : null
      );
    } catch (error) {
      console.error("Error loading partner profile:", error);
      setPartnerProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserStatus("");
        setPartnerProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        setUserStatus(userDoc.exists() ? userDoc.data().status || "" : "");
        await loadPartnerProfile(currentUser);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <BrowserRouter>
        <Header
          authLoading={authLoading}
          isAdmin={isAdmin}
          user={user}
          userStatus={userStatus}
          partnerProfile={partnerProfile}
        />
        <hr />


        <Routes>
          <Route path="/vendor" element={<Navigate to="/partner" replace />} />
          <Route path="/vendor/login" element={<Navigate to="/partner/login" replace />} />
          <Route path="/vendor/register" element={<Navigate to="/partner/register" replace />} />
          <Route path="/vendor/pending" element={<Navigate to="/partner/pending" replace />} />
          <Route path="/vendor/profile" element={<Navigate to="/partner/profile" replace />} />
          <Route path="/vendor/profile/edit" element={<Navigate to="/partner/profile/edit" replace />} />
          <Route path="/vendor/package-check-in" element={<Navigate to="/partner/package-check-in" replace />} />
          <Route
            path="/partner"
            element={
              <Partners
                user={user}
                partnerProfile={partnerProfile}
                authLoading={authLoading}
              />
            }
          />
          <Route
            path="/partner/login"
            element={<Login title="Partner Login" redirectTo="/partner" />}
          />
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/partner/pending" element={<PartnerRegistrationPending />} />
          <Route
            path="/partner/profile"
            element={
              user && partnerProfile ? (
                <PartnerProfile user={user} partnerProfile={partnerProfile} />
              ) : (
                <Navigate to="/partner/login" replace />
              )
            }
          />
          <Route
            path="/partner/profile/edit"
            element={
              user && partnerProfile ? (
                <PartnerEditProfile user={user} partnerProfile={partnerProfile} />
              ) : (
                <Navigate to="/partner/login" replace />
              )
            }
          />
          <Route
            path="/partner/package-check-in"
            element={
              user && partnerProfile && partnerProfile.approved ? (
                <PackageCheckIn
                  user={user}
                  partnerProfile={partnerProfile}
                  onPackagesCheckedIn={() => loadPartnerProfile(user)}
                />
              ) : (
                <Navigate to="/partner" replace />
              )
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile/edit"
            element={user ? <EditProfile user={user} /> : <Navigate to="/login" replace />}
          />
          {/* <Route path="/admin/create-user" element={<AdminCreateUser />} /> */}
          <Route
            path="/customers"
            element={
              user && ((partnerProfile && partnerProfile.approved) || isAdmin) ? (
                <Customers />
              ) : (
                <Navigate to="/partner" replace />
              )
            }
          />
          <Route
            path="/admin/login"
            element={
              authLoading ? (
                <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
                  <h2>Admin Login</h2>
                  <p>Checking session...</p>
                </div>
              ) : isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminLogin />
              )
            }
          />
          <Route
            path="/admin"
            element={
              authLoading ? (
                <div style={{ maxWidth: 960, margin: "80px auto", padding: "0 20px" }}>
                  <h2>Admin</h2>
                  <p>Checking admin access...</p>
                </div>
              ) : isAdmin ? (
                <Admin />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route path="/quickcheckout" element={<OneTimeProduct user={user} />} />
          <Route
            path="/checkout/success"
            element={<CheckoutSuccess user={user} authLoading={authLoading} />}
          />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/terms/user" element={<UserTermsPage />} />
          <Route path="/terms/partner" element={<PartnerTermsPage />} />

          <Route path="/" element={<MainPage user={user} userStatus={userStatus} />} />
          <Route path="/contact" element={<Contact />} />

          {/* <Route path="/one-time-product" element={<OneTimeProduct />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
