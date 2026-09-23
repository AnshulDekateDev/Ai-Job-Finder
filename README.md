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
