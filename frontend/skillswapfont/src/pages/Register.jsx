import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css"

export default function Register() {
    const [registrData, setRegisterData] = useState({
        username: "",
        password: "",
        email: "",
    });
    const navigate = useNavigate();

    const handleRchange = (e) => {
        setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRsubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/register",
                registrData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.status === 200) {
                navigate("/login");
            }
        } catch (err) {
            alert("Registration error");
        }
    };

    return (
        <div className="regi-container">
            <form className="regi-form" onSubmit={handleRsubmit}>
                <h2 className="regi-title">Register</h2>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={registrData.email}
                    onChange={handleRchange}
                    required
                />
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={registrData.username}
                    onChange={handleRchange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={registrData.password}
                    onChange={handleRchange}
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}
