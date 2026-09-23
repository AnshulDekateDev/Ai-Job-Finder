from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.search_preference import SearchPreference
from app.schemas.search_preference import SearchPreferenceSchema
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/search-preferences", tags=["Search Preferences"])

@router.get("", response_model=SearchPreferenceSchema)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(SearchPreference).filter(SearchPreference.user_id == current_user.id).first()
    if not pref:
        pref = SearchPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return SearchPreferenceSchema.model_validate(pref)

@router.put("", response_model=SearchPreferenceSchema)
def update_preferences(
    req: SearchPreferenceSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(SearchPreference).filter(SearchPreference.user_id == current_user.id).first()
    if not pref:
        pref = SearchPreference(user_id=current_user.id)
        db.add(pref)

    if req.targetTitlesJson is not None: pref.target_titles_json = req.targetTitlesJson
    if req.targetLocationsJson is not None: pref.target_locations_json = req.targetLocationsJson
    if req.countriesJson is not None: pref.countries_json = req.countriesJson
    if req.workModesJson is not None: pref.work_modes_json = req.workModesJson
    if req.experienceRange is not None: pref.experience_range = req.experienceRange
    if req.minMatchPercentage is not None: pref.min_match_percentage = req.minMatchPercentage
    if req.maxResults is not None: pref.max_results = req.maxResults
    if req.selectedSourcesJson is not None: pref.selected_sources_json = req.selectedSourcesJson

    pref.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pref)

    return SearchPreferenceSchema.model_validate(pref)
