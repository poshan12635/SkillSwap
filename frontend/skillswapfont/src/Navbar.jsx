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
                    <a href="/About">About</a>
                    <a href="/SkillSync1">SkillSync</a>
                    <a href="/events">Events</a>
                    <a href="/Login">Login</a>
                    <a href="/Register">Register</a>
                </li>
            </ul>
        </nav>
    )
}