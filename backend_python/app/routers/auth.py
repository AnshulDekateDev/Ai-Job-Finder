import re
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.security.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.data_initializer import initialize_user_data

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

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
