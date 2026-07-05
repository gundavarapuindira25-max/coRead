# CoRead — Security Fixes

Audit performed: May 13, 2026  
All fixes applied: May 13, 2026

---

## Issues & Status

| # | Severity | Issue | Location | Status |
|---|----------|-------|----------|--------|
| 1 | 🔴 HIGH | No membership check on `toggle_like` | `routers/highlights.py` | ✅ Fixed |
| 2 | 🟠 MEDIUM | No OAuth `state` parameter (login CSRF) | `routers/auth.py` | ✅ Fixed |
| 3 | 🟠 MEDIUM | `since` parse failure returns unbounded results | `routers/messages.py` | ✅ Fixed |
| 4 | 🟠 MEDIUM | No rate limiting on any endpoint | `main.py`, routers | ✅ Fixed |
| 5 | 🟠 MEDIUM | CORS allows all methods and headers | `main.py` | ✅ Fixed |
| 6 | 🟡 LOW | No input length limits on messages/highlights/clubs | `schemas.py` | ✅ Fixed |
| 7 | 🟡 LOW | No bounds on `chapters_read` or `page_number` | `schemas.py` | ✅ Fixed |
| 8 | 🟡 LOW | No Content Security Policy header | `main.py` | ✅ Fixed |
| 9 | 🟡 LOW | FastAPI `/docs` and `/redoc` exposed in production | `main.py` | ✅ Fixed |
| 10 | 🟡 LOW | `SECRET_KEY` defined but never used | `auth.py` | ✅ Fixed |
| 11 | 🟡 LOW | No session invalidation of prior sessions on login | `auth.py` | ✅ Fixed |
| 12 | 🟡 LOW | Unpinned frontend dependencies | `package.json` | ✅ Fixed |
| 13 | 🟡 LOW | `python-multipart` included unnecessarily | `requirements.txt` | ✅ Fixed |

---

## Fix Details

### Fix 1 — Membership check on `toggle_like` ✅
**File:** `backend/app/routers/highlights.py`  
**Problem:** Any authenticated user could like/unlike any highlight by ID without being a member of the club that highlight belongs to.  
**Fix:** Added a DB lookup to find the highlight's club, then called `_require_member` before allowing the like/unlike action. Returns 404 if the highlight doesn't exist, 403 if the user is not a club member.

```python
# Before — no membership check
@router.post("/api/highlights/{highlight_id}/like")
async def toggle_like(highlight_id: str, ...):
    result = await db.execute(select(HighlightLike).where(...))
    ...

# After — highlight fetched first, membership verified
@router.post("/api/highlights/{highlight_id}/like")
async def toggle_like(highlight_id: str, ...):
    highlight = await db.execute(select(Highlight).where(Highlight.id == highlight_id))
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    await _require_member(highlight.club_id, current_user["user_id"], db)
    ...
```

---

### Fix 2 — OAuth `state` parameter ✅
**File:** `backend/app/routers/auth.py`  
**Problem:** The Google OAuth redirect did not generate or validate a `state` parameter, enabling login CSRF attacks.  
**Fix:** `secrets.token_urlsafe(32)` generates a random state on `/api/auth/google`, stored in a short-lived (10 min) `httponly` cookie. The callback validates it with `secrets.compare_digest` before proceeding. The state cookie is deleted after successful validation.

```python
# /google — generate and store state
state = secrets.token_urlsafe(32)
redirect.set_cookie(key="coread_oauth_state", value=state, httponly=True, max_age=600)

# /google/callback — validate state
expected_state = request.cookies.get("coread_oauth_state")
if not expected_state or not secrets.compare_digest(expected_state, state):
    raise HTTPException(status_code=400, detail="Invalid OAuth state")
```

---

### Fix 3 — Unbounded results on malformed `since` ✅
**File:** `backend/app/routers/messages.py`  
**Problem:** A malformed `since` query param silently skipped the `.limit(50)` clause, returning the full message history.  
**Fix:** `.limit(50)` is now applied in all three code paths: valid `since`, missing `since`, and parse failure.

```python
# Before
if since:
    try:
        query = query.where(Message.created_at > since_dt)
    except ValueError:
        pass  # ← limit(50) never applied here
else:
    query = query.limit(50)

# After — limit applied in every branch
if since:
    try:
        query = query.where(Message.created_at > since_dt).limit(50)
    except ValueError:
        query = query.limit(50)  # fallback, still bounded
else:
    query = query.limit(50)
```

---

### Fix 4 — Rate limiting ✅
**Files:** `backend/app/main.py`, `backend/app/routers/books.py`, `backend/app/routers/messages.py`, `backend/app/routers/highlights.py`, `backend/requirements.txt`  
**Problem:** No rate limiting on any endpoint, enabling quota exhaustion and spam flooding.  
**Fix:** Added `slowapi==0.1.9` to requirements. Global default of 200 req/min per IP set in `main.py`. Tighter per-route limits on sensitive endpoints:

