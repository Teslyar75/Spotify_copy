"""WebSocket manager для real-time функциональности."""

import json
from typing import Dict, List, Set
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """Менеджер WebSocket соединений."""
    
    def __init__(self):
        # active_connections[user_id] = [list of websockets]
        self.active_connections: Dict[UUID, List[WebSocket]] = {}
        # online_users = set of user_ids
        self.online_users: Set[UUID] = set()
        # user_activities[user_id] = activity string
        self.user_activities: Dict[UUID, str] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        """Подключить пользователя."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.online_users.add(user_id)
        
        # Notify all users about updated online list
        await self.broadcast_online_users()

    def disconnect(self, user_id: UUID, websocket: WebSocket):
        """Отключить пользователя."""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.online_users.discard(user_id)
                if user_id in self.user_activities:
                    del self.user_activities[user_id]

    async def send_personal_message(self, message: dict, user_id: UUID):
        """Отправить персональное сообщение."""
        if user_id in self.active_connections:
            for websocket in self.active_connections[user_id]:
                await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключенным пользователям."""
        for user_id, connections in self.active_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except:
                    pass

    async def broadcast_online_users(self):
        """Отправить список онлайн пользователей всем."""
        online_list = [str(uid) for uid in self.online_users]
        await self.broadcast({"type": "users_online", "users": online_list})

    async def broadcast_activities(self):
        """Отправить активности всех пользователей."""
        activities_list = [(str(uid), activity) for uid, activity in self.user_activities.items()]
        await self.broadcast({"type": "activities", "activities": activities_list})

    async def send_message_to_user(self, message: dict, receiver_id: UUID):
        """Отправить сообщение конкретному пользователю."""
        await self.send_personal_message(message, receiver_id)

    def update_activity(self, user_id: UUID, activity: str):
        """Обновить активность пользователя."""
        self.user_activities[user_id] = activity

    def get_user_activity(self, user_id: UUID) -> str | None:
        """Получить активность пользователя."""
        return self.user_activities.get(user_id)


# Global manager instance
manager = ConnectionManager()
