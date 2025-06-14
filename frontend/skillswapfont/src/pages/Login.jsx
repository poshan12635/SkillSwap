import React, { useState } from "react";
import "./Login.css";

export default function Login() {
    const [logindata, setloginData] = useState({ username: "", password: "" });

    const handlesubmit = async (e) => {
        e.preventDefault();
        alert(`Logging in as ${logindata.username}`);
    };

    const handlechange = (e) => {
        setloginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handlesubmit}>
                <h2 className="login-title">Welcome back</h2>
                <input
                    type="text"
                    name="username"
                    placeholder="Email or Username"
                    value={logindata.username}
                    onChange={handlechange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={logindata.password}
                    onChange={handlechange}
                />
                <button type="submit">Log In</button>
                <div className="login-footer">
                    <a href="#">Forgot Password?</a>
                    <span>•</span>
                    <a href="#">Sign Up</a>
                </div>
            </form>
        </div>
    );
}
