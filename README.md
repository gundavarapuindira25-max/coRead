# CoRead — Collaborative Book Club App

React + FastAPI + PostgreSQL (Supabase) + Redis (Upstash) + Google OAuth 2.0
Deployed on Render (both frontend and backend).

---

## Project Structure

```
CoRead/
├── backend/           # FastAPI API
├── frontend/          # React + Vite
├── render.yaml        # Render deploy config (both services)
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase project (free at supabase.com)
- An Upstash Redis database (free at upstash.com)
- A Google Cloud project with OAuth 2.0 credentials

---

### Step 1 — Supabase (PostgreSQL)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Dashboard → SQL Editor → New Query
3. Paste and run the contents of `backend/migrations/001_init.sql`
4. Settings → Database → copy the **Connection string** (URI format)
   - Change `postgresql://` to `postgresql+asyncpg://` in your `.env`

### Step 2 — Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) → Create Database → choose region
2. Copy the **Redis URL** (starts with `rediss://`)

### Step 3 — Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URIs:
   - Local: `http://localhost:8000/api/auth/google/callback`
   - Production: `https://your-api.onrender.com/api/auth/google/callback`
5. Copy Client ID and Client Secret

### Step 4 — Google Books API (optional, for book search)

1. APIs & Services → Library → search "Books API" → Enable
2. Credentials → API Key → copy it
3. If omitted, search still works but at lower rate limits

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your actual values:
#   DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[ref].supabase.co:5432/postgres
#   REDIS_URL=rediss://default:[password]@[host].upstash.io:6380
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...
#   GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
#   FRONTEND_URL=http://localhost:5173
#   SECRET_KEY=any-random-string-32-chars
#   GOOGLE_BOOKS_API_KEY=...   (optional)
#   ENVIRONMENT=development

# Run the server
uvicorn app.main:app --reload
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
#   VITE_API_URL=      

# Run dev server
npm run dev
# App runs at http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:8000` automatically.

---

## Deployment on Render

### One-time setup

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo → Render reads `render.yaml` and creates both services

### Configure environment variables

In Render Dashboard for **coread-api** (backend), set:
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` (Supabase) |
| `REDIS_URL` | `rediss://...` (Upstash) |
| `GOOGLE_CLIENT_ID` | from Google Console |
| `GOOGLE_CLIENT_SECRET` | from Google Console |
| `GOOGLE_REDIRECT_URI` | `https://coread-api.onrender.com/api/auth/google/callback` |
| `FRONTEND_URL` | `https://coread-app.onrender.com` |
| `SECRET_KEY` | run `openssl rand -hex 32` |
| `GOOGLE_BOOKS_API_KEY` | from Google Console (optional) |

In Render Dashboard for **coread-app** (frontend), set:
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://coread-api.onrender.com` |

### Update Google OAuth redirect URI
Add `https://coread-api.onrender.com/api/auth/google/callback` to your Google OAuth authorized redirect URIs.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/google` | Redirect to Google login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/clubs` | My clubs |
| GET | `/api/clubs/browse` | All clubs |
| POST | `/api/clubs` | Create club |
| POST | `/api/clubs/{id}/join` | Join club |
| GET | `/api/books/search?q=` | Search Google Books |
| POST | `/api/books` | Add book to DB |
| GET | `/api/clubs/{id}/messages` | Get messages (polling) |
| POST | `/api/clubs/{id}/messages` | Send message |
| GET | `/api/clubs/{id}/highlights` | Get highlights |
| POST | `/api/clubs/{id}/highlights` | Add highlight |
| POST | `/api/highlights/{id}/like` | Toggle like |
| GET | `/api/clubs/{id}/progress` | Member progress |
| PUT | `/api/clubs/{id}/progress` | Update my progress |

Full interactive docs at `http://localhost:8000/docs` when running locally.
