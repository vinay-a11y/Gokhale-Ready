from fastapi import APIRouter, Depends, HTTPException, Form, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import os
from dotenv import load_dotenv

from app.database.session import get_db, Base, engine

# -------------------------------------------------
# ENV
# -------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ADMIN_TOKEN_EXPIRE_MINUTES = int(os.getenv("ADMIN_TOKEN_EXPIRE_MINUTES", 720))

# -------------------------------------------------
# Admin Model
# -------------------------------------------------
class Admin(Base):
    __tablename__ = "admins_ops"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# Router
# -------------------------------------------------
router = APIRouter(
    prefix="/api/admins_ops",
    tags=["admins_ops"]
)

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def create_default_admin(db: Session):
    """
    Creates default admin if not exists
    """
    admin = db.query(Admin).filter_by(email="admin@gokhale.com").first()
    if not admin:
        hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        admin = Admin(email="admin@gokhale.com", password=hashed)
        db.add(admin)
        db.commit()

def authenticate_admin(db: Session, email: str, password: str):
    admin = db.query(Admin).filter_by(email=email).first()
    if admin and bcrypt.checkpw(password.encode(), admin.password.encode()):
        return admin
    return None

def create_admin_token(admin_id: int, email: str):
    expire = datetime.utcnow() + timedelta(minutes=ADMIN_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(admin_id),
        "email": email,
        "role": "admin",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# -------------------------------------------------
# AUTH DEPENDENCY (LOCK)
# -------------------------------------------------
def get_current_admin(
    request: Request,
    db: Session = Depends(get_db),
):
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not authenticated",
        )

    token = auth.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access only",
            )
        admin_id = payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    admin = db.query(Admin).filter(Admin.id == int(admin_id)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )

    return admin

# -------------------------------------------------
# PUBLIC ROUTES
# -------------------------------------------------
@router.post("/login")
def admin_login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    admin = authenticate_admin(db, email, password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_admin_token(admin.id, admin.email)

    return {
        "access_token": token,
        "token_type": "Bearer",
        "email": admin.email,
    }

# -------------------------------------------------
# PROTECTED ROUTES
# -------------------------------------------------
@router.get("/me")
def admin_profile(
    admin: Admin = Depends(get_current_admin),
):
    return {
        "id": admin.id,
        "email": admin.email,
        "role": "admin",
    }

@router.post("/change-password")
def change_admin_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not bcrypt.checkpw(current_password.encode(), admin.password.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password incorrect",
        )

    admin.password = bcrypt.hashpw(
        new_password.encode(), bcrypt.gensalt()
    ).decode()
    db.commit()

    return {"message": "Password changed successfully"}

# -------------------------------------------------
# STARTUP
# -------------------------------------------------
@router.on_event("startup")
def ensure_admin():
    db = next(get_db())
    create_default_admin(db)
