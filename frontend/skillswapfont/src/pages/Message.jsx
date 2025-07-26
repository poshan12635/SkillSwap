import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

export default function Message() {
    const location = useLocation();
    const data = location.state || {};
    const id = data.userid;
    const name1 = data.name;
    const token = localStorage.getItem("token");

    const [chatHist, setChatHist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("received"); // "received" or "sent"
    const [searchQuery, setSearchQuery] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [typingUser, setTypingUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const ws = useRef(null);

    // Fetch chat history from REST API
    const fetchChat = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/chathistory", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChatHist(res.data);
            setError("");
        } catch (err) {
            setError("Failed to fetch chat history.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch online users from REST API
    const fetchOnlineUsers = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/online");
            setOnlineUsers(res.data.online_users || []);
        } catch {
            // Ignore errors here
        }
    };

    // Setup WebSocket connection
    useEffect(() => {
        if (!id) return;
        ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/${id}`);

        ws.current.onopen = () => console.log("WebSocket connected");
        ws.current.onclose = () => console.log("WebSocket disconnected");
        ws.current.onerror = (e) => console.error("WebSocket error:", e);

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "message") {
                    fetchChat();
                    setTypingUser(null);
                } else if (data.type === "typing") {
                    if (data.from_user !== id) {
                        setTypingUser(data.from_user);
                        setTimeout(() => setTypingUser(null), 2000);
                    }
                }
            } catch {
                console.log("Invalid WebSocket message", event.data);
            }
        };

        fetchChat();
        fetchOnlineUsers();

        const onlineInterval = setInterval(fetchOnlineUsers, 10000);

        return () => {
            ws.current.close();
            clearInterval(onlineInterval);
        };
    }, [id]);

    // Helper: send message via websocket
    const sendMessage = (msg, toUser) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && msg.trim()) {
            ws.current.send(
                JSON.stringify({
                    message: msg,
                    to_user: toUser,
                })
            );
        }
    };

    // Helper: send typing status
    const sendTyping = (toUser) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(
                JSON.stringify({
                    typing: true,
                    to_user: toUser,
                })
            );
        }
    };

    // Highlight searched text in messages
    const highlightText = (text) => {
        if (!searchQuery) return text;
        const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
        return parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <mark key={i}>{part}</mark>
            ) : (
                part
            )
        );
    };

    // Group messages by user and filter & sort
    const getGroupedMessages = () => {
        if (!chatHist) return {};
        const msgs = activeTab === "received" ? chatHist.received_messages : chatHist.sent_messages;

        const filtered = msgs
            .filter((msg) => {
                const user = activeTab === "received" ? msg.sent_by_name : msg.sent_to_name;
                return (
                    user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
                );
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

        const grouped = {};
        filtered.forEach((msg) => {
            const user = activeTab === "received" ? msg.sent_by_name : msg.sent_to_name;
            if (!grouped[user]) grouped[user] = [];
            grouped[user].push(msg);
        });

        return grouped;
    };

    // Send reply message
    const handleSendReply = () => {
        if (!replyTo || !currentMessage.trim()) return;
        sendMessage(currentMessage, activeTab === "received" ? replyTo.sent_by : replyTo.sent_to);
        setCurrentMessage("");
        setReplyTo(null);
    };

    return (
        <div className="container py-4">
            <h3>Welcome, {name1}</h3>

            {/* Online users */}
            <div className="mb-3">
                <strong>Online users:</strong>{" "}
                {onlineUsers.length ? onlineUsers.join(", ") : "No one online"}
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "received" ? "active" : ""}`}
                        onClick={() => setActiveTab("received")}
                    >
                        Received Messages
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "sent" ? "active" : ""}`}
                        onClick={() => setActiveTab("sent")}
                    >
                        Sent Messages
                    </button>
                </li>
            </ul>

            {/* Search */}
            <input
                className="form-control mb-3"
                type="text"
                placeholder="Search by name or message"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Loading, error, or empty */}
            {loading && <p>Loading messages...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && chatHist && Object.keys(getGroupedMessages()).length === 0 && (
                <p>No messages found.</p>
            )}

            {/* Messages grouped by user */}
            {!loading &&
                chatHist &&
                Object.entries(getGroupedMessages()).map(([user, messages]) => (
                    <div key={user} className="mb-4">
                        <h5 className="text-primary border-bottom pb-1">{user}</h5>
                        <ul className="list-group">
                            {messages.map((msg, idx) => (
                                <li
                                    key={idx}
                                    className="list-group-item d-flex justify-content-between align-items-start"
                                >
                                    <div>
                                        <p className="mb-1">{highlightText(msg.message)}</p>
                                        <small className="text-muted">
                                            {new Date(msg.date).toLocaleString()}
                                        </small>
                                    </div>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => setReplyTo(msg)}
                                    >
                                        Reply
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

            {/* Typing Indicator */}
            {typingUser && (
                <p>
                    <em>
                        User <strong>{typingUser}</strong> is typing...
                    </em>
                </p>
            )}

            {/* Reply Box */}
            {replyTo && (
                <div className="mt-4 p-3 border rounded bg-light">
                    <p>
                        Replying to: <em>{highlightText(replyTo.message)}</em>{" "}
                        <small className="text-muted">{new Date(replyTo.date).toLocaleString()}</small>
                    </p>
                    <textarea
                        className="form-control mb-2"
                        rows={3}
                        placeholder="Write your reply..."
                        value={currentMessage}
                        onChange={(e) => {
                            setCurrentMessage(e.target.value);
                            // send typing notification to original sender or receiver based on tab
                            if (activeTab === "received") sendTyping(replyTo.messagesentby);
                            else sendTyping(replyTo.messagesentto);
                        }}
                    />
                    <div>
                        <button className="btn btn-primary btn-sm me-2" onClick={handleSendReply}>
                            Send Reply
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setReplyTo(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
