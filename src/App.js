import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import MainPage from "./components/MainPage";
import Customers from "./components/CustomerList";
import OneTimeProduct from "./components/OneTimeProduct";
import Login from "./components/Login";
import Register from "./components/Register";
import Vendors from "./components/Vendors";
import Contact from "./components/Contact";
import Profile from "./components/Profile";
import VendorProfile from "./components/VendorProfile";
import VendorRegister from "./components/VendorRegister";
import VendorEditProfile from "./components/VendorEditProfile";
import VendorRegistrationPending from "./components/VendorRegistrationPending";
import PackageCheckIn from "./components/PackageCheckIn";
import Admin from "./components/Admin";
import AdminLogin from "./components/AdminLogin";
import ForgotPassword from "./components/ForgotPassword";
import CheckoutSuccess from "./components/CheckoutSuccess";
import CheckoutCancel from "./components/CheckoutCancel";
import { auth, db } from "./firebase";
import "./App.css";

const ADMIN_UID = "6wVTCBAw4EVHHIFWnFLL57z8qHx2";

// import AdminCreateUser from "./components/AdminCreateUser";
function App() {
  const [user, setUser] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdmin = user?.uid === ADMIN_UID;

  const loadVendorProfile = async (currentUser) => {
    if (!currentUser) {
      setVendorProfile(null);
      return;
    }

    try {
      const vendorDoc = await getDoc(doc(db, "vendors", currentUser.uid));
      setVendorProfile(
        vendorDoc.exists()
          ? { id: vendorDoc.id, uid: currentUser.uid, ...vendorDoc.data() }
          : null
      );
    } catch (error) {
      console.error("Error loading vendor profile:", error);
      setVendorProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setVendorProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        await loadVendorProfile(currentUser);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <BrowserRouter>
        <header style={{ position: "relative" }}>
          <center >
            <Link to="/" style={{ color: "gold", }}>
              <h1 className="header">
                <span style={{ position: "absolute", left: "-9999px" }}>
                  Porch P.O. Box
                </span>
              </h1>
            </Link>
          </center>
          {!authLoading && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                display: "flex",
                gap: 12
              }}
            >
              <Link to={user ? (vendorProfile ? "/vendor/profile" : "/profile") : "/login"}>
                {user ? (vendorProfile ? "Vendor Profile" : "Profile") : "Login"}
              </Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              {!user && <Link to="/register">Register</Link>}
            </div>
          )}
        </header>
        <hr />


        <Routes>
          <Route
            path="/vendor"
            element={
              <Vendors
                user={user}
                vendorProfile={vendorProfile}
                authLoading={authLoading}
              />
            }
          />
          <Route
            path="/vendor/login"
            element={<Login title="Vendor Login" redirectTo="/vendor" />}
          />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/pending" element={<VendorRegistrationPending />} />
          <Route
            path="/vendor/profile"
            element={
              user && vendorProfile ? (
                <VendorProfile user={user} vendorProfile={vendorProfile} />
              ) : (
                <Navigate to="/vendor/login" replace />
              )
            }
          />
          <Route
            path="/vendor/profile/edit"
            element={
              user && vendorProfile ? (
                <VendorEditProfile user={user} vendorProfile={vendorProfile} />
              ) : (
                <Navigate to="/vendor/login" replace />
              )
            }
          />
          <Route
            path="/vendor/package-check-in"
            element={
              user && vendorProfile && vendorProfile.approved ? (
                <PackageCheckIn
                  user={user}
                  vendorProfile={vendorProfile}
                  onPackagesCheckedIn={() => loadVendorProfile(user)}
                />
              ) : (
                <Navigate to="/vendor" replace />
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
          {/* <Route path="/admin/create-user" element={<AdminCreateUser />} /> */}
          <Route
            path="/customers"
            element={
              user && ((vendorProfile && vendorProfile.approved) || isAdmin) ? (
                <Customers />
              ) : (
                <Navigate to="/vendor" replace />
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

          <Route path="/" element={<MainPage user={user} />} />
          <Route path="/contact" element={<Contact />} />

          {/* <Route path="/one-time-product" element={<OneTimeProduct />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
