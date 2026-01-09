from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    Depends,
    status,
)
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import razorpay
import os

from app.database.session import get_db
from app.models.orders import Order
from app.models.user import User
from app.routes.auth import get_current_user  # ✅ JWT auth

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Razorpay config
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Razorpay keys not configured")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# --------------------------------------------------
# CREATE ORDER (JWT REQUIRED)
# --------------------------------------------------
@router.post("/create-order/")
async def create_order(
    data: dict,
    current_user: User = Depends(get_current_user),
):
    amount = data.get("amount")
    if not amount:
        raise HTTPException(status_code=400, detail="Amount is required")

    amount_in_paise = int(amount * 100)

    try:
        payment = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return {
            "order_id": payment["id"],
            "key": RAZORPAY_KEY_ID,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------
# VERIFY PAYMENT & CREATE DB ORDER (JWT REQUIRED)
# --------------------------------------------------
@router.post("/verify-payment/")
async def verify_payment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await request.json()

    # Verify Razorpay signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data["order_id"],
            "razorpay_payment_id": data["payment_id"],
            "razorpay_signature": data["signature"],
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    delivery_date = data.get("delivery_date")
    items = data.get("items")
    address = data.get("delivery_address")
    total_amount = data.get("amount")

    if not all([items, address, total_amount]):
        raise HTTPException(status_code=400, detail="Missing order fields")

    new_order = Order(
        user_id=current_user.id,
        first_name=current_user.first_name,
        mobile_number=current_user.mobile_number,
        address=address,
        items=items,
        total_amount=total_amount,
        razorpay_order_id=data["order_id"],
        order_status="placed",
        delivery_date=datetime.strptime(delivery_date, "%Y-%m-%d") if delivery_date else None,
        created_at=datetime.utcnow(),
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {
        "status": "success",
        "order_id": new_order.id,
    }


# --------------------------------------------------
# ORDERS PAGE (JWT REQUIRED)
# --------------------------------------------------
@router.get("/orders.html", response_class=HTMLResponse)
def orders_page(
    request: Request,
):
    return templates.TemplateResponse(
        "orders.html",
        {"request": request},
    )


# --------------------------------------------------
# GET USER ORDERS (JWT REQUIRED)
# --------------------------------------------------
@router.get("/api/orders")
async def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .options(joinedload(Order.user))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return {
        "data": [
            {
                "id": o.id,
                "razorpay_order_id": o.razorpay_order_id,
                "delivery_date": o.delivery_date.isoformat() if o.delivery_date else None,
                "total_amount": float(o.total_amount),
                "order_status": o.order_status,
                "created_at": o.created_at.isoformat(),
                "items": o.items,
                "address": o.address,
            }
            for o in orders
        ],
        "message": "Orders fetched successfully",
    }


# --------------------------------------------------
# CANCEL ORDER (JWT REQUIRED)
# --------------------------------------------------
@router.patch("/cancel-order/{order_id}")
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.order_status not in ["placed", "confirmed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order in '{order.order_status}' state",
        )

    order.order_status = "cancelled"
    db.commit()

    return {
        "status": "success",
        "message": "Order cancelled successfully",
    }
