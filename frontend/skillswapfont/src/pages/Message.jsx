import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./Message.css";

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
  const [wsError, setWsError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const ws = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Test WebSocket connection
  const testWebSocketConnection = async () => {
    if (!token) {
      console.error('No token available for WebSocket test');
      return;
    }

    try {
      const response = await axios.get("http://127.0.0.1:8000/ws-auth-test", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('WebSocket auth test result:', response.data);
    } catch (error) {
      console.error('WebSocket auth test failed:', error);
      if (error.response?.status === 401) {
        setWsError("Authentication failed. Please login again.");
        // Optionally redirect to login
        // navigate('/login');
      }
    }
  };

  // Test connection when component mounts
  useEffect(() => {
    if (token) {
      testWebSocketConnection();
    }
  }, [token]);

  // Fetch all contacts
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setContacts(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch contacts:", err);
        setWsError("Failed to load contacts");
      });
  }, [token]);

  // WebSocket connection and management
  useEffect(() => {
    if (!selectedUserId || !token) {
      // Clean up WebSocket when no user is selected or no token
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setWsConnected(false);
      setWsError(null);
      return;
    }

    // Small delay to ensure token is available
    const connectTimer = setTimeout(() => {
      connectWebSocket();
      fetchChat();
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      cleanupWebSocket();
    };
  }, [selectedUserId, token]);

  const connectWebSocket = () => {
    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      // Add authentication token to WebSocket connection
      const wsUrl = `ws://127.0.0.1:8000/ws/${selectedUserId}?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);

      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        console.log("🔗 WebSocket connected");
        setWsConnected(true);
        setWsError(null);
        setReconnectAttempts(0);
      };

      socket.onclose = (event) => {
        console.log("🔌 WebSocket disconnected", event.code, event.reason);
        setWsConnected(false);

        // Only attempt reconnection if it wasn't a manual close and user is still selected
        if (event.code !== 1000 && selectedUserId && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setWsError("Connection lost. Attempting to reconnect...");
          attemptReconnect();
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setWsError("Failed to reconnect. Please refresh the page.");
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setWsError("Connection error occurred");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setWsError("Failed to establish connection");
    }
  };

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connectWebSocket();
    }, RECONNECT_DELAY);
  };

  const handleWebSocketMessage = (data) => {
    console.log('Received WebSocket message:', data);

    if (data.type === "connection") {
      console.log('WebSocket connection confirmed');
    } else if (data.type === "message") {
      fetchChat();
      setTypingUser(null);
    } else if (data.type === "message_sent") {
      console.log('Message sent confirmation:', data);
    } else if (data.type === "typing") {
      if (data.from_user !== selectedUserId) {
        setTypingUser(data.from_user);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    } else if (data.type === "error") {
      console.error('WebSocket error message:', data.message);
      setWsError(data.message || "An error occurred");
    }
  };

  const cleanupWebSocket = () => {
    if (ws.current) {
      ws.current.close(1000, "Component unmounting");
      ws.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setWsConnected(false);
    setWsError(null);
  };

  // Load chat history
  const fetchChat = async () => {
    if (!selectedUserId) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/chathistory", {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: selectedUserId } // Add user_id parameter if your API supports it
      });
      setChatHist(res.data);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to fetch chat:", error);
      setWsError("Failed to load chat history");
    }
  };

  // Send message
  const sendMessage = () => {
    if (!currentMessage.trim() || !selectedUserId) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        const messagePayload = {
          message: currentMessage.trim(),
          to_user: selectedUserId,
          type: "message"
        };

        ws.current.send(JSON.stringify(messagePayload));

        // Optimistically update the UI
        setChatHist((prev) => ({
          ...prev,
          sent_messages: [
            ...(prev?.sent_messages || []),
            {
              message: currentMessage.trim(),
              sent_to_name: selectedUserName,
              date: new Date().toISOString(),
            },
          ],
        }));

        setCurrentMessage("");

        // Scroll to bottom after sending
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
        }, 100);

      } catch (error) {
        console.error("Failed to send message:", error);
        setWsError("Failed to send message");
      }
    } else {
      setWsError("Connection not available. Please wait...");
      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        connectWebSocket();
      }
    }
  };

  // Typing indicator with debouncing
  const onChangeMessage = (e) => {
    setCurrentMessage(e.target.value);

    // Send typing indicator (debounced)
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(
          JSON.stringify({
            type: "typing",
            typing: true,
            to_user: selectedUserId,
          })
        );
      } catch (error) {
        console.error("Failed to send typing indicator:", error);
      }
    }
  };

  // Combine and sort messages by timestamp
  const getCombinedMessages = () => {
    if (!chatHist) return [];

    const sentMessages = (chatHist.sent_messages || [])
      .filter((m) => m.sent_to_name === selectedUserName)
      .map((msg) => ({ ...msg, type: 'sent' }));

    const receivedMessages = (chatHist.received_messages || [])
      .filter((m) => m.sent_by_name === selectedUserName)
      .map((msg) => ({ ...msg, type: 'received' }));

    const allMessages = [...sentMessages, ...receivedMessages];

    // Sort by date
    return allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
          onChange={() => { /* Implement search functionality */ }}
        />
        <div className="contact-list">
          {contacts.map((user) => (
            <div
              key={user.userid}
              className={`contact-item ${selectedUserId === user.userid ? "active" : ""}`}
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
              <div className="connection-status">
                {wsConnected ? (
                  <span className="status-connected">🟢 Connected</span>
                ) : (
                  <span className="status-disconnected">🔴 Disconnected</span>
                )}
              </div>
            </div>

            {wsError && (
              <div className="error-banner">
                ⚠️ {wsError}
              </div>
            )}

            <div className="chat-body" ref={chatBodyRef}>
              {getCombinedMessages().map((msg, i) => (
                <div key={`message-${i}`} className={`message-row ${msg.type}`}>
                  <div className="message-bubble">
                    {msg.message}
                    <div className="message-time">
                      {new Date(msg.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
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
                onKeyDown={handleKeyPress}
                disabled={!wsConnected}
              />
              <button
                className="btn btn-primary ms-2"
                onClick={sendMessage}
                disabled={!wsConnected || !currentMessage.trim()}
              >
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