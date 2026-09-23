import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.models.cover_letter import CoverLetter
from app.providers.llm.factory import llm_factory

class CoverLetterService:

    def generate_cover_letter(self, user: User, job_id: int, db: Session) -> CoverLetter:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job not found with id: {job_id}")

        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if not profile:
            profile = CandidateProfile(
                user_id=user.id,
                candidate_name=user.full_name,
                email=user.email,
                skills_json=json.dumps(["Python", "FastAPI", "React", "REST APIs"])
            )
            db.add(profile)
            db.commit()

        # Parse profile fields for LLM prompt
        profile_dict = {
            "candidateName": profile.candidate_name or user.full_name,
            "summary": profile.summary or "Experienced software engineer",
            "skills": json.loads(profile.skills_json) if profile.skills_json else [],
            "experience": json.loads(profile.experience_json) if profile.experience_json else [],
            "projects": json.loads(profile.projects_json) if profile.projects_json else []
        }

        job_dict = {
            "title": job.title,
            "company": job.company or "the engineering team",
            "description": job.description or job.requirements or ""
        }

        llm_ctx = llm_factory.resolve_active_context(user, db)
        content = llm_ctx.provider.generate_cover_letter(
            profile_dict,
            job_dict,
            api_key=llm_ctx.decrypted_api_key,
            model_name=llm_ctx.model_name,
            base_url=llm_ctx.base_url
        )

        # Check existing cover letter for this user and job
        existing = db.query(CoverLetter).filter(
            CoverLetter.user_id == user.id,
            CoverLetter.job_id == job.id
        ).first()

        if not existing:
            existing = CoverLetter(user_id=user.id, job_id=job.id)
            db.add(existing)

        existing.generated_content = content
        existing.user_edited_content = content
        existing.model_used = llm_ctx.model_name or llm_ctx.provider_type
        existing.word_count = len(content.split())
        existing.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(existing)
        return existing

    def update_cover_letter(self, user: User, cover_letter_id: int, content: str, db: Session) -> CoverLetter:
        letter = db.query(CoverLetter).filter(
            CoverLetter.id == cover_letter_id,
            CoverLetter.user_id == user.id
        ).first()
        if not letter:
            raise ValueError(f"Cover letter not found with id: {cover_letter_id}")

        letter.user_edited_content = content
        letter.word_count = len(content.split())
        letter.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(letter)
        return letter

cover_letter_service = CoverLetterService()
