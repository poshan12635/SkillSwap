import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./Message.css"; // your custom styles

export default function Message() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userid: selectedUserId, name: selectedUserName } = location.state || {};

  const token = localStorage.getItem("token");
  const [contacts, setContacts] = useState([]);
  const [chatHist, setChatHist] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const ws = useRef(null);

  // Fetch contacts on component mount
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setContacts(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch contacts:", err);
      });
  }, [token]);

  // Setup WebSocket connection when selectedUserId changes
  useEffect(() => {
    if (!selectedUserId) return;

    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/${selectedUserId}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        fetchChat();
        setTypingUser(null);
      } else if (data.type === "typing") {
        if (data.from_user !== selectedUserId) {
          setTypingUser(data.from_user);
          setTimeout(() => setTypingUser(null), 2000);
        }
      }
    };

    fetchChat();

    return () => {
      ws.current?.close();
      setWsConnected(false);
    };
  }, [selectedUserId]);

  // Fetch chat history from backend
  const fetchChat = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/chathistory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHist(res.data);
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  };

  // Send message via WebSocket
  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    if (ws.current && wsConnected) {
      const messagePayload = {
        message: currentMessage,
        to_user: selectedUserId,
      };

      ws.current.send(JSON.stringify(messagePayload));

      // Optimistically update chat UI immediately
      setChatHist((prev) => ({
        ...prev,
        sent_messages: [
          ...(prev?.sent_messages || []),
          {
            message: currentMessage,
            sent_to_name: selectedUserName,
            date: new Date().toISOString(),
          },
        ],
      }));

      setCurrentMessage("");
    } else {
      console.warn("WebSocket not connected yet");
    }
  };

  // Handle input changes and send typing notification
  const onChangeMessage = (e) => {
    setCurrentMessage(e.target.value);
    if (ws.current && wsConnected) {
      ws.current.send(
        JSON.stringify({
          typing: true,
          to_user: selectedUserId,
        })
      );
    }
  };

  return (
    <div className="messenger-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <h5 className="sidebar-title">Chats</h5>
        <input
          className="form-control mb-3"
          placeholder="Search contacts..."
          onChange={() => {}}
        />
        <div className="contact-list">
          {contacts.map((user) => (
            <div
              key={user.userid}
              className={`contact-item ${
                selectedUserId === user.userid ? "active" : ""
              }`}
              onClick={() =>
                navigate("/message", {
                  state: { userid: user.userid, name: user.name },
                })
              }
            >
              <div className="avatar">{user.name.charAt(0)}</div>
              <div className="contact-name">{user.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Window */}
      <div className="chat-panel">
        {selectedUserId ? (
          <>
            <div className="chat-header">
              <div className="chat-user">{selectedUserName}</div>
            </div>

            <div className="chat-body">
              {chatHist &&
                chatHist.sent_messages
                  .filter((m) => m.sent_to_name === selectedUserName)
                  .map((msg, i) => (
                    <div key={`sent-${i}`} className="message-row sent">
                      <div className="message-bubble">{msg.message}</div>
                    </div>
                  ))}

              {chatHist &&
                chatHist.received_messages
                  .filter((m) => m.sent_by_name === selectedUserName)
                  .map((msg, i) => (
                    <div key={`received-${i}`} className="message-row received">
                      <div className="message-bubble">{msg.message}</div>
                    </div>
                  ))}

              {typingUser && (
                <div className="typing-indicator">
                  <em>{typingUser} is typing...</em>
                </div>
              )}
            </div>

            <div className="chat-input">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message..."
                value={currentMessage}
                onChange={onChangeMessage}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button className="btn btn-primary ms-2" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="placeholder">
            <h4>Select a contact to start chatting</h4>
          </div>
        )}
      </div>
    </div>
  );
}
