import os
import json
import requests
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
import logging
logging.basicConfig(level=logging.INFO)

from app.database.session import get_db
from app.models.orders import Order
from app.schemas.orders import OrderStatusUpdate

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Shiprocket credentials
SHIPROCKET_EMAIL = os.getenv("SHIPROCKET_EMAIL", "outransystem@gmail.com")
SHIPROCKET_PASSWORD = os.getenv("SHIPROCKET_PASSWORD", "0Og*mBVVxwCzc#ut")


def get_shiprocket_token() -> str:
    """Authenticate with Shiprocket and return the Bearer token."""
    url = "https://apiv2.shiprocket.in/v1/external/auth/login"
    resp = requests.post(url, json={"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD})
    if resp.status_code == 200 and resp.json().get("token"):
        return resp.json()["token"]
    raise HTTPException(status_code=500, detail="Failed to fetch Shiprocket token")


def create_shiprocket_order(order: Order, token: str):
    """Send an order to Shiprocket."""
    address = order.address if isinstance(order.address, dict) else json.loads(order.address or "{}")
    items = order.items if isinstance(order.items, list) else json.loads(order.items or "[]")

    order_items = []
    for item in items:
        order_items.append({
            "name": item.get("name", "Item"),
            "sku": item.get("sku", f"SKU{item.get('id', '')}"),
            "units": item.get("quantity", 1),
            "selling_price": float(item.get("price", 0.0))
        })

    customer_name = address.get("name", "Customer")
    name_parts = customer_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else "."

    payload = {
        "order_id": str(order.id),
        "order_date": order.created_at.strftime("%Y-%m-%d"),
        "pickup_location": "Home",  # Use your verified pickup location
        "billing_customer_name": first_name,
        "billing_last_name": last_name,
        "billing_address": address.get("street", address.get("address", "Address")),
        "billing_city": address.get("city", ""),
        "billing_pincode": address.get("pincode", ""),
        "billing_state": address.get("state", ""),
        "billing_country": "India",
        "billing_email": address.get("email", ""),
        "billing_phone": address.get("phone", "9923070796"),
        "shipping_is_billing": True,
        "order_items": order_items,
        "payment_method": order.payment_mode if hasattr(order, "payment_mode") else "Prepaid",
        "sub_total": float(order.total_amount or 0),
        "length": 10,
        "breadth": 10,
        "height": 10,
        "weight": 1
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    resp = requests.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        json=payload,
        headers=headers
    )
    return resp



@router.get("/api/admin/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@router.patch("/api/admin/orders/{order_id}")
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Just update the status directly
    order.order_status = payload.order_status
    db.commit()
    db.refresh(order)

    return order

@router.post("/api/admin/place-and-ship-orders")
def place_and_ship_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.order_status == "inprocess").all()
    if not orders:
        return {"message": "No inprocess orders to process"}

    placed = []
    failed = []

    token = get_shiprocket_token()

    for order in orders:
        try:
            # Step 1: Create order
            create_resp = create_shiprocket_order(order, token)
            create_data = create_resp.json()

            if create_resp.status_code != 200 or create_data.get("status") != 1:
                failed.append({"id": order.id, "error": create_data})
                continue

            shipment_id = create_data.get("shipment_id")

            # Step 2: Generate AWB
            awb_resp = requests.post(
                "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={"shipment_id": shipment_id}
            )

            awb_data = awb_resp.json()
            if awb_resp.status_code != 200 or not awb_data.get("awb_code"):
                failed.append({"id": order.id, "error": {"step": "awb", "details": awb_data}})
                continue

            # Step 3: Ready to Ship
            ship_resp = requests.post(
                "https://apiv2.shiprocket.in/v1/external/shipments/ready-to-ship",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={"shipment_id": shipment_id, "courier_id": awb_data.get("courier_company_id")}
            )

            ship_data = ship_resp.json()
            if ship_resp.status_code != 200 or not ship_data.get("shipment_id"):
                failed.append({"id": order.id, "error": {"step": "ship", "details": ship_data}})
                continue

            order.order_status = "shipped"
            db.commit()

            placed.append({
                "id": order.id,
                "shipment_id": shipment_id,
                "awb": awb_data.get("awb_code"),
                "courier": awb_data.get("courier_name")
            })

        except Exception as e:
            failed.append({"id": order.id, "error": str(e)})

    return {"shipped": placed, "failed": failed}


