import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.limiter import limiter
from app.models import Book
from app.schemas import BookCreate, BookOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("/search")
@limiter.limit("10/minute")
async def search_books(request: Request, q: str, _: dict = Depends(get_current_user)):
    if not q.strip():
        return []
    params = {"q": q, "maxResults": 10, "printType": "books"}
    if settings.google_books_api_key:
        params["key"] = settings.google_books_api_key

    async with httpx.AsyncClient() as client:
        resp = await client.get("https://www.googleapis.com/books/v1/volumes", params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        results.append({
            "google_book_id": item["id"],
            "title": info.get("title", "Unknown Title"),
            "author": ", ".join(info.get("authors", ["Unknown Author"])),
            "cover_url": info.get("imageLinks", {}).get("thumbnail"),
            "description": info.get("description", "")[:500] if info.get("description") else None,
            "page_count": info.get("pageCount"),
        })
    return results


@router.post("", response_model=BookOut)
async def add_book(
    payload: BookCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    if payload.google_book_id:
        result = await db.execute(select(Book).where(Book.google_book_id == payload.google_book_id))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    book = Book(**payload.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return book
