import io
import json
import logging
from datetime import datetime
from fastapi import UploadFile
from sqlalchemy.orm import Session
from pypdf import PdfReader
import docx
from app.models.user import User
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.providers.llm.factory import llm_factory

logger = logging.getLogger("uvicorn.error")

class ResumeParserService:

    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        lower = filename.lower()
        if lower.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
            return "\n".join(text_parts).strip()
        elif lower.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            text_parts = [p.text for p in doc.paragraphs if p.text]
            return "\n".join(text_parts).strip()
        else:
            return file_bytes.decode("utf-8", errors="ignore").strip()

    def process_and_save_resume(self, user: User, upload_file: UploadFile, file_bytes: bytes, db: Session) -> CandidateProfile:
        filename = upload_file.filename or "resume.pdf"
        raw_text = self.extract_text(file_bytes, filename)

        if not raw_text or not raw_text.strip():
            raise ValueError("Unable to extract text from the uploaded file. Please ensure the file is not empty or a scanned image.")

        # 1. Update or create Resume record
        resume = db.query(Resume).filter(Resume.user_id == user.id).first()
        if not resume:
            resume = Resume(user_id=user.id)
            db.add(resume)

        resume.filename = filename
        resume.content_type = upload_file.content_type
        resume.file_size = len(file_bytes)
        resume.raw_text = raw_text
        resume.uploaded_at = datetime.utcnow()
        db.flush()

        # 2. Parse via active LLM Context
        llm_ctx = llm_factory.resolve_active_context(user, db)
        parsed = llm_ctx.provider.parse_resume(
            raw_text,
            api_key=llm_ctx.decrypted_api_key,
            model_name=llm_ctx.model_name,
            base_url=llm_ctx.base_url
        )

        # 3. Update or create CandidateProfile record
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if not profile:
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)

        profile.resume_id = resume.id
        profile.candidate_name = parsed.candidateName or user.full_name
        profile.email = parsed.email or user.email
        profile.phone = parsed.phone
        profile.location = parsed.location or "India"
        profile.years_of_experience = parsed.yearsOfExperience or 1.0
        profile.highest_degree = parsed.highestDegree or "Bachelor's Degree"
        profile.summary = parsed.summary

        profile.skills_json = json.dumps(parsed.skills or ["Python", "FastAPI", "REST APIs"])
        profile.experience_json = json.dumps(parsed.experience or [])
        profile.education_json = json.dumps(parsed.education or [])
        profile.projects_json = json.dumps(parsed.projects or [])
        profile.preferred_roles_json = json.dumps(parsed.preferredRoles or ["Software Engineer", "Backend Developer"])
        profile.locations_json = json.dumps(parsed.locations or ["India", "Remote Worldwide"])
        profile.remote_preference_json = json.dumps(parsed.remotePreference or ["REMOTE", "HYBRID"])
        profile.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(profile)
        return profile

resume_parser_service = ResumeParserService()
