import React, { useState } from "react";
import skill from "/src/assets/skill.png";
import useri from "/src/assets/useri.png";
import './Navbar1.css';

import Submenu from "./Submenu";

export default function Navbar1() {
    const [isClick, setClick] = useState(false);

    const handleToggle = () => {
        setClick((prev) => !prev);
    };

    return (
        <nav className="navbar">
            {/* Logo Section */}
            <div className="logo">
                <img src={skill} className="logoimage" alt="Logo" />
            </div>

            {/* Navigation Links */}
            <ul className="navbarlink">
                <li className="user-icon-container">
                    <img
                        src={useri}
                        className="profile-button"
                        alt="User"
                        onClick={handleToggle}
                    />

                    {isClick && (
                        <div className="submenu-wrapper">
                            <Submenu />
                        </div>
                    )}
                </li>
            </ul>
        </nav>
    );
}
