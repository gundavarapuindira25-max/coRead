from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.limiter import limiter
from app.models import Message, ClubMembership
from app.schemas import MessageCreate, MessageOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/clubs", tags=["messages"])


async def _require_member(club_id: str, user_id: str, db: AsyncSession):
    result = await db.execute(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a club member")


@router.get("/{club_id}/messages", response_model=list[MessageOut])
async def get_messages(
    club_id: str,
    since: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await _require_member(club_id, current_user["user_id"], db)

    query = (
        select(Message)
        .where(Message.club_id == club_id)
        .options(selectinload(Message.user))
        .order_by(Message.created_at.asc())
    )

    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            query = query.where(Message.created_at > since_dt).limit(50)
        except ValueError:
            # Fix 3: malformed `since` falls back to the last 50 messages — never unbounded
            query = query.limit(50)
    else:
        query = query.limit(50)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        MessageOut(
            id=m.id,
            content=m.content,
            user_id=m.user_id,
            user_name=m.user.name,
            user_avatar=m.user.avatar_url,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/{club_id}/messages", response_model=MessageOut)
@limiter.limit("20/minute")
async def post_message(
    request: Request,
    club_id: str,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await _require_member(club_id, current_user["user_id"], db)

    msg = Message(
        club_id=club_id,
        user_id=current_user["user_id"],
        content=payload.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Reload with user
    result = await db.execute(
        select(Message).where(Message.id == msg.id).options(selectinload(Message.user))
    )
    msg = result.scalar_one()
    return MessageOut(
        id=msg.id,
        content=msg.content,
        user_id=msg.user_id,
        user_name=msg.user.name,
        user_avatar=msg.user.avatar_url,
        created_at=msg.created_at,
    )
