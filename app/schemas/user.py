from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Request Schemas
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    mobile_number: str
    password: str
    address: str

class LoginRequest(BaseModel):
    mobile_number: str
    password: str

class ResetPasswordRequest(BaseModel):
    phone: str
    newPassword: str

# Address Schema
class Address(BaseModel):
    id: int 
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    type: str = "home"

class UserAddressUpdate(BaseModel):
    id: int
    address: Address

# Response Schema
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    addresses: Optional[List[Address]] = []

    class Config:
        from_attributes = True
