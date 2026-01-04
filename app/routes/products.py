from fastapi import APIRouter, Body, HTTPException, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.product import Product
from app.schemas.product import ProductsCreate, ProductCreate
from typing import Literal  # Add this line

import traceback
router = APIRouter()
templates = Jinja2Templates(directory="templates")


# HTML: Product listing page
@router.get("/product", response_class=HTMLResponse)
def product_page(request: Request):
    return templates.TemplateResponse("products.html", {"request": request})


# HTML: Product details page
@router.get("/product-details.html", response_class=HTMLResponse)
def product_details(request: Request):
    return templates.TemplateResponse("product-details.html", {"request": request})


# API: Get all products
@router.get("/api/products")
def get_all_products(db: Session = Depends(get_db)):
    try:
        # ✅ Only fetch enabled products
        products = db.query(Product).filter(Product.is_enabled == True).all()
        product_list = []

        for p in products:
            variants = []
            if p.price_01 is not None:
                variants.append({"packing": p.packing_01 or "Var 1", "price": p.price_01})
            if p.price_02 is not None:
                variants.append({"packing": p.packing_02 or "Var 2", "price": p.price_02})
            if p.price_03 is not None:
                variants.append({"packing": p.packing_03 or "Var 3", "price": p.price_03})
            if p.price_04 is not None:
                variants.append({"packing": p.packing_04 or "Var 4", "price": p.price_04})

            max_price = max((v["price"] for v in variants), default=0)

            product_list.append({
                "id": p.id,
                "item_name": p.item_name,
                "category": p.category,
                "description": p.description,
                "image_url": p.imagesrc,
                "variants": variants,
                "max_price": max_price,
                "is_enabled": p.is_enabled
            })

        return product_list

    except Exception as e:
        print("Error getting products:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@router.get("/api/products-state")
def get_all_products_with_status(db: Session = Depends(get_db)):
    """Get all products with proper shelf life and pricing data"""
    try:
        products = db.query(Product).all()
        product_list = []

        for p in products:
            if p is None:
                continue    
            
            # Build variants array from individual fields
            variants = []
            if p.price_01 is not None and p.price_01 > 0:
                variants.append({"packing": p.packing_01 or "200", "price": float(p.price_01)})
            if p.price_02 is not None and p.price_02 > 0:
                variants.append({"packing": p.packing_02 or "500", "price": float(p.price_02)})
            if p.price_03 is not None and p.price_03 > 0:
                variants.append({"packing": p.packing_03 or "1000", "price": float(p.price_03)})
            if p.price_04 is not None and p.price_04 > 0:
                variants.append({"packing": p.packing_04 or "1500", "price": float(p.price_04)})

            max_price = max((v["price"] for v in variants), default=0)

            product_list.append({
                "id": p.id,
                "item_name": p.item_name,
                "category": p.category,
                "description": p.description,
                "image_url": p.imagesrc,
                
                # Individual fields for editing
                "packing_01": p.packing_01,
                "price_01": float(p.price_01) if p.price_01 else None,
                "packing_02": p.packing_02,
                "price_02": float(p.price_02) if p.price_02 else None,
                "packing_03": p.packing_03,
                "price_03": float(p.price_03) if p.price_03 else None,
                "packing_04": p.packing_04,
                "price_04": float(p.price_04) if p.price_04 else None,
                
                # Variants array for display
                "variants": variants,
                "max_price": max_price,
                
                # Fixed: Include shelf life and lead time
                "shelf_life_days": getattr(p, 'shelf_life_days', None),
                "lead_time_days": getattr(p, 'lead_time_days', None),
                
                "is_enabled": p.is_enabled
            })

        return product_list

    except Exception as e:
        print("Error getting products with status:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@router.put("/api/products/{product_id}")
def update_product(product_id: int, product_data: dict, db: Session = Depends(get_db)):
    """Update product with edit functionality"""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Update all provided fields
        for key, value in product_data.items():
            if hasattr(product, key):
                setattr(product, key, value)
        
        db.commit()
        db.refresh(product)
        return {"message": "Product updated successfully", "product_id": product_id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update product: {str(e)}")

# API: Get single product by ID
@router.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "item_name": product.item_name,
        "description": product.description,
        "category": product.category,
        "price_01": product.price_01,
        "price_02": product.price_02,
        "price_03": product.price_03,
        "price_04": product.price_04,
        "packing_01": product.packing_01,
        "packing_02": product.packing_02,
        "packing_03": product.packing_03,
        "packing_04": product.packing_04,
        "shelf_life_days": product.shelf_life_days,
        "lead_time_days": product.lead_time_days,
        "image_url": product.imagesrc,
        "is_enabled": product.is_enabled  # ✅ Added
    }
@router.post("/api/products/add")
def add_product(
    product: ProductsCreate = Body(...),
    db: Session = Depends(get_db),
):
    try:
        new_product = Product(
            item_name=product.item_name,
            category=product.category,
            description=product.description,
            shelf_life_days=product.shelf_life_days,
            lead_time_days=product.lead_time_days,
            imagesrc=product.imagesrc,
            packing_01=product.packing_01,
            price_01=product.price_01,
            packing_02=product.packing_02,
            price_02=product.price_02,
            packing_03=product.packing_03,
            price_03=product.price_03,
            packing_04=product.packing_04,
            price_04=product.price_04,
            is_enabled=True
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        return {"message": "Product added successfully", "product_id": new_product.id}

    except Exception as e:
        db.rollback()
        print(traceback.format_exc())  # <-- Print full traceback to console/logs
        raise HTTPException(status_code=500, detail=f"Failed to add product: {str(e)}")


# API: Delete product
@router.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        db.delete(product)
        db.commit()
        return {"message": f"Product with ID {product_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")


# ✅ API: Toggle product enable/disable
@router.patch("/api/products/{product_id}/toggle")
def toggle_product_status(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_enabled = not product.is_enabled
    db.commit()
    db.refresh(product)

    return {
        "message": f"Product {'enabled' if product.is_enabled else 'disabled'} successfully",
        "product_id": product.id,
        "new_status": product.is_enabled
    }

@router.patch("/api/products/toggle-all")
def toggle_all_products(
    action: Literal["0", "1"],
    db: Session = Depends(get_db)
):
    """
    Enable or disable all products at once.

    action: "1" or "0"
    """
    products = db.query(Product).all()
    if not products:
        return {"message": "No products found."}

    is_enable = True if action == "1" else False
    for product in products:
        product.is_enabled = is_enable

    db.commit()
    return {
        "message": f"All products have been {action}d successfully.",
        "affected_count": len(products)
    }
