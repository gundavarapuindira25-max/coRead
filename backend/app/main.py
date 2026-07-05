from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.redis_client import close_redis
from app.limiter import limiter
from app.routers import auth, clubs, books, highlights, progress, messages


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


_docs_url = None if settings.environment == "production" else "/docs"
_redoc_url = None if settings.environment == "production" else "/redoc"

app = FastAPI(
    title="CoRead API",
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# Attach the shared limiter to app state — required by slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Cookie", "Authorization"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src * data:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "connect-src 'self';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(auth.router)
app.include_router(clubs.router)
app.include_router(books.router)
app.include_router(highlights.router)
app.include_router(progress.router)
app.include_router(messages.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
