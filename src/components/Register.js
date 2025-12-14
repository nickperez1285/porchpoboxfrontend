import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function Register() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const navigate = useNavigate();


const handleRegister = async (e) => {
e.preventDefault();


// await axios.post("/api/auth/register", {
// email,
// password
// });


await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
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