import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


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
            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            const vendorDoc = await getDoc(doc(db, "vendors", credential.user.uid));
            if (vendorDoc.exists()) {
                navigate("/vendor");
                return;
            }
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

            <p style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
                <Link to="/forgot-password">Forgot Password?</Link>
                <Link to="/register">Create Account</Link>
            </p>
        </div>
    );
};

export default Login;
