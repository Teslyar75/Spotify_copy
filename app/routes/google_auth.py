"""
Google OAuth 2.0 / OpenID Connect authentication routes.

- GET /api/auth/google/enabled — проверка настройки Google OAuth
- GET /api/auth/google/login — редирект на Google с state + PKCE
- GET /api/auth/google/callback — обработка callback от Google
"""
import os
import secrets
import hashlib
import base64
from datetime import timedelta
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.utils import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
)

router = APIRouter()

# Google OAuth настройки из env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/google/callback"
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"

# In-memory state storage (в production использовать Redis/DB)
oauth_states = {}


def is_google_oauth_enabled() -> bool:
    """Проверка что Google OAuth настроен."""
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


@router.get("/enabled")
def google_oauth_enabled():
    """Проверка доступности Google OAuth."""
    return {"enabled": is_google_oauth_enabled()}


def generate_code_verifier() -> str:
    """Генерация PKCE code verifier."""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')


def generate_code_challenge(verifier: str) -> str:
    """Генерация PKCE code challenge из verifier."""
    digest = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')


@router.get("/login")
def google_login():
    """
    Редирект на Google OAuth с state + PKCE.
    
    Scopes: openid email profile
    """
    if not is_google_oauth_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    # Генерация state для защиты от CSRF
    state = secrets.token_urlsafe(32)
    
    # PKCE code verifier и challenge
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Сохраняем state и code_verifier (в production использовать Redis)
    oauth_states[state] = {
        "code_verifier": code_verifier,
        "timestamp": int(timedelta(minutes=10).total_seconds())
    }
    
    # Параметры OAuth авторизации
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


def verify_google_id_token(id_token: str) -> dict:
    """
    Верификация Google ID token.
    
    Проверяет:
    - Signature с помощью Google's public keys
    - Audience (client_id)
    - Issuer (accounts.google.com или https://accounts.google.com)
    - Expiration
    - email_verified
    """
    try:
        # Получаем Google public keys
        response = httpx.get(GOOGLE_JWKS_URL, timeout=10.0)
        response.raise_for_status()
        jwks = response.json()
        
        # Декодируем header чтобы получить kid
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        # Находим нужный ключ
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        
        if not rsa_key:
            raise ValueError("Unable to find matching RSA key")
        
        # Верифицируем и декодируем token
        payload = jwt.decode(
            id_token,
            rsa_key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_ID,
            issuer=["accounts.google.com", "https://accounts.google.com"]
        )
        
        # Проверяем email_verified
        if not payload.get("email_verified", False):
            raise ValueError("Email not verified by Google")
        
        return payload
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid ID token: {str(e)}"
        )


def _ensure_profile(user: AuthUser, db: Session, username: str = None):
    """
    Убеждаемся что у пользователя есть профиль.
    Если нет — создаём с initial_username или сгенерированным.
    """
    existing_profile = db.query(UserProfile).filter(UserProfile.id == user.id).first()
    if existing_profile:
        return existing_profile
    
    # Генерация username если не передан
    if not username:
        username = user.initial_username or f"user_{user.id.hex[:8]}"
    
    # Проверка уникальности username
    counter = 1
    original_username = username
    while db.query(UserProfile).filter(UserProfile.username == username).first():
        username = f"{original_username}{counter}"
        counter += 1
    
    # Создаём профиль с бонусом 100 звёзд
    profile = UserProfile(
        id=user.id,
        username=username,
        display_name=username,
        bio=None,
        stars_balance=100,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/callback")
def google_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """
    Обработка callback от Google.
    
    Шаги:
    1. Проверка state (защита от CSRF)
    2. Обмен code на tokens
    3. Верификация ID token
    4. Поиск или создание пользователя
    5. Выдача собственных токенов
    6. Редирект на frontend
    """
    if error:
        # Google вернул ошибку
        return RedirectResponse(
            url=f"/auth/google/done?error={error}",
            status_code=status.HTTP_302_FOUND
        )
    
    if not code or not state:
        return RedirectResponse(
            url="/auth/google/done?error=missing_params",
            status_code=status.HTTP_302_FOUND
        )
    
    # Проверка state
    state_data = oauth_states.pop(state, None)
    if not state_data:
        return RedirectResponse(
            url="/auth/google/done?error=invalid_state",
            status_code=status.HTTP_302_FOUND
        )
    
    code_verifier = state_data["code_verifier"]
    
    # Обмен code на tokens
    try:
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
            "code_verifier": code_verifier
        }
        
        response = httpx.post(GOOGLE_TOKEN_URL, data=token_data, timeout=10.0)
        response.raise_for_status()
        tokens = response.json()
        
        id_token = tokens.get("id_token")
        if not id_token:
            raise ValueError("No ID token in response")
        
        # Верификация ID token
        payload = verify_google_id_token(id_token)
        
        google_sub = payload.get("sub")
        email = payload.get("email")
        name = payload.get("name", "")
        picture = payload.get("picture")
        
        if not google_sub or not email:
            raise ValueError("Missing required fields in ID token")
        
        # Поиск существующего пользователя
        # Проверяем по google_sub или email
        user = db.query(AuthUser).filter(AuthUser.google_sub == google_sub).first()
        
        if not user:
            # Проверяем по email (линковка существующего аккаунта)
            user = db.query(AuthUser).filter(AuthUser.email == email).first()
            if user:
                # Линкуем Google к существующему аккаунту
                user.google_sub = google_sub
                user.auth_provider = "google"
                if picture:
                    user.avatar_url = picture
                db.commit()
            else:
                # Создаём нового пользователя
                # Генерируем username из name или email
                username = name.split()[0] if name else email.split('@')[0]
                username = ''.join(c if c.isalnum() or c in '_-' else '_' for c in username)
                username = username[:50]
                
                user = AuthUser(
                    email=email,
                    password_hash=None,  # OAuth user без пароля
                    google_sub=google_sub,
                    auth_provider="google",
                    avatar_url=picture,
                    initial_username=username
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        
        # Убеждаемся что есть профиль
        _ensure_profile(user, db)
        
        # Выдаём собственные токены приложения
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Редирект на frontend с токенами
        redirect_url = f"/auth/google/done#access_token={access_token}&refresh_token={refresh_token}"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
        
    except Exception as e:
        return RedirectResponse(
            url=f"/auth/google/done?error={str(e)[:100]}",
            status_code=status.HTTP_302_FOUND
        )
