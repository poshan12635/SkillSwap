# connection_manager.py
from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, user_id: int, message: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    def get_online_users(self):
        return list(self.active_connections.keys())

manager = ConnectionManager()
