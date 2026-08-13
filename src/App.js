import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import MainPage from "./components/MainPage";
import Login from "./components/Login";
import Register from "./components/Register";
import Contact from "./components/Contact";
import ForgotPassword from "./components/ForgotPassword";
import UserTermsPage from "./components/UserTermsPage";
import PartnerTermsPage from "./components/PartnerTermsPage";
import TermsIndex from "./components/TermsIndex";
import About from "./components/About";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import { auth, db } from "./firebase";
import "./App.css";

const Customers = lazy(() => import("./components/CustomerList"));
const OneTimeProduct = lazy(() => import("./components/OneTimeProduct"));
const Partners = lazy(() => import("./components/Partners"));
const Profile = lazy(() => import("./components/Profile"));
const EditProfile = lazy(() => import("./components/EditProfile"));
const UserSettings = lazy(() => import("./components/UserSettings"));
const PartnerProfile = lazy(() => import("./components/PartnerProfile"));
const PartnerRegister = lazy(() => import("./components/PartnerRegister"));
const PartnerEditProfile = lazy(() =>
  import("./components/PartnerEditProfile"),
);
const PartnerRegistrationPending = lazy(() =>
  import("./components/PartnerRegistrationPending"),
);
const PackageCheckIn = lazy(() => import("./components/PackageCheckIn"));
const PartnerActivityLog = lazy(() =>
  import("./components/PartnerActivityLog"),
);
const Admin = lazy(() => import("./components/Admin"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminPartnerView = lazy(() => import("./components/AdminPartnerView"));
const AdminActivityLog = lazy(() => import("./components/AdminActivityLog"));
const AdminPayoutsPage = lazy(() => import("./components/AdminPayoutsPage"));
const CheckoutSuccess = lazy(() => import("./components/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./components/CheckoutCancel"));
const ReferralForm = lazy(() => import("./components/ReferralForm"));
const PlansPage = lazy(() => import("./components/PlansPage"));
const PackageHistoryPage = lazy(() =>
  import("./components/PackageHistoryPage"),
);
const PartnerOnboarding = lazy(() => import("./components/PartnerOnboarding"));
const PartnerInfoPage = lazy(() => import("./components/PartnerInfoPage"));
const PartnerPage = lazy(() => import("./components/PartnerPage"));


const Header = ({ authLoading, isAdmin, user, userStatus, partnerProfile }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  const hideAuthLinks = [
    "/login",
    "/partner/login",
    "/vendor/login",
    "/admin/login",
  ].includes(location.pathname);
  const onCustomerProfilePage = location.pathname === "/profile";
  const primaryLink = onCustomerProfilePage
    ? { to: "/", label: "Home" }
    : {
        to: user ? (partnerProfile ? "/partner" : "/profile") : "/login",
        label: user
          ? partnerProfile
            ? isMobile
              ? "Partner"
              : "Partner Portal"
            : "Profile"
          : "Login",
      };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-logo-wrap">
          <a href="https://porchpobox.com/" className="header-logo-link">
            <img
              src="/logo.webp"
              alt="Porch P.O. Box"
              width="300"
              height="300"
              decoding="async"
              className="header-logo"
            />
            <span className="header-logo-name">Porch P.O. Box</span>
          </a>
        </div>
        {!authLoading && !hideAuthLinks && (
          <nav className="header-nav">
            <Link to="/how-it-works" className="header-link">
              How it Works
            </Link>
            <Link to="/about" className="header-link">
              About
            </Link>
            <Link to="/plans" className="header-link">
              Pricing
            </Link>
            <Link to="/become-a-partner" className="header-link">
              Partners
            </Link>
            {isAdmin && (
              <Link to="/admin" className="header-link">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to={primaryLink.to} className="header-link">
                  {primaryLink.label}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="header-logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-link">
                  Login
                </Link>
                <Link to="/register" className="header-signup-btn">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

// import AdminCreateUser from "./components/AdminCreateUser";
function App() {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
          : null,
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
        setIsAdmin(false);
        setPartnerProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        setUserStatus(userData.status || "");
        setIsAdmin(userData.isAdmin === true);
        await loadPartnerProfile(currentUser);
        // Never auto-show the pref location modal — it gets set automatically on first check-in
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <BrowserRouter>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header
          authLoading={authLoading}
          isAdmin={isAdmin}
          user={user}
          userStatus={userStatus}
          partnerProfile={partnerProfile}
        />

        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "40vh",
                color: "#667085",
                fontSize: 14,
              }}
            >
              Loading…
            </div>
          }
        >
        <Routes>
          <Route path="/vendor" element={<Navigate to="/partner" replace />} />
          <Route
            path="/vendor/login"
            element={<Navigate to="/partner/login" replace />}
          />
          <Route
            path="/vendor/register"
            element={<Navigate to="/partner/register" replace />}
          />
          <Route
            path="/vendor/pending"
            element={<Navigate to="/partner/pending" replace />}
          />
          <Route
            path="/vendor/profile"
            element={<Navigate to="/partner/profile" replace />}
          />
          <Route
            path="/vendor/profile/edit"
            element={<Navigate to="/partner/profile/edit" replace />}
          />
          <Route
            path="/vendor/package-check-in"
            element={<Navigate to="/partner/package-check-in" replace />}
          />
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
          <Route
            path="/partner/pending"
            element={<PartnerRegistrationPending />}
          />
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
                <PartnerEditProfile
                  user={user}
                  partnerProfile={partnerProfile}
                />
              ) : (
                <Navigate to="/partner/login" replace />
              )
            }
          />
          <Route
            path="/partner/activity-log"
            element={
              user && partnerProfile && partnerProfile.approved ? (
                <PartnerActivityLog partnerProfile={partnerProfile} />
              ) : (
                <Navigate to="/partner" replace />
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
          <Route path="/partner/:partnerId" element={<PartnerInfoPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              user ? <Profile user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/profile/settings"
            element={
              user ? (
                <UserSettings user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile/edit"
            element={
              user ? (
                <EditProfile user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile/packages"
            element={
              user ? (
                <PackageHistoryPage user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* <Route path="/admin/create-user" element={<AdminCreateUser />} /> */}
          <Route
            path="/customers"
            element={
              user &&
              ((partnerProfile && partnerProfile.approved) || isAdmin) ? (
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
                <div className="admin-loading-container">
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
                <div className="admin-loading-container">
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
          <Route
            path="/admin/activity-log"
            element={
              isAdmin ? (
                <AdminActivityLog />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/partner/:partnerId"
            element={
              isAdmin ? (
                <AdminPartnerView />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/payouts"
            element={
              isAdmin ? (
                <AdminPayoutsPage />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/quickcheckout"
            element={<OneTimeProduct user={user} />}
          />
          <Route
            path="/checkout/success"
            element={<CheckoutSuccess user={user} authLoading={authLoading} />}
          />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/onboarding" element={<PartnerOnboarding />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-a-partner" element={<PartnerPage />} />
          <Route path="/terms" element={<TermsIndex />} />
          <Route path="/terms/user" element={<UserTermsPage />} />
          <Route path="/terms/partner" element={<PartnerTermsPage />} />

          <Route
            path="/"
            element={<MainPage user={user} userStatus={userStatus} partnerProfile={partnerProfile} />}
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/referrals" element={<ReferralForm />} />
          <Route path="/plans" element={<PlansPage user={user} />} />

          {/* <Route path="/one-time-product" element={<OneTimeProduct />} /> */}
        </Routes>
        </Suspense>
        <Footer />
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
