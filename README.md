# AI Job Finder 🚀
> **User-Configurable AI Job Search & Matching Engine**

A full-stack application where the end user configures AI providers (Google Gemini, OpenAI, Anthropic), Scraper providers (Scrape.do, ScraperAPI), and Job Portals (Greenhouse, Lever, RemoteOK, We Work Remotely, Google Jobs, Custom Websites) entirely through the UI.

---

## 🌟 Key Features
- **Zero Hardcoded Secrets**: All API keys are configured in the Settings UI and encrypted at rest with AES-256-GCM.
- **Dynamic Provider Routers**: Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), Anthropic Claude (`claude-3-5-sonnet`), and MockDemo fallback.
- **Hybrid Matching Engine**: Transparent weighted scoring (Skills 40%, Experience 20%, Title 15%, Location 10%, Education 5%, Projects 10%) + AI explanations.
- **Resume & Document Parser**: Upload PDF/DOCX to extract skills, work history, projects, and education.
- **AI Cover Letter Generator**: Factual 150–250 word personalized cover letters matching candidate resume details to job requirements.
- **Application & Saved Jobs Tracker**: Track submissions across stages from Started to Interview.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL (Supabase) / SQLite, pypdf, python-docx, BeautifulSoup4, httpx.
- **Frontend**: React 18, Vite, Lucide Icons, Modern Glassmorphism CSS Design System.

---

## 💻 How to Run on Any Computer (Office / Home Laptop)

### Prerequisites
- **Python**: 3.10+ (Tested on 3.12)
- **Node.js**: v18+ & npm

### 1. Clone the repository
```bash
git clone https://github.com/AnshulDekateDev/Ai-Job-Finder.git
cd "Ai-Job-Finder"
```

### 2. Start the Backend (FastAPI)
```bash
cd backend_python
# Create virtual environment if first time
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

# Run server
.\.venv\Scripts\python run.py
```
> The backend server starts at **http://localhost:8000**  
> Interactive Swagger API docs are at **http://localhost:8000/docs**

### 3. Start the Frontend (React + Vite)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The frontend web app opens at **http://localhost:5173**

---

## 🔒 Security & Privacy
API keys entered in the UI are encrypted before storage with AES-256-GCM and masked in the UI (`••••••••••••••••9F82`). They are only decrypted backend-side in memory when dispatching provider queries.

---

## 🔐 Authentication Setup (Supabase Auth)

The application uses **Supabase Auth** for identity and session management, while storing application data in Supabase PostgreSQL (with resilient local SQLite fallback for offline development).

```
React / Vite  ──(Supabase Client)──▶  Supabase Auth (auth.users)
     │                                        │
     ▼                                        ▼ (Supabase JWT)
Protected Routes & Client State      FastAPI Backend
                                              │
                                              ▼ (Verify JWT & Map UUID)
                                     SQLAlchemy ORM (User-Isolated Data)
```

### 1. Supabase Dashboard Checklist

1. **Create / Open Supabase Project**: Go to [supabase.com](https://supabase.com) and navigate to your project dashboard (`pkhvagsatjfgjjtqzicy`).
2. **Enable Email Provider**:
   * In the left sidebar, navigate to **Authentication** ➔ **Providers**.
   * Ensure **Email** is toggled **ON**.
   * *(Optional)* If you want users to log in immediately without waiting for confirmation emails, turn off **"Confirm email"** under Email Auth settings.
3. **Configure Redirect URLs**:
   * Navigate to **Authentication** ➔ **URL Configuration**.
   * Set **Site URL** to: `http://localhost:5173`
   * Add to **Redirect URLs**:
     * `http://localhost:5173/*`
     * `http://localhost:5173/#reset-password`
4. **Retrieve API Keys**:
   * Navigate to **Project Settings** (gear icon) ➔ **API**.
   * Copy the **Project URL** (`https://pkhvagsatjfgjjtqzicy.supabase.co`).
   * Copy the **`anon` `public`** key (safe for browser exposure).
   * Copy the **`JWT Secret`** under **JWT Settings** (keep this secret on backend only!).

### 2. Public vs. Secret Keys Reference

| Key Name | Location | Exposure | Purpose |
| :--- | :--- | :--- | :--- |
| **`VITE_SUPABASE_URL`** | `frontend/.env` | 🟢 Public | Supabase API endpoint URL |
| **`VITE_SUPABASE_ANON_KEY`** | `frontend/.env` | 🟢 Public | Client-side anon key used by browser to interact with Auth |
| **`SUPABASE_URL`** | `backend_python/.env` | 🟡 Backend | Server-side Supabase verification URL |
| **`SUPABASE_ANON_KEY`** | `backend_python/.env` | 🟡 Backend | Server-side auth client key |
| **`SUPABASE_JWT_SECRET`** | `backend_python/.env` | 🔴 **Strictly Secret** | Signs & validates HS256 tokens locally in FastAPI |
| **`SUPABASE_SERVICE_ROLE_KEY`** | *Never in frontend* | 🔴 **Strictly Secret** | Bypasses RLS. Do NOT expose to client bundles! |

### 3. Environment Configuration

#### Frontend (`frontend/.env`)
Create `frontend/.env` (see `frontend/.env.example`):
```ini
VITE_SUPABASE_URL=https://pkhvagsatjfgjjtqzicy.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

#### Backend (`backend_python/.env`)
Create `backend_python/.env` (see `backend_python/.env.example`):
```ini
PORT=8000
HOST=0.0.0.0
DEBUG=True

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.pkhvagsatjfgjjtqzicy.supabase.co:5432/postgres?sslmode=require
SQLITE_FALLBACK_URL=sqlite:///./jobfinder.db

SUPABASE_URL=https://pkhvagsatjfgjjtqzicy.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here

MASTER_ENCRYPTION_KEY=AiJobFinderMasterSecretKey2026Secure256BitSalt!!
```

### 4. Running the Application

1. **Start Backend**:
   ```bash
   cd backend_python
   .\.venv\Scripts\python run.py
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Register & Log In**:
   * Open `http://localhost:5173/`.
   * Unauthenticated visitors accessing `/resume` or `/search` are automatically guarded and redirected to `/login`.
   * Sign In or Register with your email and password.
   * Session persists automatically across browser refreshes.
   * All user data (resumes, credentials, saved jobs, applications) is strictly isolated to the authenticated user.

