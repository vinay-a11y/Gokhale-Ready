
from pydantic import BaseModel

class PhoneNumberRequest(BaseModel):
    phone: str  

class VerifyRequest(BaseModel):
    phone: str
    code: str
