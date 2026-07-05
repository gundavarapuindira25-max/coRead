from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Club, ClubMembership, Book
from app.schemas import ClubCreate, ClubOut, BookOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/clubs", tags=["clubs"])


async def _build_club_out(club: Club, db: AsyncSession) -> ClubOut:
    count_result = await db.execute(
        select(func.count()).where(ClubMembership.club_id == club.id)
    )
    member_count = count_result.scalar_one()
    return ClubOut(
        id=club.id,
        name=club.name,
        book=BookOut.model_validate(club.book),
        created_by=club.created_by,
        next_session=club.next_session,
        member_count=member_count,
        created_at=club.created_at,
    )


@router.get("", response_model=list[ClubOut])
async def my_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Club)
        .join(ClubMembership, ClubMembership.club_id == Club.id)
        .where(ClubMembership.user_id == current_user["user_id"])
        .options(selectinload(Club.book))
        .order_by(Club.created_at.desc())
    )
    clubs = result.scalars().all()
    return [await _build_club_out(c, db) for c in clubs]


@router.get("/browse", response_model=list[ClubOut])
async def browse_clubs(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Club)
        .options(selectinload(Club.book))
        .order_by(Club.created_at.desc())
        .limit(50)
    )
    clubs = result.scalars().all()
    return [await _build_club_out(c, db) for c in clubs]


@router.post("", response_model=ClubOut, status_code=status.HTTP_201_CREATED)
async def create_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify book exists
    book_result = await db.execute(select(Book).where(Book.id == payload.book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    club = Club(
        name=payload.name,
        book_id=payload.book_id,
        created_by=current_user["user_id"],
        next_session=payload.next_session,
    )
    db.add(club)
    await db.flush()

    # Auto-join creator as admin
    membership = ClubMembership(
        club_id=club.id,
        user_id=current_user["user_id"],
        is_admin=True,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(club)

    # reload with book
    result = await db.execute(
        select(Club).where(Club.id == club.id).options(selectinload(Club.book))
    )
    club = result.scalar_one()
    return await _build_club_out(club, db)


@router.get("/{club_id}", response_model=ClubOut)
async def get_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Club).where(Club.id == club_id).options(selectinload(Club.book))
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return await _build_club_out(club, db)


@router.post("/{club_id}/join", status_code=status.HTTP_201_CREATED)
async def join_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check club exists
    club_result = await db.execute(select(Club).where(Club.id == club_id))
    if not club_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Club not found")

    # Check already a member
    mem_result = await db.execute(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == current_user["user_id"],
        )
    )
    if mem_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already a member")

    membership = ClubMembership(club_id=club_id, user_id=current_user["user_id"])
    db.add(membership)
    await db.commit()
    return {"ok": True}


@router.delete("/{club_id}/leave", status_code=status.HTTP_200_OK)
async def leave_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    mem_result = await db.execute(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == current_user["user_id"],
        )
    )
    membership = mem_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member")

    # Prevent leaving if you're the only admin
    if membership.is_admin:
        admin_count_result = await db.execute(
            select(func.count()).where(
                ClubMembership.club_id == club_id,
                ClubMembership.is_admin == True,
            )
        )
        if admin_count_result.scalar_one() == 1:
            raise HTTPException(
                status_code=400,
                detail="You're the only admin. Transfer admin to another member or delete the club.",
            )

    await db.delete(membership)
    await db.commit()
    return {"ok": True}


@router.delete("/{club_id}", status_code=status.HTTP_200_OK)
async def delete_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    club_result = await db.execute(select(Club).where(Club.id == club_id))
    club = club_result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Only the original creator can delete
    if club.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the club creator can delete it")

    await db.delete(club)
    await db.commit()
    return {"ok": True}
