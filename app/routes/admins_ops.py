from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.database.session import get_db, Base, engine
from sqlalchemy import Column, Integer, String
import bcrypt
import jwt

# -------------------------------
# Admin model
# -------------------------------
class Admin(Base):
    __tablename__ = "admins_ops"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

# Create table if not exists
Base.metadata.create_all(bind=engine)

# -------------------------------
# Router
# -------------------------------
router = APIRouter(prefix="/api/admins_ops", tags=["admins_ops"])
SECRET_KEY = "7f93a5057e4e460c975234a0529a6919a3282d1f429dc1e42e99aee3498296ef"

# -------------------------------
# Helper Functions
# -------------------------------
def create_default_admin(db: Session):
    if not db.query(Admin).filter_by(email="admin@gokhale.com").first():
        hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        default_admin = Admin(email="admin@gokhale.com", password=hashed_password)
        db.add(default_admin)
        db.commit()

def authenticate_admin(db: Session, email: str, password: str):
    admin = db.query(Admin).filter_by(email=email).first()
    if admin and bcrypt.checkpw(password.encode(), admin.password.encode()):
        return admin
    return None

def change_admin_password(db: Session, email: str, current_password: str, new_password: str):
    admin = db.query(Admin).filter_by(email=email).first()
    if not admin:
        return False, "Admin not found"
    if not bcrypt.checkpw(current_password.encode(), admin.password.encode()):
        return False, "Current password is incorrect"
    
    admin.password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return True, "Password changed successfully"

# -------------------------------
# Routes
# -------------------------------
@router.post("/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    admin = authenticate_admin(db, email, password)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = jwt.encode({"id": admin.id, "email": admin.email}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "email": admin.email}

@router.post("/change-password")
def change_password(
    email: str = Form(...),
    current_password: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    success, message = change_admin_password(db, email, current_password, new_password)
    if not success:
        raise HTTPException(status_code=401, detail=message)
    return {"message": message}

# -------------------------------
# Ensure default admin on startup
# -------------------------------
@router.on_event("startup")
def ensure_default_admin():
    db = next(get_db())
    create_default_admin(db)

