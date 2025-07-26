import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Details() {
    const location = useLocation();
    const data = location.state;

    return (
        <div className="container my-5" style={{ maxWidth: '850px' }}>
            <div className="card shadow border-0 rounded-4">
                <div className="card-body p-5">

                    <h1 className="fw-bold text-dark mb-3" style={{ fontSize: '34px' }}>
                        {data.title}
                    </h1>

                    <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap">
                        <p className="text-muted mb-0" style={{ fontSize: '16px' }}>
                            <strong>Posted by:</strong> {data.name}
                        </p>

                        <Link
                            to="/message"
                            state={{ userid: data.userid, name: data.name }}
                            className="btn btn-outline-primary rounded-pill fw-medium px-4 py-2"
                            style={{
                                fontSize: '15px',
                                borderColor: '#0a66c2',
                                color: '#0a66c2',
                                backgroundColor: 'transparent',
                                transition: 'all 0.2s ease-in-out'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#e8f3ff';
                                e.target.style.borderColor = '#004182';
                                e.target.style.color = '#004182';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#0a66c2';
                                e.target.style.color = '#0a66c2';
                            }}
                        >
                            Contact This User
                        </Link>
                    </div>

                    <div className="mb-5">
                        <span className="badge bg-light text-dark border px-3 py-2 fs-6">
                            Skill Required: {data.skill}
                        </span>
                    </div>

                    <hr className="mb-5" />

                    <Section title="About Me" content={data.yourself} />
                    <Section title="Project Description" content={data.description} />
                    <Section title="Your Role" content={data.youdo} />
                    <Section title="Why Join This Project" content={data.whyjoin} />
                    <Section title="What You’ll Gain" content={data.expectfrom} />
                </div>
            </div>
        </div>
    );
}

function Section({ title, content }) {
    return (
        <section className="mb-5">
            <h3 className="fw-semibold text-dark mb-3" style={{
                fontSize: '22px',
                borderBottom: '2px solid #e0e0e0',
                paddingBottom: '8px'
            }}>
                {title}
            </h3>
            <p className="text-secondary fs-6" style={{ lineHeight: '1.8', fontSize: '15.5px' }}>
                {content}
            </p>
        </section>
    );
}
