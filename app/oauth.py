"""OAuth провайдеры Google и GitHub."""

import os
from urllib.parse import urlencode

import httpx

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback"
)
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# GitHub OAuth
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback"
)
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"

# Frontend URL для редиректа после OAuth
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def get_google_auth_url(state: str) -> str:
    """URL для редиректа на Google OAuth."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def get_github_auth_url(state: str) -> str:
    """URL для редиректа на GitHub OAuth."""
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",
        "state": state,
    }
    return f"{GITHUB_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str) -> dict:
    """Обмен code на токен и получение данных пользователя."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        user_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_response.raise_for_status()
        user_data = user_response.json()

    return {
        "email": user_data.get("email", ""),
        "name": user_data.get("name", ""),
        "picture": user_data.get("picture"),
        "id": str(user_data.get("id", "")),
    }


async def exchange_github_code(code: str) -> dict:
    """Обмен code на токен и получение данных пользователя."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        user_response = await client.get(
            GITHUB_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_response.raise_for_status()
        user_data = user_response.json()

        # GitHub может не возвращать email в user - нужен отдельный запрос
        email = user_data.get("email")
        if not email:
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if email_response.status_code == 200:
                emails = email_response.json()
                primary = next(
                    (e for e in emails if e.get("primary")),
                    emails[0] if emails else {}
                )
                email = primary.get("email", "")

    return {
        "email": email or f"{user_data.get('id', '')}@github.local",
        "name": user_data.get("name") or user_data.get("login", "GitHub User"),
        "picture": user_data.get("avatar_url"),
        "id": str(user_data.get("id", "")),
    }
