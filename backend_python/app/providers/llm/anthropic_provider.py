import json
import logging
from typing import Optional, Dict, Any
import anthropic
from app.providers.llm.base import BaseLLMProvider, MatchAnalysis, ParsedResumeResult

logger = logging.getLogger("uvicorn.error")

class AnthropicProvider(BaseLLMProvider):

    def get_provider_type(self) -> str:
        return "ANTHROPIC"

    def _get_client(self, api_key: str, base_url: Optional[str] = None) -> anthropic.Anthropic:
        return anthropic.Anthropic(api_key=api_key, base_url=base_url if base_url else None)

    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        try:
            client = self._get_client(api_key, base_url)
            model = model_name or "claude-3-5-sonnet-20241022"
            res = client.messages.create(
                model=model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return bool(res.content and len(res.content) > 0)
        except Exception as e:
            logger.error(f"Anthropic test connection failed: {e}")
            raise ValueError(f"Anthropic connection failed: {str(e)}")

    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        client = self._get_client(api_key, base_url)
        model = model_name or "claude-3-5-sonnet-20241022"
        res = client.messages.create(
            model=model,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        return res.content[0].text if res.content else ""

    def parse_resume(self, resume_text: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> ParsedResumeResult:
        client = self._get_client(api_key, base_url)
        model = model_name or "claude-3-5-sonnet-20241022"
        prompt = f"""
Extract resume details into valid JSON only:
{{
  "candidateName": "Name",
  "email": "email",
  "phone": "phone",
  "location": "location",
  "yearsOfExperience": 2.0,
  "highestDegree": "Degree",
  "summary": "Summary",
  "skills": ["Skill1"],
  "experience": [],
  "education": [],
  "projects": [],
  "preferredRoles": [],
  "locations": [],
  "remotePreference": []
}}

Resume:
{resume_text[:12000]}
"""
        res = client.messages.create(
            model=model,
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}]
        )
        text = res.content[0].text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        data = json.loads(text.strip())
        return ParsedResumeResult(**data)

    def explain_match(self, profile: Dict[str, Any], job: Dict[str, Any], match_score: float, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> MatchAnalysis:
        client = self._get_client(api_key, base_url)
        model = model_name or "claude-3-5-sonnet-20241022"
        prompt = f"""
Candidate: {profile}
Job: {job}
Score: {match_score:.1f}%

Return valid JSON with keys matchSummary, experienceSummary, locationSummary, matchedSkills, missingSkills.
"""
        res = client.messages.create(
            model=model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        text = res.content[0].text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        data = json.loads(text.strip())
        return MatchAnalysis(**data)

    def generate_cover_letter(self, profile: Dict[str, Any], job: Dict[str, Any], api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        client = self._get_client(api_key, base_url)
        model = model_name or "claude-3-5-sonnet-20241022"
        prompt = f"Write a tailored 150-250 word cover letter for candidate {profile} applying to {job}."
        res = client.messages.create(
            model=model,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        return res.content[0].text.strip()
