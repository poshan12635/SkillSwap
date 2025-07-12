import React from "react";
import './About.css';
import poshan from "/src/assets/poshan.jpg";
import sandesh from "/src/assets/sandesh.jpg";
import laxman from "/src/assets/laxman.PNG";

export default function About() {
    return (
        <div className="about">
            <h1>About Us</h1>
            <div className="imagetag">
                <div className="person">
                    <img src={poshan} alt="Poshan Karki" />
                    <p className="name">Poshan Karki</p>

                </div>
                <div className="person">
                    <img src={sandesh} alt="Sandesh Subedi" />
                    <p className="name">Sandesh Subedi</p>

                </div>
                <div className="person">
                    <img src={laxman} alt="Laxmi Dutt Awasthi" />
                    <p className="name">Laxmi Dutt Awasthi</p>

                </div>
            </div>
            <p className="about-web">
                SkillSwap is a dynamic peer-to-peer platform designed to empower students by enabling them to learn, earn, and connect. It serves as a collaborative space where students can explore a wide range of projects, contribute their skills, and actively seek out teammates for joint ventures or academic work.
                Beyond individual collaboration, SkillSwap also connects students with organizations that host events such as hackathons, workshops, and tech challenges—creating opportunities for real-world learning and networking.
                Whether you're looking to work on innovative projects, build your portfolio, find like-minded peers, or participate in skill-based events, SkillSwap is your go-to ecosystem for growth and collaboration.
            </p>
        </div>
    );
}
