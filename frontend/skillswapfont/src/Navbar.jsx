import React from "react";
import logo from "/src/assets/logo.png";


import './Navbar.css';

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="logo-cont">
                <img src={logo} alt="Logo" className="logo1" />



                <div className="navbar-logo">SkillSwap</div>
            </div>

            <ul className="navbar-links">
                <li>
                    <a href="./about.html">About</a>
                    <a href="./SkillSync.html">SkillSync</a>
                    <a href="./events.html">Events</a>
                    <a href="./login.html">Login</a>
                    <a href="./Register.html">Register</a>
                </li>
            </ul>
        </nav>
    )
}