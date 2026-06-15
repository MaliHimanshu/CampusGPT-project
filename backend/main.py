try:
    from fastapi import FastAPI  # type: ignore[reportMissingImports]
    from fastapi.middleware.cors import CORSMiddleware  # type: ignore
    from fastapi.staticfiles import StaticFiles  # type: ignore
except ImportError as e:
    raise ImportError(
        "fastapi is not installed. Install it with: pip install fastapi[all]"
    ) from e
import os
from app.core.database import engine, Base
from app.api import auth, upload, chat
from app.api.documents import router as documents_router
from app.api.profile import router as profile_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusGPT API",
    description="AI-Powered University Assistant",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve extracted PDF images as static files
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "data", "images")
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# Routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(documents_router)
app.include_router(profile_router)


@app.get("/")
def home():
    return {"message": "CampusGPT API is running 🎓"}


@app.get("/health")
def health():
    return {"status": "ok"}
