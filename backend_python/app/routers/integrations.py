from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.credentials import AiProviderCredential, ScraperCredential
from app.schemas.integrations import (
    AiProviderRequest, AiProviderResponse,
    ScraperProviderRequest, ScraperProviderResponse
)
from app.security.auth import get_current_user
from app.security.crypto import crypto_service
from app.providers.llm.factory import llm_factory
from app.providers.scraper.factory import scraper_factory

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

# ==============================================================================
# AI PROVIDERS
# ==============================================================================

@router.get("/ai", response_model=List[AiProviderResponse])
def get_ai_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    creds = db.query(AiProviderCredential).filter(
        AiProviderCredential.user_id == current_user.id
    ).all()

    results = []
    for c in creds:
        raw_key = None
        try:
            raw_key = crypto_service.decrypt(c.encrypted_api_key)
        except Exception:
            pass
        masked = crypto_service.mask_key(raw_key) if raw_key else "••••••••"
        resp = AiProviderResponse(
            id=c.id,
            providerType=c.provider_type,
            modelName=c.model_name,
            baseUrl=c.base_url,
            isDefault=c.is_default,
            isActive=c.is_active,
            status=c.status,
            lastStatusMessage=c.last_status_message,
            lastTestedAt=c.last_tested_at,
            maskedApiKey=masked
        )
        results.append(resp)
    return results

@router.post("/ai", response_model=AiProviderResponse)
def save_ai_provider(
    req: AiProviderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.providerType or not req.providerType.strip():
        raise HTTPException(status_code=400, detail={"error": "Provider type is required (e.g. GEMINI, OPENAI, ANTHROPIC)"})

    # If new default is selected, reset other defaults
    if req.isDefault:
        db.query(AiProviderCredential).filter(
            AiProviderCredential.user_id == current_user.id
        ).update({"is_default": False})

    # Check if credential of this type already exists for user
    existing = db.query(AiProviderCredential).filter(
        AiProviderCredential.user_id == current_user.id,
        AiProviderCredential.provider_type == req.providerType.upper()
    ).first()

    if not existing:
        existing = AiProviderCredential(
            user_id=current_user.id,
            provider_type=req.providerType.upper()
        )
        db.add(existing)

    if req.apiKey and req.apiKey.strip():
        existing.encrypted_api_key = crypto_service.encrypt(req.apiKey.strip())
        existing.status = "READY"
        existing.last_status_message = "Key updated and encrypted with AES-256-GCM"

    existing.model_name = req.modelName
    existing.base_url = req.baseUrl
    existing.is_default = bool(req.isDefault)
    existing.is_active = True
    existing.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing)

    raw_key = req.apiKey or ""
    masked = crypto_service.mask_key(raw_key) if raw_key else "••••••••"
    return AiProviderResponse(
        id=existing.id,
        providerType=existing.provider_type,
        modelName=existing.model_name,
        baseUrl=existing.base_url,
        isDefault=existing.is_default,
        isActive=existing.is_active,
        status=existing.status,
        lastStatusMessage=existing.last_status_message,
        lastTestedAt=existing.last_tested_at,
        maskedApiKey=masked
    )

@router.post("/ai/{id}/test")
def test_ai_provider(
    id: int,
    body: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cred = db.query(AiProviderCredential).filter(
        AiProviderCredential.id == id,
        AiProviderCredential.user_id == current_user.id
    ).first()

    if not cred:
        raise HTTPException(status_code=404, detail={"error": "AI credential not found"})

    raw_key = None
    if body and "apiKey" in body and body["apiKey"]:
        raw_key = body["apiKey"]
    elif cred.encrypted_api_key:
        try:
            raw_key = crypto_service.decrypt(cred.encrypted_api_key)
        except Exception:
            raw_key = None

    if not raw_key:
        raise HTTPException(status_code=400, detail={"error": "API Key is required to test connection."})

    try:
        provider = llm_factory.get_provider(cred.provider_type)
        success = provider.test_connection(raw_key, cred.model_name, cred.base_url)
        cred.status = "READY" if success else "ERROR"
        cred.last_status_message = "AI Provider verified and connected successfully" if success else "Failed to verify connection"
        cred.last_tested_at = datetime.utcnow()
        db.commit()

        return {
            "success": success,
            "status": cred.status,
            "message": cred.last_status_message
        }
    except Exception as e:
        cred.status = "INVALID_KEY"
        cred.last_status_message = str(e)
        cred.last_tested_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "status": "INVALID_KEY",
                "message": str(e)
            }
        )

