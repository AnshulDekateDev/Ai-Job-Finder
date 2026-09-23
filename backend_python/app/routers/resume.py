from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.schemas.resume import CandidateProfileSchema, ProfileResponse
from app.security.auth import get_current_user
from app.services.resume_parser import resume_parser_service

router = APIRouter(prefix="/api/resume", tags=["Resume & Profile"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Please upload a valid non-empty file (PDF or DOCX)."}
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Uploaded file is empty."}
        )

    try:
        profile = resume_parser_service.process_and_save_resume(current_user, file, content, db)
        return {
            "message": "Resume uploaded and processed successfully",
            "profile": CandidateProfileSchema.model_validate(profile)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": str(e)}
        )

@router.get("/profile")
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()

    return {
        "hasResume": bool(resume),
        "resumeFilename": resume.filename if resume else None,
        "profile": CandidateProfileSchema.model_validate(profile) if profile else None
    }

@router.put("/profile")
def update_candidate_profile(
    req: CandidateProfileSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    if req.candidateName is not None: profile.candidate_name = req.candidateName
    if req.email is not None: profile.email = req.email
    if req.phone is not None: profile.phone = req.phone
    if req.location is not None: profile.location = req.location
    if req.yearsOfExperience is not None: profile.years_of_experience = req.yearsOfExperience
    if req.highestDegree is not None: profile.highest_degree = req.highestDegree
    if req.summary is not None: profile.summary = req.summary

    if req.skillsJson is not None: profile.skills_json = req.skillsJson
    if req.experienceJson is not None: profile.experience_json = req.experienceJson
    if req.educationJson is not None: profile.education_json = req.educationJson
    if req.projectsJson is not None: profile.projects_json = req.projectsJson
    if req.preferredRolesJson is not None: profile.preferred_roles_json = req.preferredRolesJson
    if req.locationsJson is not None: profile.locations_json = req.locationsJson
    if req.remotePreferenceJson is not None: profile.remote_preference_json = req.remotePreferenceJson

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return CandidateProfileSchema.model_validate(profile)
