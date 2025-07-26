import React, { useState } from "react";
import "./Post.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Post() {
    const navigate = useNavigate();
    const [postdata, setdata] = useState({
        title: "",
        yourself: "",
        detail: "",
        whyjoin: "",
        expectfrom: "",
        youdo: "",
        skill: ""
    });
    const [message, setMessage] = useState("");

    const handlechange = (event) => {
        const { name, value } = event.target;
        setdata(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://127.0.0.1:8000/blogpost",
                postdata,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (res.status === 200) {
                setMessage("your post has been posted");
                navigate('/SkillSync1');
            }
        } catch (err) {
            setMessage("Error: " + err.response?.data?.detail || err.message);
        }
    };

    return (
        <form className="project-container" onSubmit={handlesubmit}>
            <h2>Create a Project Post</h2>
            <label htmlFor="title">Project Title</label>
            <input
                type="text"
                name="title"
                id="title"
                value={postdata.title}
                onChange={handlechange}
                placeholder="Enter project title"
            />
            <label htmlFor="about yourself">About yourself</label>
            <textarea
                name="yourself"
                id="yourself"
                value={postdata.yourself}
                onChange={handlechange}
                placeholder="Describe about yourself"
            />
            <label htmlFor="projectdetail">Project Details</label>
            <textarea
                name="detail"
                id="detail"
                value={postdata.detail}
                onChange={handlechange}
                placeholder="Describe your project"
            />
            <label htmlFor="whyjoin">Why join you</label>
            <textarea
                name="whyjoin"
                id="whyjoin"
                value={postdata.whyjoin}
                onChange={handlechange}
                placeholder="Describe why user will join"
            />
            <label htmlFor="expectfrom">what to expect from you</label>
            <textarea
                name="expectfrom"
                id="expectfrom"
                value={postdata.expectfrom}
                onChange={handlechange}
                placeholder="Describe what user will expect"
            />
            <label htmlFor="youdo">what you expect to do</label>
            <textarea
                name="youdo"
                id="youdo"
                value={postdata.youdo}
                onChange={handlechange}
                placeholder="Describe what user will do"
            />
            <label htmlFor="requiredtool">Required Tools/Technologies</label>
            <input
                type="text"
                name="skill"
                id="skill"
                value={postdata.skill}
                onChange={handlechange}
                placeholder="e.g., React, Node.js"
            />
            <button type="submit">Post</button>
            {message && <p>{message}</p>}
        </form>
    );
}
