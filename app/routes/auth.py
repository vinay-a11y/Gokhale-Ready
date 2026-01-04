from fastapi import APIRouter, Request, Form, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from uuid import uuid4
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import ResetPasswordRequest
from app.schemas.user import UserAddressUpdate, Address
from sqlalchemy.orm.attributes import flag_modified

# Load environment variables
load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# JWT CONFIG
SECRET_KEY = os.getenv("SECRET_KEY", "7f93a5057e4e460c975234a0529a6919a3282d1f429dc1e42e99aee3498296ef")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# Password Hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

# ================== ROUTES ================== #

@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.post("/register")
async def register(
    firstName: str = Form(...),
    lastName: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    confirmPassword: str = Form(...),
    db: Session = Depends(get_db)
):
    if password != confirmPassword:
        return JSONResponse(status_code=400, content={"error": "Passwords do not match"})

    existing = db.query(User).filter(User.mobile_number == phone).first()
    if existing:
        return JSONResponse(status_code=400, content={"error": "Mobile number already registered"})

    hashed_pw = hash_password(password)

    user = User(
        first_name=firstName,
        last_name=lastName,
        mobile_number=phone,
        password=hashed_pw,
        customer_id=str(uuid4())[:8],
        internal_id=str(uuid4())
    )
    try:
        db.add(user)
        db.commit()
        return RedirectResponse(url="/login", status_code=303)
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"message": "Registration failed: " + str(e)})

@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
def login(
    mobile_number: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.mobile_number == mobile_number).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    response = JSONResponse(content={
        "message": "Login successful",
        "user": {
            "first_name": user.first_name,
            "id": user.id,
            "role": user.role
        }
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=False)
    return response

@router.get("/logout")
def logout():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("access_token")
    return response

# ================== PASSWORD RESET ================== #

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile_number == req.phone).first()
    if user:
        user.password = hash_password(req.newPassword)
        db.add(user)
        db.commit()
        return JSONResponse(content={"message": "Password reset successful"})
    return JSONResponse(content={"detail": "User not found"}, status_code=404)

# ================== ADDRESS ROUTES ================== #

@router.get("/api/user/addresses")
def get_user_saved_address(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    addresses = user.address if user.address else []
    return JSONResponse(content={"addresses": addresses, "count": len(addresses)})

@router.post("/api/user/address")
async def save_user_address(payload: UserAddressUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.address is None:
        user.address = []

    new_address = payload.address.model_dump()

    is_duplicate = any(
        addr.get("line1") == new_address.get("line1") and 
        addr.get("pincode") == new_address.get("pincode")
        for addr in user.address
    )
    if is_duplicate:
        return JSONResponse(content={"message": "Address already exists", "addresses": user.address})

    user.address.append(new_address)
    flag_modified(user, "address")
    db.commit()
    db.refresh(user)
    return JSONResponse(content={"message": "Address saved successfully", "addresses": user.address})

@router.delete("/api/user/address")
async def delete_user_address(address_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.address = [addr for addr in user.address if addr.get("id") != address_id]
    flag_modified(user, "address")
    db.commit()

    return JSONResponse(content={"message": "Address deleted successfully"})

@router.put("/api/user/address/{address_id}")
async def update_user_address(address_id: int, address: Address, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for i, addr in enumerate(user.address or []):
        if addr.get("id") == address_id:
            user.address[i] = address.model_dump()
            flag_modified(user, "address")
            db.commit()
            return JSONResponse(content={"message": "Address updated successfully"})

    raise HTTPException(status_code=404, detail="Address not found")

