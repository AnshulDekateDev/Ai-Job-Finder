# 📓 AI Job Finder — Developer Diary & Multi-Laptop Sync Guide

> **Purpose**: This diary keeps your project context, current progress, architectural decisions, and next steps in sync whenever you move between laptops. Because it is tracked in Git, running `git push` on one laptop and `git pull` on the other keeps your log seamlessly updated!

---

## ⚡ 1. The 30-Second Laptop Switch Protocol

### 📤 Before You Leave Laptop A (Save & Push)
Run these commands in your project folder before shutting down or switching:
```powershell
# 1. Check what you modified
git status

# 2. Add all changes (including this DEV_DIARY.md)
git add .

# 3. Commit with a meaningful message
git commit -m "Log: describe what you completed"

# 4. Push to GitHub
git push origin main
```

---

### 📥 When You Open Laptop B (Pull & Start)
Run these commands as soon as you open this laptop:
```powershell
# 1. Pull the latest commits and diary notes
git pull origin main

# 2. Start the Backend (Terminal 1 - Python FastAPI)
cd backend_python
.\.venv\Scripts\python run.py
# Backend is ready at http://localhost:8000
# Interactive Swagger API Docs at http://localhost:8000/docs

# 3. Start the Frontend (Terminal 2 - React Vite)
cd frontend
npm install    # (only if new dependencies were added)
npm run dev
# Frontend is ready at http://localhost:5173
```

---

## 🛠️ 2. Laptop Environment & Prerequisites

Ensure both machines have the required toolchain installed:

| Tool | Minimum Version | Tested Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.10+ | 3.12.1 | `python --version` |
| **Node.js** | 18+ | 22.18.0 | `node -v` |
| **npm** | 9+ | 11.13.0 | `npm -v` |
| **Git** | 2.30+ | 2.45+ | `git --version` |
| **Java (Optional legacy)** | 17+ | 17.0.11 LTS | `java -version` |

---

## 🗺️ 3. Project Architecture & Layout

```
Ai-Job-Finder/
├── DEV_DIARY.md              <-- THIS FILE (Your cross-device brain)
├── README.md                 <-- Public documentation & quickstart
├── backend_python/           <-- Python 3.12 + FastAPI + Native AI (Gemini, OpenAI, Claude)
│   ├── run.py                <-- Runner script (`python run.py`)
│   ├── requirements.txt
│   └── app/
│       ├── main.py           <-- FastAPI App, CORS, Lifespan
│       ├── config.py         <-- Environment variables & settings
│       ├── database.py       <-- Supabase PostgreSQL + SQLite fallback
│       ├── security/         <-- AES-256-GCM crypto, native bcrypt, JWT
│       ├── models/           <-- SQLAlchemy ORM models
│       ├── schemas/          <-- Pydantic v2 validation models
│       ├── providers/        <-- Native AI (Gemini, OpenAI, Claude) & Scrapers
│       ├── services/         <-- Resume parser, hybrid matching, job crawler
│       └── routers/          <-- Auth, Resume, Integrations, Jobs, Applications
├── backend/                  <-- Spring Boot 2.7.18 (Preserved safely for reference)
└── frontend/                 <-- React 18 + Vite (Vanilla CSS Glassmorphism)
    ├── package.json
    ├── vite.config.js        <-- Proxies `/api` -> http://localhost:8000
    └── src/
        ├── App.jsx           <-- 3-phase flow router (Landing -> Auth -> Main App)
        ├── components/       <-- Navbar, LandingPage, AuthModal, ResumeUpload, JobSearch, etc.
        ├── styles/           <-- Modern dark/glassmorphic CSS stylesheets
        └── api/              <-- Axios / Fetch clients with JWT interceptors
```

---

## ⚙️ 4. Configuration & Database

