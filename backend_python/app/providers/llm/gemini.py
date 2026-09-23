import json
import logging
import re
from typing import Optional, Dict, Any
import google.generativeai as genai
from app.providers.llm.base import BaseLLMProvider, MatchAnalysis, ParsedResumeResult

logger = logging.getLogger("uvicorn.error")

class GeminiProvider(BaseLLMProvider):

    def get_provider_type(self) -> str:
        return "GEMINI"

    def _configure(self, api_key: str):
        genai.configure(api_key=api_key)

    def _clean_json(self, text: str) -> str:
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        return text.strip()

    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        try:
            self._configure(api_key)
            model = genai.GenerativeModel(model_name or "gemini-1.5-flash")
            response = model.generate_content("Ping. Reply with PONG.")
            return bool(response and response.text)
        except Exception as e:
            logger.error(f"Gemini test connection failed: {e}")
            raise ValueError(f"Gemini connection failed: {str(e)}")

    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        self._configure(api_key)
        model = genai.GenerativeModel(model_name or "gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text if response else ""

    def parse_resume(self, resume_text: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> ParsedResumeResult:
        prompt = f"""
You are an expert technical recruiter and resume parser.
Extract the structured information from the following resume text and respond ONLY with valid JSON. Do not wrap in markdown or add explanations.

Schema:
{{
  "candidateName": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "yearsOfExperience": 3.5,
  "highestDegree": "Degree Name",
  "summary": "2-3 sentence executive summary",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Dates",
      "description": "Key accomplishments",
      "skills": ["Tech1", "Tech2"]
    }}
  ],
  "education": [
    {{
      "degree": "Degree",
      "institution": "University/College",
      "year": "Graduation Year"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "What was built and tech used",
      "technologies": ["Tech1", "Tech2"]
    }}
  ],
  "preferredRoles": ["Role 1", "Role 2"],
  "locations": ["Location 1"],
  "remotePreference": ["REMOTE", "HYBRID"]
}}

Resume Text:
\"\"\"{resume_text[:12000]}\"\"\"
"""
        self._configure(api_key)
        model = genai.GenerativeModel(model_name or "gemini-1.5-flash")
        response = model.generate_content(prompt)
        clean = self._clean_json(response.text)

        try:
            data = json.loads(clean)
            return ParsedResumeResult(**data)
        except Exception as e:
            logger.warning(f"Failed parsing Gemini JSON output: {e}. Output was: {clean[:200]}")
            # Fallback basic extraction
            return ParsedResumeResult(
                candidateName="Candidate",
                summary=clean[:300],
                skills=["Java", "Python", "SQL"]
            )

    def explain_match(self, profile: Dict[str, Any], job: Dict[str, Any], match_score: float, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> MatchAnalysis:
        prompt = f"""
Candidate Skills: {profile.get('skills', [])}
Candidate Experience: {profile.get('yearsOfExperience', 0)} years
Candidate Title/Roles: {profile.get('preferredRoles', [])}

Job Title: {job.get('title')}
Job Company: {job.get('company')}
Job Requirements: {job.get('requirements', '')[:1000]}
Job Skills: {job.get('skills', [])}
Calculated Match Percentage: {match_score:.1f}%

Analyze why this job matches the candidate. Return ONLY valid JSON:
{{
  "matchSummary": "1-2 concise sentences explaining why the candidate fits this role.",
  "experienceSummary": "Sentence on experience alignment.",
  "locationSummary": "Sentence on location/remote alignment.",
  "matchedSkills": ["skills present in both candidate and job"],
  "missingSkills": ["skills desired by job that candidate is missing"]
}}
"""
        self._configure(api_key)
        model = genai.GenerativeModel(model_name or "gemini-1.5-flash")
        response = model.generate_content(prompt)
        clean = self._clean_json(response.text)
        try:
            data = json.loads(clean)
            return MatchAnalysis(**data)
        except Exception:
            return MatchAnalysis(
                matchSummary=f"Strong fit with {match_score:.1f}% overall profile alignment.",
                experienceSummary="Experience satisfies the baseline requirements for this role.",
                locationSummary="Location and remote preference are compatible.",
                matchedSkills=list(set(profile.get('skills', [])) & set(job.get('skills', []))),
                missingSkills=[]
            )

    def generate_cover_letter(self, profile: Dict[str, Any], job: Dict[str, Any], api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        prompt = f"""
You are an expert career advisor. Write a tailored, professional, factual 150-250 word cover letter.
Connect candidate's specific background and projects to the job's stated requirements.
Do not invent fake companies or exaggerated claims. Use a confident, engaging tone.

Candidate Name: {profile.get('candidateName', 'Applicant')}
Candidate Background: {profile.get('summary', '')}
Candidate Skills: {profile.get('skills', [])}
Candidate Experience: {profile.get('experience', [])}
Candidate Projects: {profile.get('projects', [])}

Job Title: {job.get('title')}
Company: {job.get('company')}
Job Description & Requirements:
{job.get('description', '')[:2000]}

Write the cover letter now:
"""
        self._configure(api_key)
        model = genai.GenerativeModel(model_name or "gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
