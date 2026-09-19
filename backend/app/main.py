from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
import app.models  # Ensure all SQLAlchemy models are registered
from app.routers import (
    auth_router,
    rides_router,
    drivers_router,
    admin_router,
    ws_router,
    ai_router,
    notifications_router
)
from app.seed import seed_database
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rydo")

# Ensure tables exist on startup
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    logger.warning(f"Initial auto-seed check: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RYDO API starting up...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error during auto-seed: {e}")
    yield
    logger.info("RYDO API shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RYDO — Move Smarter. Ride Better. Light Luxury 3D Mobility Software Platform API.",
    lifespan=lifespan
)

# CORS configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    if origins == "*":
        origins = ["*"]
    else:
        origins = [orig.strip() for orig in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(rides_router, prefix=settings.API_V1_STR)
app.include_router(drivers_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
# Mount WebSocket router
app.include_router(ws_router)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": "RYDO API",
        "version": settings.VERSION,
        "theme": "Light Luxury Mobility",
        "environment": settings.ENVIRONMENT
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "RYDO API",
        "tagline": "Move Smarter. Ride Better.",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