- **Local Fallback**: SQLite in-memory / local file database enabled by default if cloud credentials are not supplied.
- **Cloud Database**: Configured for **Supabase / Neon PostgreSQL** via environment variables in `app/config.py` or `.env`:
  - `DATABASE_URL`
- **Security**: AES-256-GCM encryption for all third-party API keys (Gemini, OpenAI, Anthropic, Scrape.do, ScraperAPI).

---

## 📊 5. Feature Status & Roadmap

| Feature Area | Status | Notes |
| :--- | :---: | :--- |
| **FastAPI Pure AI Rebuild**| ✅ Complete | 100% parity with React UI, Pydantic v2, AES-256-GCM |
| **3-Phase App Flow** | ✅ Complete | Landing Page ➔ Auth Modal ➔ Main Dashboard |
| **Authentication UI & JWT** | ✅ Complete | Live validation, password meter, autofill prevention |
| **Database Integration** | ✅ Complete | Supabase PostgreSQL + local SQLite fallback |
| **Section-Aware Resume Parser**| ✅ Complete | pypdf & python-docx extracting Skills, Exp, Edu, Projects |
| **Live AI Engine Status Banner**| ✅ Complete | Shows active AI provider on Resume page |
| **Settings & Encrypted API Keys**| ✅ Complete | AES-256-GCM encryption, Scrape.do & AI router |
| **Job Scraping Engine** | ✅ Complete | Parallel crawling: RemoteOK, WeWorkRemotely, Greenhouse |
| **Hybrid Job Matching Algorithm**| ✅ Complete | 40% Skills, 20% Exp, 15% Title, 10% Loc, 5% Edu, 10% Proj |
| **AI Cover Letter Generator** | ✅ Complete | Tailored 150-250 word custom letter per application |
| **Job Application Tracker** | ✅ Complete | Track status: Discovered ➔ Saved ➔ Applied ➔ Interview |

---

## 📔 6. Chronological Dev Diary

### Entry #5 — 2026-09-23: Complete Rebuild to Python (FastAPI) Pure AI Stack
- **Machine**: Laptop B (ASUS)
- **Work Completed**:
  - Rebuilt the entire backend from Java Spring Boot into **Python (FastAPI + Pydantic v2 + SQLAlchemy)**.
  - Implemented 100% binary-compatible AES-256-GCM encryption (`CryptoService`) with PBKDF2 HMAC-SHA256 key derivation.
  - Built Native AI Providers: Google Gemini (`google-generativeai`), OpenAI (`openai`), Anthropic (`anthropic`), and MockDemo fallback.
  - Implemented Resume Parser using `pypdf` and `python-docx` with structured LLM JSON extraction.
  - Built Hybrid Matching Engine (40% skills, 20% experience, 15% title, 10% location, 5% education, 10% projects) + LLM reasoning summaries.
  - Implemented parallel multi-source Job Search (RemoteOK API, WeWorkRemotely RSS, Greenhouse, Lever) with automatic deduplication.
  - Built Cover Letter generator and Application Tracker endpoints matching the exact contract in `frontend/src/api.js`.
  - Updated Vite proxy in `frontend/vite.config.js` to target port 8000.
  - Ran comprehensive automated test suite (`test_backend.py`) — **All tests PASSED with Exit Code 0**.
