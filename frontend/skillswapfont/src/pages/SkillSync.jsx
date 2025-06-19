import React from "react";
import './SkillSync.css'
import { useNavigate } from "react-router-dom";

function SkillSync() {
    const navigate = useNavigate();
    return (
        <div className="homepage">


            <section className="hero">
                <h1>Swap Skills. Grow Together.</h1>
                <p>Connect with people who have the skills you want. Teach what you know. Learn what you love.</p>
                <div className="cta-buttons">
                    <button className="btn-primary" onClick={() => navigate("/register")}>Get Started</button>
                    <button className="btn-secondary" onClick={() => navigate("./login")}>Browse Skills</button>
                </div>
            </section>


            <section className="how-it-works">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <span>👤</span>
                        <h3>Create Profile</h3>
                        <p>List your skills & what you want to learn</p>
                    </div>
                    <div className="step">
                        <span>🔍</span>
                        <h3>Find Match</h3>
                        <p>Search or get matched with ideal partners</p>
                    </div>
                    <div className="step">
                        <span>🔁</span>
                        <h3>Swap & Learn</h3>
                        <p>Chat, meet, and exchange your skills</p>
                    </div>
                </div>
            </section>


            <section className="testimonials">
                <h2>What Our Users Say</h2>
                <blockquote>
                    "I taught design and learned JavaScript in return. Amazing experience!" <br />
                    — <strong>Aayush</strong>
                </blockquote>
            </section>


            <section className="why-skillswap">
                <h2>Why SkillSwap?</h2>
                <ul>
                    <li>🔒 Safe & verified connections</li>
                    <li>🌱 Personal growth without money</li>
                    <li>🧠 Learn by doing, not just watching</li>
                    <li>🤝 Community-powered learning</li>
                </ul>
            </section>


            <section className="join-us">
                <h2>Ready to grow your skills?</h2>
                <p>It’s free and easy to get started.</p>
                <button className="btn-primary" onClick={() => navigate("/register")}>
                    Sign Up Now
                </button>
            </section>



            <footer className="footer">
                <div>
                    <a href="./About">About</a>
                </div>
                <div>📱 Follow us on Instagram, LinkedIn, Twitter</div>
            </footer>

        </div>
    );
}

export default SkillSync;