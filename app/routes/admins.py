import json
import traceback
from collections import defaultdict
from typing import List, Literal
from datetime import datetime, timedelta

from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Query,
    Body,
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.routes.admins_ops import get_current_admin, Admin
from app.models.product import Product
from app.models.orders import Order
from app.models.kitchenPrep import KitchenVariant, KitchenPrepItem
from app.schemas.orders import OrderStatusUpdate
from app.schemas.product import ProductsCreate  # ✅ ensure correct import

# ------------------------------------------------------
# 🔐 LOCKED ADMIN ROUTER (ADMIN JWT REQUIRED)
# ------------------------------------------------------
router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)

# ------------------------------------------------------
# ORDERS
# ------------------------------------------------------
@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(500)
        .all()
    )


@router.patch("/orders/{order_id}")
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.order_status = payload.order_status
    db.commit()
    db.refresh(order)
    return order


# ------------------------------------------------------
# DASHBOARD SUMMARY
# ------------------------------------------------------
@router.get("/dashboard/summary")
def dashboard_summary(
    period: str = "monthly",
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    start_date = {
        "weekly": now - timedelta(days=7),
        "yearly": now - timedelta(days=365),
    }.get(period, now - timedelta(days=30))

    return {
        "total_revenue": float(
            db.query(func.coalesce(func.sum(Order.total_amount), 0))
            .filter(Order.created_at >= start_date)
            .scalar()
        ),
        "total_orders": db.query(func.count(Order.id))
        .filter(Order.created_at >= start_date)
        .scalar(),
        "total_customers": db.query(
            func.count(func.distinct(Order.mobile_number))
        )
        .filter(Order.created_at >= start_date)
        .scalar(),
    }


# ------------------------------------------------------
# DASHBOARD REVENUE
# ------------------------------------------------------
@router.get("/dashboard/revenue")
def dashboard_revenue(
    period: str = "monthly",
    db: Session = Depends(get_db),
):
    label = (
        func.date(Order.created_at)
        if period == "weekly"
        else func.year(Order.created_at)
        if period == "yearly"
        else func.date_format(Order.created_at, "%Y-%m")
    )

    rows = (
        db.query(label.label("name"), func.sum(Order.total_amount))
        .group_by("name")
        .order_by("name")
        .all()
    )

    return [{"name": str(r[0]), "revenue": float(r[1] or 0)} for r in rows]


# ------------------------------------------------------
# TOP PRODUCTS
# ------------------------------------------------------
@router.get("/dashboard/top-products")
def top_products(db: Session = Depends(get_db)):
    orders = db.query(Order.items).all()
    product_map = {}

    for (items,) in orders:
        if not items:
            continue
        items = json.loads(items) if isinstance(items, str) else items

        for item in items:
            name = item.get("name")
            qty = int(item.get("quantity", 0))
            price = float(item.get("price", 0))

            if not name:
                continue

            product_map.setdefault(name, {"sales": 0, "revenue": 0})
            product_map[name]["sales"] += qty
            product_map[name]["revenue"] += qty * price

    return sorted(
        [{"name": k, **v} for k, v in product_map.items()],
        key=lambda x: x["sales"],
        reverse=True,
    )[:5]


# ------------------------------------------------------
# PRODUCTS STATE
# ------------------------------------------------------
@router.get("/products-state")
def get_all_products_with_status(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []

    for p in products:
        variants = []
        for i in range(1, 5):
            price = getattr(p, f"price_0{i}", None)
            packing = getattr(p, f"packing_0{i}", None)
            if price:
                variants.append({"packing": packing or "", "price": float(price)})

        result.append({
            "id": p.id,
            "item_name": p.item_name,
            "category": p.category,
            "description": p.description,
            "image_url": p.imagesrc,
            "variants": variants,
            "max_price": max((v["price"] for v in variants), default=0),
            "shelf_life_days": p.shelf_life_days,
            "lead_time_days": p.lead_time_days,
            "is_enabled": p.is_enabled,
        })

    return result


# ------------------------------------------------------
# PRODUCT TOGGLES
# ------------------------------------------------------
@router.patch("/products/{product_id}/toggle")
def toggle_product_status(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_enabled = not product.is_enabled
    db.commit()
    return {"product_id": product.id, "new_status": product.is_enabled}


@router.patch("/products/toggle-all")
def toggle_all_products(
    action: Literal["0", "1"],
    db: Session = Depends(get_db),
):
    is_enable = action == "1"
    products = db.query(Product).all()

    for p in products:
        p.is_enabled = is_enable

    db.commit()
    return {"affected_count": len(products)}


# ------------------------------------------------------
# PRODUCT CRUD
# ------------------------------------------------------
@router.post("/products/add")
def add_product(
    product: ProductsCreate,
    db: Session = Depends(get_db),
):
    try:
        new_product = Product(**product.model_dump(), is_enabled=True)
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return {"message": "Product added", "product_id": new_product.id}
    except Exception:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to add product")


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    product_data: dict = Body(...),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for k, v in product_data.items():
        if hasattr(product, k):
            setattr(product, k, v)

    db.commit()
    return {"message": "Product updated"}


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

@router.get("/dashboard/categories")
def product_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Product.category, func.count(Product.id))
        .group_by(Product.category)
        .all()
    )

    return [
        {"name": category, "value": count}
        for category, count in rows
        if category
    ]