- **Current State**: FastAPI backend fully operational at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`. React frontend wired and ready.
- **Next Task**: Launch both servers for full end-to-end interactive demo in browser.

---

### Entry #4 — 2026-09-23: Multi-Laptop Setup & Sync Protocol
- **Machine**: Laptop B (ASUS)
- **Work Completed**:
  - Cloned repository from GitHub (`AnshulDekateDev/Ai-Job-Finder`).
  - Verified local toolchain: Java 17.0.11, Maven 3.9.11, Node v22.18.0, npm 11.13.0.
  - Created `DEV_DIARY.md` to solve context loss when switching between laptops.
  - Outlined switch protocol and next priority backlog.

---

### Entry #5 — 2026-09-24: Gemini 3.6 Upgrade & Live AI Resume Parser
- **Commits / Updates**:
  - Resolved `400 Bad Request` during resume upload caused by Google's deprecation of `gemini-1.5-flash` on API v1beta.
  - Upgraded model resolution in `gemini.py` to auto-fallback across active models: `gemini-3.6-flash` (recommended), `gemini-3.5-flash-lite`, and `gemini-flash-latest`.
  - Updated AI Settings dropdown with modern Gemini model versions.
  - Enforced real AI parsing requirement (disabled static mock fallbacks when an AI key is expected).
  - Added `POST /api/resume/reparse` endpoint and **"✨ Re-parse with AI"** button on the UI.
  - Verified live extraction with user's Gemini key on `Bhavesh_Wadhwani_Resume.pdf` (extracted Bhavesh Wadhwani, 4.5 yrs exp, 33 skills, 4 roles).
- **Current State**:
  - Live AI resume parsing working seamlessly with Google Gemini API.

---

### Entry #4 — 2026-09-23: FastAPI Rebuild & Resume Screen Fix
- **Commits / Updates**:
  - Rebuilt complete backend from Spring Boot Java to Python 3.12 + FastAPI under `backend_python/`.
  - Replaced legacy PostgreSQL Hibernate LOB OID references with actual JSON data via self-healing startup migration (`app/db_migration.py`).
  - Bulletproofed `parseList` across `ResumeUploadPage.jsx`, `JobCard.jsx`, `SettingsPage.jsx`, and `JobSearchPage.jsx`.
  - Added React `ErrorBoundary` in `frontend/src/components/common/ErrorBoundary.jsx` and wrapped main view to prevent black screen crashes.
- **Current State**:
  - Python FastAPI backend running at `http://localhost:8000` with Supabase PostgreSQL connection.
  - React Vite frontend running at `http://localhost:5173` with full Resume & Profile editing.

---

### Entry #3 — 2026-09-23: Resume Parser & AI Status Banner
- **Commits**: `272f4e7`, `21efa91`
- **Work Completed**:
  - Upgraded resume parsing to section-aware extraction using Apache PDFBox / POI.
  - Built comprehensive UI displaying parsed Experience, Projects, Education, and Skills.
  - Added live AI Engine Status Banner on the Resume Upload page reflecting configured AI provider.

---

### Entry #2 — 2026-09-23: Landing Page, Auth Modal & Autofill Fixes
- **Commits**: `6d9cec6`, `ad2e4f9`, `d2c9ad8`
- **Work Completed**:
  - Created hero Landing Page with dynamic preview.
  - Built tabbed Auth Modal (Login / Register) with live field validation and password strength bar.
  - Set up 3-phase flow: Unauthenticated users see Landing Page ➔ Click Login/Register ➔ Enters Dashboard.
  - Fixed annoying browser autofill bug on email/password fields.

---

### Entry #1 — 2026-09-23: Core Foundation & Database Connectivity
- **Commits**: `f1e19f0`, `74b7dea`, `9f33985`, `eb6f1b6`, `6f0937b`
- **Work Completed**:
  - Initialized Spring Boot backend and React Vite frontend.
  - Added Supabase / Neon PostgreSQL cloud database support with local fallback.
  - Implemented AES-256-GCM encryption for stored API keys.
  - Added Scrape.do scraper integration and settings authentication checks.

---

## 📝 7. Future Session Log Template (Copy & Paste for Next Sessions)

```markdown
### Entry #X — YYYY-MM-DD: [Short Title of Session]
- **Machine**: [Laptop A / Laptop B]
- **Work Completed**:
  - [Bullet 1]
  - [Bullet 2]
- **Challenges / Decisions**:
  - [Any bug encountered or architectural choice made]
- **Current State**: [e.g. Resume parser complete, starting Job Search UI]
- **Next Task for Next Session**: [What to do first when you sit down]
```