| Endpoint | Limit |
|----------|-------|
| `GET /api/books/search` | 10/minute |
| `POST /api/clubs/{id}/messages` | 20/minute |
| `POST /api/clubs/{id}/highlights` | 20/minute |
| All other routes | 200/minute (global default) |

---

### Fix 5 — CORS method and header restriction ✅
**File:** `backend/app/main.py`  
**Problem:** `allow_methods=["*"]` and `allow_headers=["*"]` were broader than necessary.  
**Fix:** Restricted to the methods and headers the app actually uses.

```python
# Before
allow_methods=["*"],
allow_headers=["*"],

# After
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Content-Type", "Cookie"],
```

---

### Fix 6 — Input length limits ✅
**File:** `backend/app/schemas.py`  
**Problem:** `MessageCreate.content`, `HighlightCreate.text`, and `ClubCreate.name` had no `max_length`, allowing multi-megabyte payloads.  
**Fix:** Added `Field(max_length=...)` constraints:

| Field | Limit |
|-------|-------|
| `MessageCreate.content` | 2,000 chars |
| `HighlightCreate.text` | 5,000 chars |
| `ClubCreate.name` | 100 chars |

---

### Fix 7 — Numeric field bounds ✅
**File:** `backend/app/schemas.py`  
**Problem:** `chapters_read` accepted negative numbers; `page_number` accepted negatives.  
**Fix:**
```python
chapters_read: int = Field(ge=0)          # non-negative
page_number: int | None = Field(default=None, ge=1)  # positive if provided
```

---

### Fix 8 — Content Security Policy header ✅
**File:** `backend/app/main.py`  
**Problem:** No CSP or other security headers were set.  
**Fix:** Added an HTTP middleware that sets the following headers on every response:

```
Content-Security-Policy: default-src 'self'; img-src * data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains  (production only)
```

---

### Fix 9 — Disable `/docs` and `/redoc` in production ✅
**File:** `backend/app/main.py`  
**Problem:** FastAPI's interactive API docs were publicly accessible in production.  
**Fix:** Conditionally set `docs_url` and `redoc_url` to `None` when `environment == "production"`.

```python
_docs_url = None if settings.environment == "production" else "/docs"
_redoc_url = None if settings.environment == "production" else "/redoc"
app = FastAPI(..., docs_url=_docs_url, redoc_url=_redoc_url)
```

---

### Fix 10 — `SECRET_KEY` wired up for session HMAC ✅
**File:** `backend/app/auth.py`  
**Problem:** `SECRET_KEY` was defined in config but never used — sessions were plain UUIDs with no integrity protection.  
**Fix:** Session tokens are now HMAC-SHA256 signed with `SECRET_KEY`. The token format is `{uuid}.{hmac}`. `get_session_data` verifies the signature before touching Redis, so forged or tampered tokens are rejected immediately.

```python
def _sign_session_id(raw_id: str) -> str:
    mac = hmac.new(settings.secret_key.encode(), raw_id.encode(), hashlib.sha256).hexdigest()
    return f"{raw_id}.{mac}"

def _verify_session_token(token: str) -> str | None:
    raw_id, provided_mac = token.rsplit(".", 1)
    expected_mac = hmac.new(settings.secret_key.encode(), raw_id.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_mac, provided_mac):
        return None
    return raw_id
```

---

### Fix 11 — Invalidate prior sessions on login ✅
**File:** `backend/app/auth.py`  
**Problem:** Old sessions for the same user were never invalidated, so a leaked token stayed valid for its full 7-day TTL.  
**Fix:** `create_session` now tracks all active session IDs per user in a Redis set (`user_sessions:{user_id}`). On new login, all previous sessions are deleted before the new one is created. `delete_session` (logout) also removes the session from the user's set.

---

### Fix 12 — Pin frontend dependencies ✅
**File:** `frontend/package.json`  
**Problem:** All frontend deps used `^` caret ranges, allowing silent minor/patch updates that could introduce vulnerabilities.  
**Fix:** Removed all `^` prefixes. All dependencies are now pinned to exact versions.

```json
// Before
"axios": "^1.7.9",
"react": "^18.3.1"

// After
"axios": "1.7.9",
"react": "18.3.1"
```

---

### Fix 13 — Remove `python-multipart` ✅
**File:** `backend/requirements.txt`  
**Problem:** `python-multipart` was included but the app only uses JSON bodies. Multipart parsing has had historical CVEs.  
**Fix:** Removed `python-multipart==0.0.19` from `requirements.txt`.

---

## Files Changed

| File | Fixes Applied |
|------|---------------|
| `backend/app/auth.py` | 10, 11 |
| `backend/app/main.py` | 4, 5, 8, 9 |
| `backend/app/schemas.py` | 6, 7 |
| `backend/app/routers/auth.py` | 2 |
| `backend/app/routers/highlights.py` | 1, 4 |
| `backend/app/routers/messages.py` | 3, 4 |
| `backend/app/routers/books.py` | 4 |
| `backend/requirements.txt` | 4, 13 |
| `frontend/package.json` | 12 |
