import React, { useState, useEffect } from "react";
import Dashboard1 from "./Dashboard1";
import Login from "./Login";

export default function SkillSync1() {
    const [isAuthenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setAuthenticated(!!token); // convert to boolean
    }, []);

    return (
        <>
            {isAuthenticated ? <Dashboard1 /> : <Login />}
        </>
    );
}