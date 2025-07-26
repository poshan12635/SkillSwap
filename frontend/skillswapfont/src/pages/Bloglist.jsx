import React, { useState, useEffect } from "react";
import Blog from "./Blog";
import axios from "axios";

export default function Bloglist() {
    const [postdata, setpostdata] = useState([]);
    const [message, setMessage] = useState("");

    const fetchblog = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://127.0.0.1:8000/getblog", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.status === 200) {
                setpostdata(res.data);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchblog();
    }, []);

    return (
        <div className="container my-3">
            <div className="row g-4">
                {postdata.length > 0 ? (
                    postdata.map((post, index) => (
                        <div className="col-md-4" key={index}>
                            <Blog

                                userid={post.user_id}
                                name={post.name}
                                title={post.title}
                                description={post.projectdetail}
                                skill={post.skill}
                                yourself={post.yourself}
                                youdo={post.youdo}
                                expectfrom={post.expectform}
                                whyjoin={post.whyjoin}

                            />
                        </div>
                    ))
                ) : (
                    <p>{message || "Loading blogs..."}</p>
                )}
            </div>
        </div>
    );
}
