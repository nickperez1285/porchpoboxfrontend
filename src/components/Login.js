import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";


const Login = ({ title = "Login", redirectTo = "/" }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Logged in:", user.email);
            } else {
                console.log("Logged out");
            }
        });

        return () => unsubscribe();
    }, []);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(redirectTo);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
            <h2>{title}</h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p>{error}</p>}

                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
