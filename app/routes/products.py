from fastapi import (
    APIRouter,
    Body,
    HTTPException,
    Request,
    Depends,
    status,
)
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Literal
import traceback

from app.database.session import get_db
from app.models.product import Product
from app.schemas.product import ProductsCreate
from app.models.user import User
from app.routes.auth import get_current_user  # ✅ reuse auth

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# ----------------------------------------------------
# HTML PAGES (PUBLIC)
# ----------------------------------------------------

@router.get("/product", response_class=HTMLResponse)
def product_page(request: Request):
    return templates.TemplateResponse("products.html", {"request": request})


@router.get("/product-details.html", response_class=HTMLResponse)
def product_details(request: Request):
    return templates.TemplateResponse("product-details.html", {"request": request})


# ----------------------------------------------------
# PUBLIC API (CUSTOMERS)
# ----------------------------------------------------

# @router.get("/api/products")
# def get_all_products(db: Session = Depends(get_db)):
#     current_user: User = Depends(get_current_user),  # ✅ JWT

#     """
#     Public product listing (only enabled products)
#     """
#     products = db.query(Product).filter(Product.is_enabled == True).all()
#     product_list = []

#     for p in products:
#         variants = []

#         if p.price_01:
#             variants.append({"packing": p.packing_01 or "Var 1", "price": p.price_01})
#         if p.price_02:
#             variants.append({"packing": p.packing_02 or "Var 2", "price": p.price_02})
#         if p.price_03:
#             variants.append({"packing": p.packing_03 or "Var 3", "price": p.price_03})
#         if p.price_04:
#             variants.append({"packing": p.packing_04 or "Var 4", "price": p.price_04})

#         product_list.append({
#             "id": p.id,
#             "item_name": p.item_name,
#             "category": p.category,
#             "description": p.description,
#             "image_url": p.imagesrc,
#             "variants": variants,
#             "max_price": max((v["price"] for v in variants), default=0),
#         })

#     return product_list


# ----------------------------------------------------
# ADMIN APIs (JWT REQUIRED)
# ----------------------------------------------------

@router.get("/api/products-state")
def get_all_products_with_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ✅ JWT
):
    """
    Admin: get all products (enabled + disabled)
    """
    products = db.query(Product).all()
    result = []

    for p in products:
        variants = []

        if p.price_01 and p.price_01 > 0:
            variants.append({"packing": p.packing_01 or "200", "price": float(p.price_01)})
        if p.price_02 and p.price_02 > 0:
            variants.append({"packing": p.packing_02 or "500", "price": float(p.price_02)})
        if p.price_03 and p.price_03 > 0:
            variants.append({"packing": p.packing_03 or "1000", "price": float(p.price_03)})
        if p.price_04 and p.price_04 > 0:
            variants.append({"packing": p.packing_04 or "1500", "price": float(p.price_04)})

        result.append({
            "id": p.id,
            "item_name": p.item_name,
            "category": p.category,
            "description": p.description,
            "image_url": p.imagesrc,

            "packing_01": p.packing_01,
            "price_01": float(p.price_01) if p.price_01 else None,
            "packing_02": p.packing_02,
            "price_02": float(p.price_02) if p.price_02 else None,
            "packing_03": p.packing_03,
            "price_03": float(p.price_03) if p.price_03 else None,
            "packing_04": p.packing_04,
            "price_04": float(p.price_04) if p.price_04 else None,

            "variants": variants,
            "max_price": max((v["price"] for v in variants), default=0),
            "shelf_life_days": p.shelf_life_days,
            "lead_time_days": p.lead_time_days,
            "is_enabled": p.is_enabled,
        })

    return result


# @router.post("/api/products/add")
# def add_product(
#     product: ProductsCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     try:
#         new_product = Product(
#             item_name=product.item_name,
#             category=product.category,
#             description=product.description,
#             shelf_life_days=product.shelf_life_days,
#             lead_time_days=product.lead_time_days,
#             imagesrc=product.imagesrc,
#             packing_01=product.packing_01,
#             price_01=product.price_01,
#             packing_02=product.packing_02,
#             price_02=product.price_02,
#             packing_03=product.packing_03,
#             price_03=product.price_03,
#             packing_04=product.packing_04,
#             price_04=product.price_04,
#             is_enabled=True,
#         )

#         db.add(new_product)
#         db.commit()
#         db.refresh(new_product)

#         return {"message": "Product added successfully", "product_id": new_product.id}

#     except Exception:
#         db.rollback()
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail="Failed to add product")


# @router.put("/api/products/{product_id}")
# def update_product(
#     product_id: int,
#     product_data: dict = Body(...),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     product = db.query(Product).filter(Product.id == product_id).first()
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")

#     for key, value in product_data.items():
#         if hasattr(product, key):
#             setattr(product, key, value)

#     db.commit()
#     return {"message": "Product updated successfully"}


# @router.delete("/api/products/{product_id}")
# def delete_product(
#     product_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     product = db.query(Product).filter(Product.id == product_id).first()
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")

#     db.delete(product)
#     db.commit()
#     return {"message": "Product deleted successfully"}


# ----------------------------------------------------
# TOGGLE APIs (RESTORED)
# ----------------------------------------------------

# @router.patch("/api/products/{product_id}/toggle")
# def toggle_product_status(
#     product_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     product = db.query(Product).filter(Product.id == product_id).first()
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")

#     product.is_enabled = not product.is_enabled
#     db.commit()

#     return {
#         "message": f"Product {'enabled' if product.is_enabled else 'disabled'}",
#         "new_status": product.is_enabled,
#     }


# @router.patch("/api/products/toggle-all")
# def toggle_all_products(
#     action: Literal["0", "1"],
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     products = db.query(Product).all()
#     if not products:
#         return {"message": "No products found", "affected_count": 0}

#     is_enable = action == "1"
#     for p in products:
#         p.is_enabled = is_enable

#     db.commit()

#     return {
#         "message": f"All products {'enabled' if is_enable else 'disabled'}",
#         "affected_count": len(products),
#     }
