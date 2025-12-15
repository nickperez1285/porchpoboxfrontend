import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MainPage from './components/MainPage';
import Customers from './components/CustomerList';
import OneTimeProduct from './components/OneTimeProduct';
import Login from "./components/Login";
import Register from "./components/Register";
import Contact from "./components/Contact";


// import AdminCreateUser from "./components/AdminCreateUser";
function App() {
  return (
    <>
    


        <BrowserRouter>
           <center>
    <Link to = "/"  style={{color:"gold"}}>
    <h1> <b><u>Porch P.O. Box</u> </b></h1>
    
    </Link>
    <hr/>
    </center> 
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/admin/create-user" element={<AdminCreateUser />} /> */}
        <Route path="/customers" element={<Customers />} />
      <Route path="/quickcheckout" element={<OneTimeProduct />} />

        <Route path="/" element={<MainPage />} />
                <Route path="/contact" element={<Contact />} />

        {/* <Route path="/one-time-product" element={<OneTimeProduct />} /> */}
      </Routes>
      
    </BrowserRouter>
</>
  );
}

export default App;
