import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";

export default function Login() {
    const [logindata, setloginData] = useState({ username: "", password: "" });
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://127.0.0.1:8000/login", logindata, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const data = await res.data;
            if (res.status == 200) {
                localStorage.setItem("token", data.access_token)
                navigate("/SkillSync1")
            }

        } catch (err) {
            setMessage(err.message)
        }

    };

    const handlechange = (e) => {
        setloginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handlesubmit}>
                <h2 className="login-title">Welcome </h2>
                <input
                    type="text"
                    name="username"
                    placeholder=" Username"
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
                    <a href="./Register">Sign Up</a>
                </div>
            </form>
        </div>
    );
}
