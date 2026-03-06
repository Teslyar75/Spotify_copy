"""Auth routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя."""
    # Check if user exists
    existing_user = db.query(AuthUser).filter(AuthUser.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_profile = db.query(UserProfile).filter(
        UserProfile.username == user_data.username
    ).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = AuthUser(email=user_data.email, password_hash=hashed_password)
    db.add(user)
    db.flush()
    
    # Create profile
    profile = UserProfile(
        id=user.id,
        username=user_data.username,
        avatar_url=None,
        bio=""
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "refresh_token": refresh_token}


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя."""
    user = db.query(AuthUser).filter(AuthUser.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Get profile
    profile = db.query(UserProfile).filter(UserProfile.id == user.id).first()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": profile.username if profile else user.email,
            "avatar_url": profile.avatar_url if profile else None,
        }
    }


@router.post("/logout")
def logout():
    """Выход пользователя."""
    # В production здесь нужно инвалидировать токен
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_data: dict, db: Session = Depends(get_db)):
    """Обновление токена."""
    refresh_token = refresh_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
    
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(AuthUser).filter(AuthUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {"access_token": new_access_token, "refresh_token": new_refresh_token}


@router.get("/me", response_model=UserResponse)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Получение текущего пользователя."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(AuthUser).filter(AuthUser.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = db.query(UserProfile).filter(UserProfile.id == user.id).first()
    
    return {
        "id": user.id,
        "email": user.email,
        "username": profile.username if profile else user.email,
        "avatar_url": profile.avatar_url if profile else None,
        "created_at": user.created_at,
    }
