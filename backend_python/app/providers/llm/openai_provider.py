import json
import logging
from typing import Optional, Dict, Any
from openai import OpenAI
from app.providers.llm.base import BaseLLMProvider, MatchAnalysis, ParsedResumeResult

logger = logging.getLogger("uvicorn.error")

class OpenAIProvider(BaseLLMProvider):

    def get_provider_type(self) -> str:
        return "OPENAI"

    def _get_client(self, api_key: str, base_url: Optional[str] = None) -> OpenAI:
        return OpenAI(api_key=api_key, base_url=base_url if base_url else None)

    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        try:
            client = self._get_client(api_key, base_url)
            model = model_name or "gpt-4o-mini"
            res = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            return bool(res.choices and res.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI test connection failed: {e}")
            raise ValueError(f"OpenAI connection failed: {str(e)}")

    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        client = self._get_client(api_key, base_url)
        model = model_name or "gpt-4o-mini"
        res = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return res.choices[0].message.content or ""

    def parse_resume(self, resume_text: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> ParsedResumeResult:
        client = self._get_client(api_key, base_url)
        model = model_name or "gpt-4o-mini"
        prompt = f"""
Extract the candidate's resume information into structured JSON:
{{
  "candidateName": "Full Name",
  "email": "email",
  "phone": "phone",
  "location": "location",
  "yearsOfExperience": 3.0,
  "highestDegree": "Degree",
  "summary": "Executive summary",
  "skills": ["Skill1", "Skill2"],
  "experience": [{{"title": "Title", "company": "Company", "duration": "Duration", "description": "Description", "skills": []}}],
  "education": [{{"degree": "Degree", "institution": "School", "year": "Year"}}],
  "projects": [{{"name": "Project", "description": "Description", "technologies": []}}],
  "preferredRoles": ["Role 1"],
  "locations": ["Location"],
  "remotePreference": ["REMOTE", "HYBRID"]
}}

Resume:
{resume_text[:12000]}
"""
        res = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional resume parser. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(res.choices[0].message.content)
        return ParsedResumeResult(**data)

    def explain_match(self, profile: Dict[str, Any], job: Dict[str, Any], match_score: float, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> MatchAnalysis:
        client = self._get_client(api_key, base_url)
        model = model_name or "gpt-4o-mini"
        prompt = f"""
Candidate: {profile}
Job: {job}
Score: {match_score:.1f}%

Explain the match in JSON:
{{
  "matchSummary": "Why candidate matches",
  "experienceSummary": "Experience alignment",
  "locationSummary": "Location alignment",
  "matchedSkills": ["skills matching"],
  "missingSkills": ["skills missing"]
}}
"""
        res = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a talent acquisition specialist. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(res.choices[0].message.content)
        return MatchAnalysis(**data)

    def generate_cover_letter(self, profile: Dict[str, Any], job: Dict[str, Any], api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        client = self._get_client(api_key, base_url)
        model = model_name or "gpt-4o-mini"
        prompt = f"""
Write a 150-250 word personalized, factual cover letter connecting candidate qualifications to job requirements:
Candidate: {profile}
Job: {job}
"""
        res = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        return res.choices[0].message.content.strip()
