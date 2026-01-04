from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ✅ Modern Declarative Base (SQLAlchemy 2.0+)
class Base(DeclarativeBase):
    pass

# ✅ Database URL
DATABASE_URL = "mysql+pymysql://root:143%40Vinay@localhost/orderms"

# ✅ Create Engine with Increased Connection Pool
engine = create_engine(
    DATABASE_URL,
    pool_size=100,         # Increased base pool
    max_overflow=400,      # Allows 500+ total connections
    pool_timeout=30,       # Wait 30s before timeout
    pool_recycle=1800,     # Recycle every 30 min
    pool_pre_ping=True     # Check connection before using
)

# ✅ Create SessionLocal
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# ✅ Dependency for FastAPI or general use
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

