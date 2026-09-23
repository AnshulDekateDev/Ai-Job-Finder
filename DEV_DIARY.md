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

# 2. Start the Backend (Terminal 1)
cd backend
mvn spring-boot:run
# Backend is ready at http://localhost:8080

# 3. Start the Frontend (Terminal 2)
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
| **Java** | 17+ (or 11+) | 17.0.11 LTS | `java -version` |
| **Maven** | 3.8+ | 3.9.11 | `mvn -v` |
| **Node.js** | 18+ | 22.18.0 | `node -v` |
| **npm** | 9+ | 11.13.0 | `npm -v` |
| **Git** | 2.30+ | 2.45+ | `git --version` |

---

## 🗺️ 3. Project Architecture & Layout

```
Ai-Job-Finder/
├── DEV_DIARY.md              <-- THIS FILE (Your cross-device brain)
├── README.md                 <-- Public documentation & quickstart
├── backend/                  <-- Spring Boot 2.7.18 / Java 17
│   ├── pom.xml               <-- Dependencies (Security, JPA, PDFBox, POI, JSoup)
│   └── src/main/java/com/jobfinder/
│       ├── controller/       <-- AuthController, ResumeController, SettingsController, etc.
│       ├── service/          <-- AIService, ScraperService, ResumeParserService, EncryptionService
│       ├── model/            <-- User, ResumeData, Settings, JobApplication entities
│       └── security/         <-- JwtFilter, WebSecurityConfig
└── frontend/                 <-- React 18 + Vite (Vanilla CSS Glassmorphism)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx           <-- 3-phase flow router (Landing -> Auth -> Main App)
        ├── components/       <-- Navbar, LandingPage, AuthModal, ResumeUpload, JobSearch, etc.
        ├── styles/           <-- Modern dark/glassmorphic CSS stylesheets
        └── api/              <-- Axios / Fetch clients with JWT interceptors
```

---

## ⚙️ 4. Configuration & Database

- **Local Fallback**: H2 in-memory / local file database enabled by default if cloud credentials are not supplied.
- **Cloud Database**: Configured for **Supabase / Neon PostgreSQL** via environment variables in `application.properties`:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
- **Security**: AES-256-GCM encryption for all third-party API keys (Gemini, OpenAI, Anthropic, Scrape.do, ScraperAPI).

---

## 📊 5. Feature Status & Roadmap

| Feature Area | Status | Notes |
| :--- | :---: | :--- |
| **3-Phase App Flow** | ✅ Complete | Landing Page ➔ Auth Modal ➔ Main Dashboard |
| **Authentication UI & JWT** | ✅ Complete | Live validation, password meter, autofill prevention |
| **Database Integration** | ✅ Complete | Supabase PostgreSQL + local H2 fallback |
| **Section-Aware Resume Parser**| ✅ Complete | Apache PDFBox/POI extracting Skills, Exp, Edu, Projects |
| **Live AI Engine Status Banner**| ✅ Complete | Shows active AI provider on Resume page |
| **Settings & Encrypted API Keys**| ✅ Complete | AES-256-GCM encryption, Scrape.do & AI router |
| **Job Scraping Engine** | 🟡 In Progress | Integration with Greenhouse, Lever, RemoteOK, Scrape.do |
| **Hybrid Job Matching Algorithm**| 🟡 Next Up | 40% Skills, 20% Exp, 15% Title, 10% Loc, 5% Edu, 10% Proj |
| **AI Cover Letter Generator** | ⚪ Planned | Factual 150-250 word custom letter per application |
| **Job Application Tracker** | ⚪ Planned | Kanban / List view: Saved ➔ Applied ➔ Interview ➔ Offer |

---

## 📔 6. Chronological Dev Diary

### Entry #4 — 2026-09-23: Multi-Laptop Setup & Sync Protocol
- **Machine**: Laptop B (ASUS)
- **Work Completed**:
  - Cloned repository from GitHub (`AnshulDekateDev/Ai-Job-Finder`).
  - Verified local toolchain: Java 17.0.11, Maven 3.9.11, Node v22.18.0, npm 11.13.0.
  - Created `DEV_DIARY.md` to solve context loss when switching between laptops.
  - Outlined switch protocol and next priority backlog.
- **Current State**: Ready to launch dev servers or implement Job Scraper / Matching logic.
- **Next Task**: Verify frontend & backend run cleanly on Laptop B, then proceed with Job Search scrapers.

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
  - Initialized Spring Boot backend (Security, JWT, JPA) and React Vite frontend.
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
