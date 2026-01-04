from sqlalchemy import Column, Integer, String, JSON
from app.database.session import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    mobile_number = Column(String(15))
    password = Column(String(255))
    address = Column(JSON, default=list)
    customer_id = Column(String(20), unique=True, index=True)
    internal_id = Column(String(36), unique=True)
    role = Column(String(20), default="user")

    orders = relationship("Order", back_populates="user")
