# AI Job Finder 🚀
> **User-Configurable AI Job Search & Matching Engine**

A full-stack application where the end user configures AI providers (Google Gemini, OpenAI, Anthropic), Scraper providers (ScraperAPI, Bright Data, Apify), and Job Portals (Greenhouse, Lever, RemoteOK, We Work Remotely, Google Jobs, Custom Websites) entirely through the UI.

---

## 🌟 Key Features
- **Zero Hardcoded Secrets**: All API keys are configured in the Settings UI and encrypted at rest with AES-256-GCM.
- **Dynamic Provider Routers**: Google Gemini (`gemini-1.5-flash`), OpenAI, Anthropic Claude, and fallback support.
- **Hybrid Matching Engine**: Transparent weighted scoring (Skills 40%, Experience 20%, Title 15%, Location 10%, Education 5%, Projects 10%) + AI explanations.
- **Resume & Document Parser**: Upload PDF/DOCX to extract skills, work history, and education.
- **AI Cover Letter Generator**: Factual 150–250 word personalized cover letters matching candidate resume details to job requirements.
- **Application & Saved Jobs Tracker**: Track submissions across stages from Started to Interview.

---

## 🛠️ Tech Stack
- **Backend**: Java 11 / 17, Spring Boot 2.7.18, Spring Security, JWT, Spring Data JPA, H2 / PostgreSQL, Apache PDFBox, Apache POI, JSoup.
- **Frontend**: React 18, Vite, Lucide Icons, Modern Glassmorphism CSS Design System.

---

## 💻 How to Run on Any Computer (Office / Home Laptop)

### Prerequisites
- **Java**: JDK 11 or higher
- **Maven**: 3.8+
- **Node.js**: v18+ & npm

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd "ai job finder"
```

### 2. Start the Backend
```bash
cd backend
mvn spring-boot:run
```
> The backend server starts at **http://localhost:8080**

### 3. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The frontend web app opens at **http://localhost:5173**

---

## 🔒 Security & Privacy
API keys entered in the UI are encrypted before storage and masked in the UI (`••••••••••••••••9F82`). They are only decrypted backend-side when dispatching provider queries.
