from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.limiter import limiter
from app.models import Highlight, HighlightLike, ClubMembership
from app.schemas import HighlightCreate, HighlightOut
from app.auth import get_current_user

router = APIRouter(tags=["highlights"])


async def _require_member(club_id: str, user_id: str, db: AsyncSession):
    result = await db.execute(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a club member")


@router.get("/api/clubs/{club_id}/highlights", response_model=list[HighlightOut])
async def get_highlights(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await _require_member(club_id, current_user["user_id"], db)

    result = await db.execute(
        select(Highlight)
        .where(Highlight.club_id == club_id)
        .options(selectinload(Highlight.user), selectinload(Highlight.likes))
        .order_by(Highlight.created_at.desc())
    )
    highlights = result.scalars().all()
    user_id = current_user["user_id"]

    return [
        HighlightOut(
            id=h.id,
            text=h.text,
            page_number=h.page_number,
            user_id=h.user_id,
            user_name=h.user.name,
            user_avatar=h.user.avatar_url,
            likes_count=len(h.likes),
            liked_by_me=any(like.user_id == user_id for like in h.likes),
            created_at=h.created_at,
        )
        for h in highlights
    ]


@router.post("/api/clubs/{club_id}/highlights", response_model=HighlightOut, status_code=201)
@limiter.limit("20/minute")
async def add_highlight(
    request: Request,
    club_id: str,
    payload: HighlightCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await _require_member(club_id, current_user["user_id"], db)

    highlight = Highlight(
        club_id=club_id,
        user_id=current_user["user_id"],
        text=payload.text,
        page_number=payload.page_number,
    )
    db.add(highlight)
    await db.commit()
    await db.refresh(highlight)

    result = await db.execute(
        select(Highlight)
        .where(Highlight.id == highlight.id)
        .options(selectinload(Highlight.user), selectinload(Highlight.likes))
    )
    highlight = result.scalar_one()
    return HighlightOut(
        id=highlight.id,
        text=highlight.text,
        page_number=highlight.page_number,
        user_id=highlight.user_id,
        user_name=highlight.user.name,
        user_avatar=highlight.user.avatar_url,
        likes_count=0,
        liked_by_me=False,
        created_at=highlight.created_at,
    )


@router.post("/api/highlights/{highlight_id}/like")
async def toggle_like(
    highlight_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Fix 1: Verify the highlight exists and the user is a member of its club
    highlight_result = await db.execute(
        select(Highlight).where(Highlight.id == highlight_id)
    )
    highlight = highlight_result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")

    await _require_member(highlight.club_id, current_user["user_id"], db)

    result = await db.execute(
        select(HighlightLike).where(
            HighlightLike.highlight_id == highlight_id,
            HighlightLike.user_id == current_user["user_id"],
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        liked = False
    else:
        db.add(HighlightLike(highlight_id=highlight_id, user_id=current_user["user_id"]))
        liked = True

    await db.commit()
    return {"liked": liked}
