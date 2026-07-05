from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import UserProgress, ClubMembership, Club, User
from app.schemas import ProgressUpdate, MemberProgress
from app.auth import get_current_user

router = APIRouter(prefix="/api/clubs", tags=["progress"])


@router.get("/{club_id}/progress", response_model=list[MemberProgress])
async def get_progress(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify membership
    mem_result = await db.execute(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == current_user["user_id"],
        )
    )
    if not mem_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a club member")

    # Get club for total chapters
    club_result = await db.execute(
        select(Club).where(Club.id == club_id).options(selectinload(Club.book))
    )
    club = club_result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    total = max(club.book.total_chapters, 1)

    # All members
    members_result = await db.execute(
        select(ClubMembership)
        .where(ClubMembership.club_id == club_id)
        .options(selectinload(ClubMembership.user))
    )
    memberships = members_result.scalars().all()

    # Progress rows
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.club_id == club_id)
    )
    progress_map = {p.user_id: p.chapters_read for p in progress_result.scalars().all()}

    return [
        MemberProgress(
            user_id=m.user_id,
            name=m.user.name,
            avatar_url=m.user.avatar_url,
            chapters_read=progress_map.get(m.user_id, 0),
            percentage=round(progress_map.get(m.user_id, 0) / total * 100, 1),
        )
        for m in memberships
    ]


@router.put("/{club_id}/progress")
async def update_progress(
    club_id: str,
    payload: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.club_id == club_id,
            UserProgress.user_id == current_user["user_id"],
        )
    )
    progress = result.scalar_one_or_none()

    if progress:
        progress.chapters_read = payload.chapters_read
    else:
        progress = UserProgress(
            club_id=club_id,
            user_id=current_user["user_id"],
            chapters_read=payload.chapters_read,
        )
        db.add(progress)

    await db.commit()
    return {"ok": True, "chapters_read": payload.chapters_read}
