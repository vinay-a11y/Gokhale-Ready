from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    shelf_life_days = Column(Integer, nullable=True)
    lead_time_days = Column(Integer, nullable=True)
    packing_01 = Column(String(50), nullable=True)
    price_01 = Column(Float, nullable=True)
    packing_02 = Column(String(50), nullable=True)
    price_02 = Column(Float, nullable=True)
    packing_03 = Column(String(50), nullable=True)
    price_03 = Column(Float, nullable=True)
    packing_04 = Column(String(50), nullable=True)
    price_04 = Column(Float, nullable=True)
    description = Column(String(255), nullable=True)
    imagesrc = Column(String(255), nullable=True)
    
    # ✅ Add this field
    is_enabled = Column(Boolean, default=True)