@router.delete("/ai/{id}")
def delete_ai_provider(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cred = db.query(AiProviderCredential).filter(
        AiProviderCredential.id == id,
        AiProviderCredential.user_id == current_user.id
    ).first()
    if cred:
        db.delete(cred)
        db.commit()
    return {"message": "AI provider deleted successfully"}


# ==============================================================================
# SCRAPER PROVIDERS
# ==============================================================================

@router.get("/scrapers", response_model=List[ScraperProviderResponse])
def get_scraper_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    creds = db.query(ScraperCredential).filter(
        ScraperCredential.user_id == current_user.id
    ).all()

    results = []
    for c in creds:
        raw_key = None
        if c.encrypted_api_key:
            try:
                raw_key = crypto_service.decrypt(c.encrypted_api_key)
            except Exception:
                pass
        masked = crypto_service.mask_key(raw_key) if raw_key else "••••••••"
        resp = ScraperProviderResponse(
            id=c.id,
            providerType=c.provider_type,
            baseUrl=c.base_url,
            isDefault=c.is_default,
            isActive=c.is_active,
            status=c.status,
            lastStatusMessage=c.last_status_message,
            lastTestedAt=c.last_tested_at,
            maskedApiKey=masked
        )
        results.append(resp)
    return results

@router.post("/scrapers", response_model=ScraperProviderResponse)
def save_scraper_provider(
    req: ScraperProviderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.providerType or not req.providerType.strip():
        raise HTTPException(status_code=400, detail={"error": "Scraper provider type is required"})

    if req.isDefault:
        db.query(ScraperCredential).filter(
            ScraperCredential.user_id == current_user.id
        ).update({"is_default": False})

    existing = db.query(ScraperCredential).filter(
        ScraperCredential.user_id == current_user.id,
        ScraperCredential.provider_type == req.providerType.upper()
    ).first()

    if not existing:
        existing = ScraperCredential(
            user_id=current_user.id,
            provider_type=req.providerType.upper()
        )
        db.add(existing)

    if req.apiKey and req.apiKey.strip():
        existing.encrypted_api_key = crypto_service.encrypt(req.apiKey.strip())
        existing.status = "READY"
        existing.last_status_message = "Scraper token saved & encrypted"

    existing.base_url = req.baseUrl
    existing.is_default = bool(req.isDefault)
    existing.is_active = True
    existing.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing)

    raw_key = req.apiKey or ""
    masked = crypto_service.mask_key(raw_key) if raw_key else "••••••••"
    return ScraperProviderResponse(
        id=existing.id,
        providerType=existing.provider_type,
        baseUrl=existing.base_url,
        isDefault=existing.is_default,
        isActive=existing.is_active,
        status=existing.status,
        lastStatusMessage=existing.last_status_message,
        lastTestedAt=existing.last_tested_at,
        maskedApiKey=masked
    )

@router.post("/scrapers/{id}/test")
async def test_scraper_provider(
    id: int,
    body: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cred = db.query(ScraperCredential).filter(
        ScraperCredential.id == id,
        ScraperCredential.user_id == current_user.id
    ).first()

    if not cred:
        raise HTTPException(status_code=404, detail={"error": "Scraper credential not found"})

    raw_key = None
    if body and "apiKey" in body and body["apiKey"]:
        raw_key = body["apiKey"]
    elif cred.encrypted_api_key:
        try:
            raw_key = crypto_service.decrypt(cred.encrypted_api_key)
        except Exception:
            raw_key = None

    try:
        provider = scraper_factory.get_provider(cred.provider_type)
        success = await provider.test_connection(raw_key or "", cred.base_url)
        cred.status = "READY" if success else "ERROR"
        cred.last_status_message = "Scraper verified successfully" if success else "Failed to connect to scraper"
        cred.last_tested_at = datetime.utcnow()
        db.commit()

        return {
            "success": success,
            "status": cred.status,
            "message": cred.last_status_message
        }
    except Exception as e:
        cred.status = "INVALID_KEY"
        cred.last_status_message = str(e)
        cred.last_tested_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "status": "INVALID_KEY",
                "message": str(e)
            }
        )

@router.delete("/scrapers/{id}")
def delete_scraper_provider(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cred = db.query(ScraperCredential).filter(
        ScraperCredential.id == id,
        ScraperCredential.user_id == current_user.id
    ).first()
    if cred:
        db.delete(cred)
        db.commit()
    return {"message": "Scraper provider deleted successfully"}
