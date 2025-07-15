import React from "react";
import skill from "/src/assets/skill.png";
import useri from "/src/assets/useri.png";
import './Navbar1.css'
import Submenu from "./Submenu";


export default function Navbar1() {
    return (
        <nav className='navbar' >
            <div classname='logo'>
                < img src={skill} className="logoimage" />

            </div>
            <ul className="navbarlink">
                <li>
                    <button onClick={<Submenu />}>
                        <img src={useri} className="profileimage" />
                    </button>





                </li>
            </ul>

        </nav >
    );
}