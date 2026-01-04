# main.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.orders import Order
from app.schemas.orders import OrderCreateSchema  
import razorpay
from sqlalchemy.orm import joinedload
from app.models.user import User
from fastapi.responses import HTMLResponse , RedirectResponse
# from fastapi import RedirectResponse
from fastapi import Request
from datetime import datetime
import os

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Allow frontend access (adjust for your frontend domain)


# Razorpay test keys
RAZORPAY_KEY_ID = "rzp_test_m5j63eVkzEwHxa"
RAZORPAY_KEY_SECRET = "45ZCZTvLVb2GjiKo2n9meKTB"

# Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@router.post("/create-order/")
async def create_order(data: dict):
    try:
        amount = data.get("amount")
        if not amount:
            raise HTTPException(status_code=400, detail="Amount is required")

        amount_in_paise = int(amount * 100)
        print("Amount in paise:", amount_in_paise)
        # Create Razorpay order
        payment = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return {
            "order_id": payment["id"],
            "key": RAZORPAY_KEY_ID
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/verify-payment/")
async def verify_payment(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        print("Received payment data:", data)

        # Razorpay signature verification
        params_dict = {
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        }

        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid Razorpay signature.")

        # Extracting order data
        user = data.get("user_details")
        if user:
            user_deets = db.query(User).filter(User.id == user["id"]).first()
        address = data.get("delivery_address")
        items = data.get("items")
        total_amount = data.get("amount")
        delivery_date = data.get("delivery_date")  # <-- Step 2: Extract delivery date

        if not all([user, address, items, total_amount, delivery_date]):
            raise HTTPException(status_code=400, detail="Missing order fields.")

        print("User:", user)

        # Step 3: Create order with delivery_date
        new_order = Order(
            user_id=user["id"],
            first_name=user_deets.first_name,  # store snapshot of name
            mobile_number=user_deets.mobile_number,  # store snapshot of phone
            address=address,
            items=items,
            total_amount=total_amount,
            razorpay_order_id=data["order_id"],
            order_status="placed",
            delivery_date=datetime.strptime(delivery_date, "%Y-%m-%d") if delivery_date else None,
            created_at=datetime.now(),
        )

        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return {"status": "success", "order_id": new_order.id}

    except HTTPException as e:
        raise e
    except Exception as e:
        print("Unexpected error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/orders.html", response_class=HTMLResponse)
def orders_page(request: Request):
     if request.cookies.get("logged_in") != "true":
      return RedirectResponse(url="/login", status_code=302)
     return templates.TemplateResponse("orders.html", {"request": request})



@router.get("/api/orders")
async def get_order_details(user_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.user))  # This preloads the related User
        .filter(Order.user_id == user_id)
        .all()
    )

    if not orders:
        return {
            "data": [],
            "message": "No orders found"
        }

    order_list = []
    for order in orders:
        order_data = {
            "id": order.id,
            "razorpay_order_id": order.razorpay_order_id,
            "user_id": order.user_id,
            "name": f"{order.user.first_name} {order.user.last_name}".strip() if order.user else None,
            "phone": order.user.mobile_number if order.user else None,
            "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None,
            "total_amount": float(order.total_amount) if order.total_amount else 0.0,
            "order_status": order.order_status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "items": order.items if order.items else [],
            "address": order.address if order.address else {}
        }
        order_list.append(order_data)

    return {
        "data": order_list,
        "message": "Orders fetched successfully"
    }


@router.patch("/cancel-order/{order_id}")
async def cancel_order(order_id: int, db: Session = Depends(get_db)):
    try:
        # Fetch the order by ID
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Only allow cancellation if order is placed or confirmed
        if order.order_status not in ["placed", "confirmed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel an order that is {order.order_status}"
            )

        # Update order status to cancelled
        order.order_status = "cancelled"
        db.commit()
        db.refresh(order)

        return {"status": "success", "order_id": order.id, "message": "Order cancelled successfully"}

    except HTTPException as e:
        raise e
    except Exception as e:
        print("Unexpected error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

