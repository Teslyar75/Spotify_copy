"""User routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.models.message import Message
from app.schemas import UserResponse, MessageResponse

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Получить всех пользователей."""
    profiles = db.query(UserProfile).all()
    users = []
    for profile in profiles:
        user = db.query(AuthUser).filter(AuthUser.id == profile.id).first()
        if user:
            users.append({
                "id": user.id,
                "email": user.email,
                "username": profile.username,
                "avatar_url": profile.avatar_url,
                "created_at": user.created_at,
            })
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    """Получить пользователя по ID."""
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = db.query(AuthUser).filter(AuthUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "username": profile.username,
        "avatar_url": profile.avatar_url,
        "created_at": user.created_at,
    }


@router.get("/messages/{user_id}", response_model=list[MessageResponse])
def get_messages(user_id: UUID, db: Session = Depends(get_db)):
    """Получить сообщения с пользователем."""
    messages = db.query(Message).filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.created_at).all()
    return messages
