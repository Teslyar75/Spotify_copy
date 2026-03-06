"""WebSocket routes."""

import json
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.message import Message
from app.models.user_status import UserStatus
from app.websocket import manager
from app.utils import decode_token

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """WebSocket endpoint для real-time общения."""
    # Get auth info from connection
    auth = websocket.scope.get("auth", {})
    user_id_str = auth.get("userId")
    token = auth.get("token", "")
    
    # Validate token
    if token.startswith("Bearer "):
        token = token[7:]
    payload = decode_token(token)
    
    if not payload or not user_id_str:
        await websocket.close(code=4001, reason="Invalid authentication")
        return
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        await websocket.close(code=4001, reason="Invalid user ID")
        return
    
    # Connect user
    await manager.connect(websocket, user_id)
    
    # Update user status to online
    user_status = db.query(UserStatus).filter(UserStatus.user_id == user_id).first()
    if not user_status:
        user_status = UserStatus(user_id=user_id, is_online=True)
        db.add(user_status)
    else:
        user_status.is_online = True
    db.commit()
    
    # Send initial data
    await manager.send_personal_message({
        "type": "connected",
        "userId": str(user_id)
    }, user_id)
    
    # Send online users list
    await manager.broadcast_online_users()
    
    # Send activities
    await manager.broadcast_activities()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "send_message":
                # Handle chat message
                receiver_id_str = message.get("receiverId")
                content = message.get("content")
                
                if not receiver_id_str or not content:
                    continue
                
                try:
                    receiver_id = UUID(receiver_id_str)
                except ValueError:
                    continue
                
                # Save message to database
                db_message = Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    content=content
                )
                db.add(db_message)
                db.commit()
                db.refresh(db_message)
                
                # Send to receiver
                await manager.send_message_to_user({
                    "type": "receive_message",
                    "message": {
                        "id": str(db_message.id),
                        "sender_id": str(db_message.sender_id),
                        "receiver_id": str(db_message.receiver_id),
                        "content": db_message.content,
                        "created_at": db_message.created_at.isoformat(),
                        "updated_at": db_message.updated_at.isoformat(),
                    }
                }, receiver_id)
                
                # Confirm to sender
                await manager.send_personal_message({
                    "type": "message_sent",
                    "message": {
                        "id": str(db_message.id),
                        "sender_id": str(db_message.sender_id),
                        "receiver_id": str(db_message.receiver_id),
                        "content": db_message.content,
                        "created_at": db_message.created_at.isoformat(),
                        "updated_at": db_message.updated_at.isoformat(),
                    }
                }, user_id)
            
            elif message_type == "update_activity":
                # Handle activity update
                activity = message.get("activity")
                if activity:
                    manager.update_activity(user_id, activity)
                    
                    # Update in database
                    user_status = db.query(UserStatus).filter(
                        UserStatus.user_id == user_id
                    ).first()
                    if user_status:
                        user_status.current_activity = activity
                        db.commit()
                    
                    # Broadcast to all
                    await manager.broadcast({
                        "type": "activity_updated",
                        "userId": str(user_id),
                        "activity": activity
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        
        # Update user status to offline
        user_status = db.query(UserStatus).filter(UserStatus.user_id == user_id).first()
        if user_status:
            user_status.is_online = False
            db.commit()
        
        # Notify others
        await manager.broadcast({
            "type": "user_disconnected",
            "userId": str(user_id)
        })
        await manager.broadcast_online_users()
