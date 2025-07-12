import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Dashboard1 from "./Dashboard1";

export default function SkillSync1() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <Dashboard1 /> : <Navigate to="/login" replace />;
}
