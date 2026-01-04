from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from datetime import datetime

class UserDetails(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str


class CartItem(BaseModel):
    id: int
    name: str
    price: float
    quantity: int


class OrderCreateSchema(BaseModel):
    name: str            # <-- added
    phone: str          # <-- added
    amount: float
    items: List[CartItem]
    userDetails: UserDetails
    deliveryAddress: Dict[str, Any]  
    orderDate: datetime

class OrderStatusUpdate(BaseModel):
    order_status: str
