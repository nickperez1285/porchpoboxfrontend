import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SubscriptionPlans from './components/SubscriptionPlans';
import Customers from './components/CustomerList';
import OneTimeProduct from './components/OneTimeProduct';
import Login from "./components/Login";
import Register from "./components/Register";
// import AdminCreateUser from "./components/AdminCreateUser";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/admin/create-user" element={<AdminCreateUser />} /> */}
        <Route path="/customers" element={<Customers />} />
      <Route path="/quickcheckout" element={<OneTimeProduct />} />

        <Route path="/" element={<SubscriptionPlans />} />
        {/* <Route path="/one-time-product" element={<OneTimeProduct />} /> */}
      </Routes>
    </BrowserRouter>

  );
}

export default App;
