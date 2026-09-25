import re
import time
import secrets
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.security.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.data_initializer import initialize_user_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

# In-memory store for password reset verification codes
# email -> {"code": "123456", "expires_at": float, "attempts": int}
password_resets = {}


@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    email = (req.email or "").strip().lower()
    password = (req.password or "").strip()
    full_name = (req.fullName or "").strip() or "Job Seeker"

    if not email or not password:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Email and password are required."}
        )

    if not re.match(EMAIL_REGEX, email):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Please provide a valid email address (e.g. user@domain.com)."}
        )

    if len(password) < 6:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Password must be at least 6 characters long."}
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Email is already registered. Please sign in instead."}
        )

    # Create new user
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        full_name=full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default sources and preferences
    initialize_user_data(user, db)

    # Generate JWT
    token = create_access_token(user.id, user.email, user.full_name)

    return {
        "token": token,
        "userId": user.id,
        "email": user.email,
        "fullName": user.full_name
    }

@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    email = (req.email or "").strip().lower()
    password = (req.password or "").strip()

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Invalid email or password"}
        )

    token = create_access_token(user.id, user.email, user.full_name)

    return {
        "token": token,
        "userId": user.id,
        "email": user.email,
        "fullName": user.full_name
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "userId": current_user.id,
        "email": current_user.email,
        "fullName": current_user.full_name
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = (req.email or "").strip().lower()
    if not email:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Email address is required."}
        )
    if not re.match(EMAIL_REGEX, email):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Please provide a valid email address."}
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "No account found with this email address. Please register first."}
        )

    # Generate 6-digit secure verification code
    code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = time.time() + 900  # 15 minutes validity
    password_resets[email] = {
        "code": code,
        "expires_at": expires_at,
        "attempts": 0
    }
    logger.info(f"Password reset code generated for {email}: {code} (expires in 15 mins)")

    return {
        "success": True,
        "message": "Reset verification code generated successfully.",
        "email": email,
        "code": code  # Provided directly for seamless local/developer user experience
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = (req.email or "").strip().lower()
    code = (req.code or "").strip()
    new_password = (req.newPassword or "").strip()

    if not email or not code or not new_password:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Email, verification code, and new password are required."}
        )

    if len(new_password) < 6:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "New password must be at least 6 characters long."}
        )

    reset_record = password_resets.get(email)
    if not reset_record:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No active reset request found for this email. Please request a new code."}
        )

    if time.time() > reset_record["expires_at"]:
        password_resets.pop(email, None)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Verification code has expired. Please request a new code."}
        )

    if reset_record["attempts"] >= 5:
        password_resets.pop(email, None)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Too many failed attempts. Please request a new code."}
        )

    if reset_record["code"] != code:
        reset_record["attempts"] += 1
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid verification code. Please check and try again."}
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "User not found."}
        )

    # Update password hash
    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)

    # Invalidate reset code
    password_resets.pop(email, None)
    logger.info(f"Password successfully reset for user: {email}")

    # Generate JWT token for immediate, seamless login
    token = create_access_token(user.id, user.email, user.full_name)

    return {
        "success": True,
        "message": "Password reset successfully! You are now signed in.",
        "token": token,
        "userId": user.id,
        "email": user.email,
        "fullName": user.full_name
    }

