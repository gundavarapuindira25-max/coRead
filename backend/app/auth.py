import hashlib
import hmac
import uuid
from fastapi import Cookie, HTTPException, status
from app.redis_client import get_redis
from app.config import settings

SESSION_TTL = 60 * 60 * 24 * 7  # 7 days
_USER_SESSIONS_PREFIX = "user_sessions:"


def _sign_session_id(raw_id: str) -> str:
    """Return 'raw_id.hmac' so forged or tampered tokens are rejected before Redis lookup."""
    mac = hmac.new(settings.secret_key.encode(), raw_id.encode(), hashlib.sha256).hexdigest()
    return f"{raw_id}.{mac}"


def _verify_session_token(token: str) -> str | None:
    """Validate the HMAC signature and return the raw session ID, or None if invalid."""
    try:
        raw_id, provided_mac = token.rsplit(".", 1)
    except ValueError:
        return None
    expected_mac = hmac.new(settings.secret_key.encode(), raw_id.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_mac, provided_mac):
        return None
    return raw_id


async def create_session(user_id: str, email: str, name: str, avatar_url: str | None) -> str:
    redis = await get_redis()
    raw_id = str(uuid.uuid4())

    # Fix 11: Invalidate all previous sessions for this user before creating a new one
    user_sessions_key = f"{_USER_SESSIONS_PREFIX}{user_id}"
    old_sessions = await redis.smembers(user_sessions_key)
    if old_sessions:
        pipeline = redis.pipeline()
        for old_raw_id in old_sessions:
            pipeline.delete(f"session:{old_raw_id}")
        pipeline.delete(user_sessions_key)
        await pipeline.execute()

    # Store session data
    await redis.hset(
        f"session:{raw_id}",
        mapping={
            "user_id": user_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url or "",
        },
    )
    await redis.expire(f"session:{raw_id}", SESSION_TTL)

    # Track this session under the user so we can invalidate it later
    await redis.sadd(user_sessions_key, raw_id)
    await redis.expire(user_sessions_key, SESSION_TTL)

    # Fix 10: Return a signed token instead of a bare UUID
    return _sign_session_id(raw_id)


async def delete_session(session_token: str) -> None:
    raw_id = _verify_session_token(session_token)
    if not raw_id:
        return
    redis = await get_redis()
    data = await redis.hgetall(f"session:{raw_id}")
    if data:
        user_id = data.get("user_id")
        if user_id:
            await redis.srem(f"{_USER_SESSIONS_PREFIX}{user_id}", raw_id)
    await redis.delete(f"session:{raw_id}")


async def get_session_data(session_token: str) -> dict | None:
    # Fix 10: Verify HMAC before touching Redis
    raw_id = _verify_session_token(session_token)
    if not raw_id:
        return None
    redis = await get_redis()
    data = await redis.hgetall(f"session:{raw_id}")
    if not data:
        return None
    return data


async def get_current_user(coread_session: str | None = Cookie(default=None)) -> dict:
    if not coread_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    data = await get_session_data(coread_session)
    if not data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return data
