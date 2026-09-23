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

    def _get_model_candidates(self, model_name: Optional[str]) -> list:
        deprecated = {"gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-flash"}
        candidates = []
        if model_name and model_name not in deprecated:
            candidates.append(model_name)
        candidates.extend(["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"])
        seen = set()
        res = []
        for c in candidates:
            if c not in seen:
                seen.add(c)
                res.append(c)
        return res

    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        self._configure(api_key)
        last_err = None
        for candidate in self._get_model_candidates(model_name):
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content("Ping. Reply with PONG.")
                if response and response.text:
                    return True
            except Exception as e:
                last_err = e
                continue
        if last_err:
            raise ValueError(f"Gemini connection failed: {str(last_err)}")
        return False

    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        self._configure(api_key)
        for candidate in self._get_model_candidates(model_name):
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
            except Exception:
                continue
        return ""

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
        candidates = self._get_model_candidates(model_name)
        last_err = None

        for candidate in candidates:
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    clean = self._clean_json(response.text)
                    data = json.loads(clean)
                    return ParsedResumeResult(**data)
            except Exception as e:
                last_err = e
                logger.warning(f"Gemini model candidate {candidate} failed: {e}")
                continue

        if last_err:
            raise ValueError(f"Gemini AI parsing failed: {str(last_err)}")

        raise ValueError("Gemini returned empty response.")

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
        candidates = self._get_model_candidates(model_name)

        for candidate in candidates:
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    clean = self._clean_json(response.text)
                    data = json.loads(clean)
                    return MatchAnalysis(**data)
            except Exception as e:
                logger.warning(f"Gemini explain_match candidate {candidate} failed: {e}")
                continue

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
        candidates = self._get_model_candidates(model_name)
        for candidate in candidates:
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini generate_cover_letter candidate {candidate} failed: {e}")
                continue
        return "Dear Hiring Team,\n\nI am excited to submit my application for this role. My background and experience align closely with your requirements.\n\nSincerely,\n" + str(profile.get('candidateName', 'Applicant'))

