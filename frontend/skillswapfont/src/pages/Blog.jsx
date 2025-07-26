import React from "react";
import { Link } from "react-router-dom";

export default function Blog({ userid, name, title, description, skill, yourself, youdo, expectfrom, whyjoin }) {
    const shorten = (text, max = 200) =>
        text?.length > max ? text.slice(0, max) + "..." : text;

    return (
        <div className="card h-100 shadow border rounded-4" style={{ backgroundColor: "#f9f9fc" }}>
            <div className="card-body d-flex flex-column p-4">
                <h5 className="card-title mb-3 text-center fw-bold text-uppercase" style={{ fontSize: "1.4rem", color: "#212529" }}>
                    {title}
                </h5>

                <p className="text-muted text-center mb-2" style={{ fontSize: "0.9rem" }}>
                    by <span className="fw-semibold">{name}</span>
                </p>

                <div className="flex-grow-1 mb-3 rounded-3" style={{
                    backgroundColor: "#e9ecef",
                    padding: "1rem",
                    fontSize: "0.9rem",
                    color: "#444",
                    borderRadius: "0.5rem"
                }}>
                    <p><strong>About me:</strong> {shorten(yourself)}</p>
                    <p><strong>Project description:</strong>{shorten(description)}</p>
                </div>

                <Link to="/de" className="btn btn-outline-dark btn-sm mt-auto fw-semibold rounded-pill"
                    style={{
                        height: "45px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "0.9rem"
                    }}
                    state={{ userid, name, title, description, skill, yourself, youdo, expectfrom, whyjoin }}>
                    View Details
                </Link>
            </div>
        </div>
    );
}
