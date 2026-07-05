from datetime import datetime
from pydantic import BaseModel, Field


# ─── User ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


# ─── Book ─────────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    google_book_id: str | None = None
    title: str
    author: str
    cover_url: str | None = None
    description: str | None = None
    total_chapters: int = 20


class BookOut(BaseModel):
    id: str
    google_book_id: str | None
    title: str
    author: str
    cover_url: str | None
    description: str | None
    total_chapters: int

    model_config = {"from_attributes": True}


# ─── Club ─────────────────────────────────────────────────────────────────────

class ClubCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    book_id: str
    next_session: datetime | None = None


class ClubOut(BaseModel):
    id: str
    name: str
    book: BookOut
    created_by: str
    next_session: datetime | None
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Progress ────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    # Fix 7: chapters_read must be a non-negative integer
    chapters_read: int = Field(ge=0)


class MemberProgress(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None
    chapters_read: int
    percentage: float

    model_config = {"from_attributes": True}


# ─── Highlight ────────────────────────────────────────────────────────────────

class HighlightCreate(BaseModel):
    # Fix 6: limit highlight text length; Fix 7: page_number must be positive
    text: str = Field(min_length=1, max_length=5000)
    page_number: int | None = Field(default=None, ge=1)


class HighlightOut(BaseModel):
    id: str
    text: str
    page_number: int | None
    user_id: str
    user_name: str
    user_avatar: str | None
    likes_count: int
    liked_by_me: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Message ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    # Fix 6: limit message content length
    content: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: str
    content: str
    user_id: str
    user_name: str
    user_avatar: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
