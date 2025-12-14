import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { clientEncryption } from "../../../Strip-Subcription-Integration-MERN-backend/backend/models/User";


export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const navigate = useNavigate();


const handleLogin = async (e) => {
e.preventDefault();


const res = await 
axios.post("/api/auth/login", {
email,
password,
});

// const res = await axios.post("/api/auth/login", {
// email,
// password,
// });


localStorage.setItem("token", res.data.token);


navigate("/customers");
};


return (
    <center>
<form onSubmit={handleLogin}>
<input placeholder="Email" onChange={e => setEmail(e.target.value)} /><br/>
<input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br/>
<button>Login</button>
</form>
</center>
);
}