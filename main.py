from fastapi import FastAPI, Request, Cookie, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import cloudinary
import cloudinary.uploader
import os

# ------------------------------
# Cloudinary Configuration
# ------------------------------
cloudinary.config(
    cloud_name="dsjvnybg", 
    api_key="66997973198967", 
    api_secret="1y3-iZV10aXPXut_zVFY64IU10", 
    secure=True
)

# ------------------------------
# Route Imports
# ------------------------------
from app.routes import auth, products, cart, otp, payment, admins
from app.routes.admins_ops import router as admins_ops_router


# Database setup
from app.database.session import Base, engine
from app.models.product import Product  # Ensures model is registered

# Initialize FastAPI app
app = FastAPI()

# ------------------------------
# CORS Middleware
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Static files and templates
# ------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ------------------------------
# Register all routers
# ------------------------------
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(payment.router)
app.include_router(admins.router)
app.include_router(admins_ops_router)

# ------------------------------
# Create all tables in the database
# ------------------------------
Base.metadata.create_all(bind=engine)

# ------------------------------
# Root route
# ------------------------------
@app.get("/", response_class=HTMLResponse)
def index(request: Request, logged_in: str = Cookie(default=None)):
    is_logged_in = request.cookies.get("logged_in") == "true"
    return templates.TemplateResponse("products.html", {
        "request": request,
        "is_logged_in": is_logged_in
    })

# ------------------------------
# Cloudinary Upload Endpoint
# ------------------------------
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    """
    Uploads an image to Cloudinary and returns the secure URL.
    """
    try:
        temp_file = f"temp_{file.filename}"
        with open(temp_file, "wb") as f:
            f.write(await file.read())

        result = cloudinary.uploader.upload(
            temp_file,
            folder="my_uploads"
        )

        os.remove(temp_file)
        return {"image_url": result["secure_url"]}

    except Exception as e:
        return {"error": str(e)}

