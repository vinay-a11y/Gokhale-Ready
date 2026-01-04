
from fastapi import APIRouter, Request, Depends, HTTPException, Cookie, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime
import os
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.user import User

# Load environment variables
load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "7f93a5057e4e460c975234a0529a6919a3282d1f429dc1e42e99aee3498296ef")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid token payload")
        return user_id
    except JWTError:
        raise ValueError("Invalid or expired token")


def get_current_user_from_cookie(
    access_token: str = Cookie(default=None),
    db: Session = Depends(get_db)
) -> User:
    if not access_token:
        # Redirect to login page if no token
        raise HTTPException(status_code=status.HTTP_302_FOUND, headers={"Location": "/login"})

    try:
        user_id = decode_jwt_token(access_token)
    except ValueError:
        # Redirect to login page if token is invalid
        raise HTTPException(status_code=status.HTTP_302_FOUND, headers={"Location": "/login"})

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        # Redirect to login page if user not found
        raise HTTPException(status_code=status.HTTP_302_FOUND, headers={"Location": "/login"})

    return user


# ========== ROUTES ========== #

@router.get("/cart", response_class=HTMLResponse)
def cart_page(request: Request, user: User = Depends(get_current_user_from_cookie)):
    """
    Display the cart page if authenticated.
    """
    return templates.TemplateResponse("cart.html", {"request": request, "user": user})


@router.post("/api/cart/sync")
async def sync_cart(cart_data: Dict[str, List], user: User = Depends(get_current_user_from_cookie)):
    """
    Sync the cart data with the server.
    """
    try:
        # Future enhancements:
        # - Validate product existence
        # - Check stock
        # - Apply promotions
        return {
            "status": "success",
            "message": "Cart synced successfully",
            "user_id": user.id,
            "data": cart_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders.html", response_class=HTMLResponse)
def orders_page(request: Request, user: User = Depends(get_current_user_from_cookie)):
    """
    Display the orders page for authenticated users.
    """
    return templates.TemplateResponse("orders.html", {"request": request, "user": user})

