from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job, SavedJob
from app.models.cover_letter import CoverLetter
from app.schemas.jobs import (
    JobSearchQuery, JobItem, SearchResultResponse
)
from app.schemas.application import SavedJobResponse
from app.security.auth import get_current_user
from app.services.job_search import job_search_service
from app.services.cover_letter import cover_letter_service

router = APIRouter(prefix="/api/jobs", tags=["Jobs & Search"])

@router.post("/search", response_model=SearchResultResponse)
async def search_jobs(
    query: Optional[JobSearchQuery] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    response = await job_search_service.execute_search(current_user, query, db)
    return response

@router.get("/saved", response_model=List[SavedJobResponse])
def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_entries = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id
    ).order_by(SavedJob.saved_at.desc()).all()

    results = []
    for s in saved_entries:
        results.append(
            SavedJobResponse(
                id=s.id,
                job=JobItem.model_validate(s.job),
                notes=s.notes,
                savedAt=s.saved_at
            )
        )
    return results

@router.get("/{id}", response_model=JobItem)
def get_job_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail={"error": f"Job not found with id: {id}"})
    return JobItem.model_validate(job)

@router.post("/{id}/cover-letter")
def generate_cover_letter(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        letter = cover_letter_service.generate_cover_letter(current_user, id, db)
        return {
            "id": letter.id,
            "generatedContent": letter.generated_content,
            "userEditedContent": letter.user_edited_content,
            "modelUsed": letter.model_used,
            "wordCount": letter.word_count,
            "createdAt": letter.created_at,
            "updatedAt": letter.updated_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})

@router.put("/cover-letters/{id}")
def update_cover_letter(
    id: int,
    body: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = body.get("content", "")
    try:
        letter = cover_letter_service.update_cover_letter(current_user, id, content, db)
        return {
            "id": letter.id,
            "generatedContent": letter.generated_content,
            "userEditedContent": letter.user_edited_content,
            "modelUsed": letter.model_used,
            "wordCount": letter.word_count,
            "updatedAt": letter.updated_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})

@router.post("/{id}/save")
def toggle_save_job(
    id: int,
    body: Optional[Dict[str, str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail={"error": "Job not found"})

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False, "jobId": id}
    else:
        notes = body.get("notes") if body else None
        saved = SavedJob(user_id=current_user.id, job_id=id, notes=notes)
        db.add(saved)
        db.commit()
        return {"saved": True, "jobId": id}
