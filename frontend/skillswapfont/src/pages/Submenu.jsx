import React from "react";
import './Submenu.css'

export default function Submenu() {
    return (
        <>
            <div className="dropdown">
                <ui>
                    <li><a href="/profile">profile</a></li>
                    <li><a href="/message">message</a></li>
                    <li><a href="/post">post</a></li>
                    <li><a href="/about">signout</a></li>
                </ui>
            </div>
        </>
    )
}