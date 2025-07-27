# websock.py
from fastapi import WebSocket
import json
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections: user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        
    async def connect(self, user_id: int, websocket: WebSocket):
        """Connect a user's WebSocket"""
        try:
            # If user already has a connection, close the old one
            if user_id in self.active_connections:
                old_ws = self.active_connections[user_id]
                try:
                    await old_ws.close(code=4002, reason="New connection established")
                except:
                    pass  # Ignore errors when closing old connection
            
            self.active_connections[user_id] = websocket
            logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
            
        except Exception as e:
            logger.error(f"Error connecting user {user_id}: {e}")
            raise

    def disconnect(self, user_id: int):
        """Disconnect a user's WebSocket"""
        try:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
                logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")

    async def send_personal_message(self, user_id: int, message: str) -> bool:
        """Send a message to a specific user"""
        try:
            if user_id in self.active_connections:
                websocket = self.active_connections[user_id]
                try:
                    await websocket.send_text(message)
                    logger.debug(f"Message sent to user {user_id}")
                    return True
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")
                    # Remove the connection if it's broken
                    self.disconnect(user_id)
                    return False
            else:
                logger.debug(f"User {user_id} not connected")
                return False
        except Exception as e:
            logger.error(f"Error sending message to user {user_id}: {e}")
            return False

    def is_user_connected(self, user_id: int) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.active_connections

    def get_connected_users(self) -> list:
        """Get list of all connected user IDs"""
        return list(self.active_connections.keys())

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)

    async def broadcast_message(self, message: str, exclude_user: Optional[int] = None):
        """Broadcast a message to all connected users (optionally excluding one user)"""
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)

    async def send_to_multiple_users(self, user_ids: list, message: str):
        """Send a message to multiple specific users"""
        results = {}
        for user_id in user_ids:
            results[user_id] = await self.send_personal_message(user_id, message)
        return results

# Create a global instance
manager = ConnectionManager()