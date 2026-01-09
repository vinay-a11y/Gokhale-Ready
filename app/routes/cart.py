from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from typing import Dict, List

from app.database.session import get_db
from app.models.user import User
from app.routes.auth import get_current_user  # ✅ REUSE AUTH LOGIC

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# -------------------------------------------------
# CART PAGE (PROTECTED)
# -------------------------------------------------
@router.get("/cart", response_class=HTMLResponse)
def cart_page(
    request: Request,
):
    return templates.TemplateResponse(
        "cart.html",
        {"request": request},
    )

# -------------------------------------------------
# ORDERS PAGE (PROTECTED)
# -------------------------------------------------
@router.get("/orders.html", response_class=HTMLResponse)
def orders_page(
    request: Request,
):
    return templates.TemplateResponse(
        "orders.html",
        {"request": request},
    )

# -------------------------------------------------
# CART SYNC API (OPTIONAL / FUTURE USE)
# -------------------------------------------------
@router.post("/api/cart/sync")
def sync_cart(
    cart_data: Dict[str, List],
    user: User = Depends(get_current_user),  # ✅ AUTH FROM auth.py
):
    return JSONResponse(
        {
            "status": "success",
            "message": "Cart synced successfully",
            "user_id": user.id,
            "data": cart_data,
        }
    )
