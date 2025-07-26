import React, { useState, useEffect } from "react";
import axios from "axios";
import './Profile.css';


export default function Profile() {
    const [formdata, setformdata] = useState({
        name: "",
        education: "",
        university: "",
        skill: ""
    });
    const [userinfo, setuserinfo] = useState(null);
    const [loading, setloading] = useState(true);
    const [message, setmessage] = useState("")



    useEffect(() => {
        const token = localStorage.getItem("token")
        const res = axios.get("http://127.0.0.1:8000/userinfo", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`

            }

        })
            .then(res => {
                setuserinfo(res.data);
                setloading(false);
                console.log(token)

            })
            .catch(() => {
                setloading(false);
            });
    }, [])






    const allSkill = [
        // Frontend Development
        "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Tailwind CSS", "Bootstrap", "Redux", "SASS/SCSS",
        // Backend Development
        "Node.js", "Express.js", "FastAPI", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "PHP",
        // Database
        "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Firebase", "Redis",
        // DevOps & Tools
        "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Nginx", "AWS", "Azure", "Google Cloud Platform",
        // Mobile Development
        "React Native", "Flutter", "Swift", "Kotlin",
        // UI/UX & Graphic Design
        "Figma", "Adobe XD", "Adobe Photoshop", "Adobe Illustrator", "Sketch", "Canva",
        // Video Editing
        "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "CapCut", "Sony Vegas",
        // Data Analysis & Data Science
        "Python", "R", "Pandas", "NumPy", "Matplotlib", "Seaborn", "SQL", "Excel", "Tableau", "Power BI", "Jupyter Notebook",
        // Machine Learning & AI
        "Scikit-learn", "TensorFlow", "Keras", "PyTorch", "OpenCV", "NLP", "langchain",
        // Cybersecurity
        "Ethical Hacking", "Network Security", "Penetration Testing", "Wireshark", "Metasploit",
        // Other Useful Skills
        "WordPress", "Shopify", "SEO", "Content Writing", "Project Management", "Agile", "Scrum"
    ];

    const handlechange = (event) => {
        const { name, value } = event.target;
        setformdata(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://127.0.0.1:8000/userskill", formdata, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            console.log("Token sent:", token);

            if (res.status === 200) {

            }
        } catch (err) {
            setmessage(err.message);
        }
    };

    return (
        <div className="profileCont">
            {userinfo ? (
                <div className="formcont">
                    <h2>Your Profile</h2>
                    <p><strong>Name:</strong> {userinfo.name}</p>
                    <p><strong>Education:</strong> {userinfo.education}</p>
                    <p><strong>University:</strong> {userinfo.university}</p>
                    <p><strong>Skills:</strong> {Array.isArray(userinfo.skills) ? userinfo.skills.join(", ") : userinfo.skill}</p>
                </div>
            ) : (
                <form className="formcont" onSubmit={handleSubmit}>
                    <h2>Complete Your Profile</h2>
                    <input type="text" value={formdata.name} name='name' placeholder='Name' onChange={handlechange} />
                    <input type="text" value={formdata.education} name="education" placeholder="Education" onChange={handlechange} />
                    <input type='text' value={formdata.university} name="university" placeholder="University" onChange={handlechange} />
                    <select name="skill" value={formdata.skill} onChange={handlechange}>
                        <option value="">Select a skill</option>
                        {allSkill.map((skill, index) => (
                            <option key={index} value={skill}>{skill}</option>
                        ))}
                    </select>
                    <button type="submit">Submit</button>
                    {message && <p>{message}</p>}
                </form>
            )}
        </div>
    );
}
