from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    id: int
    item_name: str
    category: Optional[str] = None
    shelf_life_days: Optional[int] = None
    lead_time_days: Optional[int] = None
    packing_01: Optional[str] = None
    price_01: Optional[float] = None
    packing_02: Optional[str] = None
    price_02: Optional[float] = None
    packing_03: Optional[str] = None
    price_03: Optional[float] = None
    packing_04: Optional[str] = None
    price_04: Optional[float] = None
    description: Optional[str] = None
    imagesrc: Optional[str] = None
    is_enabled: Optional[bool] = True  # ✅ Add this field

    class Config:
        from_attributes = True




# ✅ For creating product (without ID — let DB handle autoincrement)
class ProductsCreate(BaseModel):
    item_name: str
    category: Optional[str] = None
    shelf_life_days: Optional[int] = None
    lead_time_days: Optional[int] = None
    packing_01: Optional[str] = None
    price_01: Optional[float] = None
    packing_02: Optional[str] = None
    price_02: Optional[float] = None
    packing_03: Optional[str] = None
    price_03: Optional[float] = None
    packing_04: Optional[str] = None
    price_04: Optional[float] = None
    description: Optional[str] = None
    imagesrc: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2
