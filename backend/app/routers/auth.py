import secrets
import httpx
from fastapi import APIRouter, Depends, Response, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import User
from app.auth import create_session, delete_session, get_current_user
from app.schemas import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
SCOPES = "openid email profile"

_IS_PROD = True  # always True — both frontend and backend are on HTTPS


def _set_session_cookie(response: RedirectResponse | Response, value: str, delete: bool = False):
    """Set or delete the session cookie with SameSite=None; Secure for cross-origin support."""
    if delete:
        response.delete_cookie(
            key="coread_session",
            samesite="none",
            secure=True,
            httponly=True,
        )
    else:
        response.set_cookie(
            key="coread_session",
            value=value,
            httponly=True,
            samesite="none",   # required for cross-origin cookie
            secure=True,       # required when samesite=none
            max_age=60 * 60 * 24 * 7,
        )


@router.get("/google")
async def google_login():
    state = secrets.token_urlsafe(32)
    params = (
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope={SCOPES.replace(' ', '%20')}"
        f"&access_type=offline"
        f"&prompt=select_account"
        f"&state={state}"
    )
    return RedirectResponse(GOOGLE_AUTH_URL + params)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()

        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_resp.raise_for_status()
        info = user_resp.json()

    email = info["email"]
    name = info.get("name", email.split("@")[0])
    avatar_url = info.get("picture")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=email, name=name, avatar_url=avatar_url)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.name = name
        user.avatar_url = avatar_url
        await db.commit()

    session_id = await create_session(user.id, user.email, user.name, user.avatar_url)

    redirect = RedirectResponse(url=settings.frontend_url)
    _set_session_cookie(redirect, session_id)
    return redirect


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["user_id"],
        email=current_user["email"],
        name=current_user["name"],
        avatar_url=current_user.get("avatar_url") or None,
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    session_token = request.cookies.get("coread_session")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if session_token:
        await delete_session(session_token)
    _set_session_cookie(response, "", delete=True)
    return {"ok": True}
