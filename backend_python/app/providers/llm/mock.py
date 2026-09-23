from typing import Optional, Dict, Any
from app.providers.llm.base import BaseLLMProvider, MatchAnalysis, ParsedResumeResult

class MockDemoProvider(BaseLLMProvider):

    def get_provider_type(self) -> str:
        return "MOCK_DEMO"

    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        return True

    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        return "This is a demonstration response from the built-in Mock Demo AI engine."

    def parse_resume(self, resume_text: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> ParsedResumeResult:
        return ParsedResumeResult(
            candidateName="Anshul Dekate",
            email="anshul@example.com",
            phone="+91 98765 43210",
            location="Pune, India",
            yearsOfExperience=2.0,
            highestDegree="Bachelor of Engineering (Computer Science)",
            summary="Passionate Full-Stack & AI Software Engineer with experience in Python, FastAPI, Java, Spring Boot, React, and modern cloud architectures.",
            skills=["Python", "FastAPI", "Java", "Spring Boot", "React", "PostgreSQL", "Docker", "REST APIs", "Git"],
            experience=[
                {
                    "title": "Software Developer",
                    "company": "Tech Innovations",
                    "duration": "2023 - Present",
                    "description": "Architected high-throughput REST APIs and AI integrations.",
                    "skills": ["Python", "FastAPI", "PostgreSQL"]
                }
            ],
            education=[
                {
                    "degree": "B.E. in Computer Science",
                    "institution": "University of Technology",
                    "year": "2023"
                }
            ],
            projects=[
                {
                    "name": "AI Job Finder",
                    "description": "Automated multi-portal job scraper and hybrid matching engine.",
                    "technologies": ["Python", "FastAPI", "React", "Google Gemini"]
                }
            ],
            preferredRoles=["Python Developer", "Backend Engineer", "Full Stack Developer"],
            locations=["India", "Remote Worldwide"],
            remotePreference=["REMOTE", "HYBRID"]
        )

    def explain_match(self, profile: Dict[str, Any], job: Dict[str, Any], match_score: float, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> MatchAnalysis:
        cand_skills = set(profile.get("skills", []))
        job_skills = set(job.get("skills", []))
        matched = list(cand_skills & job_skills) or ["Python", "REST APIs"]
        missing = list(job_skills - cand_skills)[:3]

        return MatchAnalysis(
            matchSummary=f"High compatibility match with a {match_score:.1f}% alignment score. Core technical competencies strongly match the team's needs.",
            experienceSummary=f"Candidate's {profile.get('yearsOfExperience', 2.0)} years of engineering experience aligns well with the position level.",
            locationSummary=f"Candidate location and {job.get('remoteType', 'REMOTE')} work mode match seamlessly.",
            matchedSkills=matched,
            missingSkills=missing
        )

    def generate_cover_letter(self, profile: Dict[str, Any], job: Dict[str, Any], api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        name = profile.get("candidateName", "Applicant")
        title = job.get("title", "Software Engineer")
        company = job.get("company", "the hiring team")
        return f"""Dear Hiring Team at {company},

I am writing to express my strong enthusiasm for the {title} position. With my background in building resilient backend systems, scalable REST APIs, and modern web applications, I am eager to contribute to your engineering objectives.

In my recent projects, I have architected high-performance applications utilizing technologies like {', '.join(profile.get('skills', ['Python', 'FastAPI'])[:4])}. My hands-on experience solving complex data workflows and building user-centric software directly aligns with the technical goals required for this role.

I would welcome the opportunity to discuss how my technical skills and proactive problem-solving mindset can bring immediate value to {company}. Thank you for your time and consideration.

Sincerely,
{name}"""
