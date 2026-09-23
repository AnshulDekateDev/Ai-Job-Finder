from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class MatchAnalysis(BaseModel):
    matchSummary: str = ""
    experienceSummary: str = ""
    locationSummary: str = ""
    matchedSkills: List[str] = []
    missingSkills: List[str] = []

class ParsedResumeResult(BaseModel):
    candidateName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    yearsOfExperience: float = 0.0
    highestDegree: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    preferredRoles: List[str] = []
    locations: List[str] = []
    remotePreference: List[str] = []

class BaseLLMProvider(ABC):

    @abstractmethod
    def get_provider_type(self) -> str:
        pass

    @abstractmethod
    def test_connection(self, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    def generate(self, prompt: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def parse_resume(self, resume_text: str, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> ParsedResumeResult:
        pass

    @abstractmethod
    def explain_match(self, profile: Dict[str, Any], job: Dict[str, Any], match_score: float, api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> MatchAnalysis:
        pass

    @abstractmethod
    def generate_cover_letter(self, profile: Dict[str, Any], job: Dict[str, Any], api_key: str, model_name: Optional[str] = None, base_url: Optional[str] = None) -> str:
        pass
