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

_OAUTH_STATE_COOKIE = "coread_oauth_state"


@router.get("/google")
async def google_login(response: Response):
    # Fix 2: Generate a random state token to prevent OAuth CSRF
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
    redirect = RedirectResponse(GOOGLE_AUTH_URL + params)
    # Store state in a short-lived, httponly cookie for validation in the callback
    redirect.set_cookie(
        key=_OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        samesite="lax",
        secure=(settings.environment == "production"),
        max_age=600,  # 10 minutes — enough to complete the OAuth flow
    )
    return redirect


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    # Fix 2: Validate state to prevent OAuth CSRF
    expected_state = request.cookies.get(_OAUTH_STATE_COOKIE)
    if not expected_state or not secrets.compare_digest(expected_state, state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state — possible CSRF attempt")

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
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

        # Fetch user info
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_resp.raise_for_status()
        info = user_resp.json()

    email = info["email"]
    name = info.get("name", email.split("@")[0])
    avatar_url = info.get("picture")

    # Upsert user
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
    redirect.set_cookie(
        key="coread_session",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=(settings.environment == "production"),
        max_age=60 * 60 * 24 * 7,
    )
    # Clear the OAuth state cookie now that it has been validated
    redirect.delete_cookie(_OAUTH_STATE_COOKIE)
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
    session_id = request.cookies.get("coread_session")
    if session_id:
        await delete_session(session_id)
    response.delete_cookie("coread_session")
    return {"ok": True}
