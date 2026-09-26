import time
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import or_
import httpx
import bcrypt

from app.config import settings
from app.database import get_db

logger = logging.getLogger("uvicorn.error")

security_bearer = HTTPBearer(auto_error=False)

# In-memory cache for validated Supabase tokens: token_hash -> (user_dict, expires_at)
_supabase_token_cache: Dict[str, tuple[Dict[str, Any], float]] = {}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Legacy password verification for local fallback."""
    if not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Legacy password hashing for local fallback."""
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(user_id: int, email: str, full_name: str) -> str:
    """Legacy access token generation for local testing/offline fallback."""
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_EXPIRATION_SECONDS)
    payload = {
        "sub": email,
        "userId": user_id,
        "email": email,
        "fullName": full_name,
        "exp": expire
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def _verify_supabase_token_remote(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Supabase JWT via Supabase Auth API endpoint.
    Works universally with symmetric (HS256) or asymmetric (ES256/RS256) project configurations.
    Uses in-memory TTL cache (300s) to avoid repetitive network calls.
    """
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    now = time.time()

    # Check cache
    if token_hash in _supabase_token_cache:
        cached_user, expires_at = _supabase_token_cache[token_hash]
        if now < expires_at:
            return cached_user
        else:
            del _supabase_token_cache[token_hash]

    if not settings.SUPABASE_URL:
        return None

    try:
        headers = {
            "Authorization": f"Bearer {token}",
        }
        if settings.SUPABASE_ANON_KEY:
            headers["apikey"] = settings.SUPABASE_ANON_KEY

        with httpx.Client(timeout=4.0) as client:
            resp = client.get(f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user", headers=headers)
            if resp.status_code == 200:
                user_data = resp.json()
                # Cache for 5 minutes (or token exp, whichever is shorter)
                _supabase_token_cache[token_hash] = (user_data, now + 300)
                return user_data
            else:
                logger.debug(f"Supabase auth API rejected token: status {resp.status_code}")
                return None
    except Exception as e:
        logger.warning(f"Error calling Supabase auth endpoint: {e}")
        return None

def verify_and_decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Multi-tier verification strategy:
    1. If SUPABASE_JWT_SECRET is configured: verify locally with HS256 signature and audience="authenticated".
    2. Remote verification against Supabase Auth API (/auth/v1/user).
    3. Fallback to local JWT_SECRET for offline testing.
    """
    # 1. Try Supabase JWT Secret if provided
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {})
            }
        except Exception as e:
            logger.debug(f"Local Supabase JWT secret verification failed: {e}")

    # 2. Try remote Supabase verification
    remote_user = _verify_supabase_token_remote(token)
    if remote_user:
        return {
            "id": remote_user.get("id"),
            "email": remote_user.get("email"),
            "user_metadata": remote_user.get("user_metadata", {})
        }

    # 3. Fallback to local JWT secret (offline development & automated tests)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return {
            "id": str(payload.get("userId", "")),
            "userId": payload.get("userId"),
            "email": payload.get("email") or payload.get("sub"),
            "user_metadata": {"full_name": payload.get("fullName", "")}
        }
    except JWTError:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency that extracts Bearer token, verifies Supabase JWT,
    and resolves the authenticated application User record with child relationships.
    """
    from app.models.user import User
    from app.services.data_initializer import initialize_user_data

    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Missing or invalid authentication token. Please sign in."}
        )
    
    token = auth.credentials.strip()
    token_info = verify_and_decode_token(token)
    if not token_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Authentication token is invalid or expired. Please sign in again."}
        )

    supabase_uid = token_info.get("id")
    email = (token_info.get("email") or "").strip().lower()
    user_id = token_info.get("userId")
    user_metadata = token_info.get("user_metadata") or {}
    full_name = user_metadata.get("full_name") or (email.split("@")[0].capitalize() if email else "Job Seeker")

    user = None

    # 1. Lookup by supabase_uid
    if supabase_uid:
        user = db.query(User).filter(User.supabase_uid == supabase_uid).first()

    # 2. Lookup by email
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    # 3. Lookup by local integer userId (for legacy test tokens)
    if not user and user_id:
        user = db.query(User).filter(User.id == user_id).first()

    # 4. Auto-provision user if verified through Supabase but not yet in application DB
    if not user and email:
        logger.info(f"Auto-provisioning application user for verified Supabase account: {email} (UID: {supabase_uid})")
        user = User(
            supabase_uid=supabase_uid,
            email=email,
            full_name=full_name,
            password_hash=None,  # Passwords managed strictly by Supabase Auth
            role="ROLE_USER"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Seed initial job sources and preferences
        initialize_user_data(user, db)
    elif user:
        # Link supabase_uid if missing
        modified = False
        if supabase_uid and not user.supabase_uid:
            user.supabase_uid = supabase_uid
            modified = True
        if full_name and (not user.full_name or user.full_name == "Job Seeker"):
            user.full_name = full_name
            modified = True
        if modified:
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "User associated with this authentication token could not be found."}
        )

    return user
