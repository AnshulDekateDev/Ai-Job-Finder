from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.schemas.jobs import JobItem
from app.schemas.application import ApplicationRecordRequest, ApplicationResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.updated_at.desc()).all()

    results = []
    for a in apps:
        results.append(
            ApplicationResponse(
                id=a.id,
                job=JobItem.model_validate(a.job),
                status=a.status,
                originalApplicationUrl=a.original_application_url,
                notes=a.notes,
                appliedAt=a.applied_at,
                updatedAt=a.updated_at
            )
        )
    return results

@router.post("/jobs/{jobId}/apply", response_model=ApplicationResponse)
def record_application(
    jobId: int,
    body: Optional[ApplicationRecordRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == jobId).first()
    if not job:
        raise HTTPException(status_code=404, detail={"error": "Job not found"})

    status_val = body.status if body and body.status else "APPLICATION_STARTED"
    notes_val = body.notes if body else None

    app_record = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == jobId
    ).first()

    if not app_record:
        app_record = Application(
            user_id=current_user.id,
            job_id=jobId,
            status=status_val,
            original_application_url=job.application_url
        )
        db.add(app_record)

    app_record.status = status_val
    if notes_val is not None:
        app_record.notes = notes_val
    if status_val == "APPLIED" and not app_record.applied_at:
        app_record.applied_at = datetime.utcnow()
    app_record.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(app_record)

    return ApplicationResponse(
        id=app_record.id,
        job=JobItem.model_validate(job),
        status=app_record.status,
        originalApplicationUrl=app_record.original_application_url,
        notes=app_record.notes,
        appliedAt=app_record.applied_at,
        updatedAt=app_record.updated_at
    )
