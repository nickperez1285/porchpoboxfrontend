import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";


export default function Register() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const navigate = useNavigate();


const handleRegister = async (e) => {
e.preventDefault();


await axios.post(`${API_BASE_URL}/api/auth/register`, {
email,
password
});


navigate("/");
};


return (
<form onSubmit={handleRegister}>
<h2>Create Account</h2>
<input
placeholder="Email"
required
onChange={(e) => setEmail(e.target.value)}
/>
<input
type="password"
placeholder="Password"
required
onChange={(e) => setPassword(e.target.value)}
/>
<button>Create Account</button>
</form>
);
}