"""
Auth routes — регистрация, вход, refresh токена.

- POST /register — создаёт AuthUser + UserProfile, возвращает токены
- POST /login — проверяет пароль, возвращает токены
- POST /refresh — обновляет access_token по refresh_token (при 401 на frontend)
- GET /me — текущий пользователь по Bearer токену
"""

from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.schemas import UserCreate, UserLogin, UserResponse, Token, TokenWithUser
from app.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)

router = APIRouter()
security = HTTPBearer()


@router.get("/health")
def auth_health():
    """Проверка работоспособности сервиса аутентификации."""
    return {"status": "ok", "service": "auth"}


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя.

    Шаги:
        1. Проверяем уникальность email и username
        2. Хешируем пароль (bcrypt — медленный, со встроенной солью)
        3. Создаём запись AuthUser (только учётные данные)
        4. Создаём UserProfile через _ensure_profile (публичный профиль)
        5. Генерируем и возвращаем access + refresh токены
    """
    # Шаг 1: проверка уникальности email
    existing_user = db.query(AuthUser).filter(AuthUser.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Шаг 1: проверка уникальности username
    existing_profile = db.query(UserProfile).filter(
        UserProfile.username == user_data.username
    ).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Шаг 2: хешируем пароль — plain text НИКОГДА не сохраняем
    hashed_password = get_password_hash(user_data.password)

    # Шаг 3: создаём запись в auth_users
    # initial_username сохраняется для последующего создания профиля
    user = AuthUser(
        email=user_data.email,
        password_hash=hashed_password,
        initial_username=user_data.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # db.refresh загружает обратно из БД (получаем auto-generated id, created_at)

    # Шаг 4: создаём UserProfile (ленивое создание через _ensure_profile)
    from app.routes.users import _ensure_profile
    profile = _ensure_profile(user.id, db)

    # Шаг 5: генерируем JWT токены
    # sub = user.id (не email!) — ID не меняется, email может поменяться
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": profile.username,
            "avatar_url": profile.avatar_url,
        },
    }


@router.post("/login", response_model=TokenWithUser)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Вход пользователя.

    Шаги:
        1. Ищем пользователя по email
        2. Проверяем пароль через bcrypt.checkpw (не хранит пароль, только сравнивает хеши)
        3. Генерируем и возвращаем токены + данные пользователя
    """
    # Шаг 1: ищем по email (используем индекс idx_auth_users_email)
    user = db.query(AuthUser).filter(AuthUser.email == login_data.email).first()

    # Шаг 2: проверяем пароль.
    # Важно: "not user" и "неверный пароль" дают одинаковое сообщение об ошибке.
    # Это предотвращает user enumeration — злоумышленник не узнает, зарегистрирован ли email.
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    from app.routes.users import _ensure_profile
    profile = _ensure_profile(user.id, db)

    # Шаг 3: генерируем токены
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": profile.username,
            "avatar_url": profile.avatar_url,
        },
    }


@router.post("/logout")
def logout():
    """
    Выход пользователя.

    В MVP токен просто "забывается" на клиенте — backend не инвалидирует его.
    В production здесь нужно добавить токен в Redis-blacklist,
    чтобы нельзя было им воспользоваться до истечения срока жизни.
    """
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_data: dict, db: Session = Depends(get_db)):
    """
    Обновление access_token по refresh_token.

    Вызывается frontend автоматически при получении 401 на любой запрос.
    Позволяет не требовать повторного логина каждые 30 минут.

    Шаги:
        1. Достаём refresh_token из тела запроса
        2. Декодируем и проверяем, что это именно refresh (не access)
        3. Находим пользователя в БД
        4. Возвращаем новую пару токенов
    """
    refresh_token = refresh_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )

    payload = decode_token(refresh_token)

    # Важная проверка: нельзя использовать access token вместо refresh.
    # В payload refresh token есть поле type="refresh".
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

    # Генерируем новую пару токенов (refresh token rotation)
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {"access_token": new_access_token, "refresh_token": new_refresh_token}


from app.oauth import (
    get_google_auth_url,
    get_github_auth_url,
    exchange_google_code,
    exchange_github_code,
    FRONTEND_URL,
)


@router.get("/google")
def google_login():
    """Редирект на Google OAuth."""
    return {"url": get_google_auth_url(state="google-auth")}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Обработка ответа от Google."""
    try:
        user_data = await exchange_google_code(code)
        return await _login_or_register_oauth_user(user_data, "google", db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google auth failed: {str(e)}"
        )


@router.get("/github")
def github_login():
    """Редирект на GitHub OAuth."""
    return {"url": get_github_auth_url(state="github-auth")}


@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Обработка ответа от GitHub."""
    try:
        user_data = await exchange_github_code(code)
        return await _login_or_register_oauth_user(user_data, "github", db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub auth failed: {str(e)}"
        )


async def _login_or_register_oauth_user(user_data: dict, provider: str, db: Session):
    """
    Автоматический вход или регистрация пользователя через OAuth.
    
    1. Ищем пользователя по email
    2. Если нет — создаём нового (без пароля)
    3. Генерируем токены и редиректим на фронтенд с токенами в URL
    """
    from fastapi.responses import RedirectResponse
    from app.routes.users import _ensure_profile

    email = user_data["email"]
    user = db.query(AuthUser).filter(AuthUser.email == email).first()

    if not user:
        # Регистрация нового пользователя
        # Пароль не задаём (будет NULL или пустой), так как вход через OAuth
        username = user_data["name"] or email.split("@")[0]
        user = AuthUser(
            email=email,
            password_hash="",  # вход по паролю для OAuth-аккаунтов невозможен без сброса пароля
            initial_username=username,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Сразу создаём профиль и ставим аватарку из соцсети
        profile = _ensure_profile(user.id, db)
        if user_data.get("picture"):
            profile.avatar_url = user_data["picture"]
            db.commit()
    else:
        profile = _ensure_profile(user.id, db)

    # Генерируем токены
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Редиректим на фронтенд с токенами в query params.
    # Фронтенд на странице /login (или специальной /oauth/callback) считает их и сохранит.
    from urllib.parse import urlencode
    params = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": str(user.id),
        "username": profile.username,
        "email": user.email,
        "avatar_url": profile.avatar_url or "",
    }
    return RedirectResponse(url=f"{FRONTEND_URL}/login?{urlencode(params)}")


@router.get("/me", response_model=UserResponse)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Возвращает данные текущего авторизованного пользователя.

    Используется frontend при загрузке приложения для восстановления сессии:
    если токен есть и валиден — пользователь считается залогиненным.
    """
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
            detail="User not found",
        )

    from app.routes.users import _ensure_profile
    profile = _ensure_profile(UUID(user_id), db)

    return {
        "id": user.id,
        "email": user.email,
        "username": profile.username,
        "avatar_url": profile.avatar_url,
        "created_at": user.created_at,
    }
