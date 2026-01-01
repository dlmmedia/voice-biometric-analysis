"""
VoxMaster AI - FastAPI Backend
Automated Vocal Technique Analysis Pipeline
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path

from app.config import settings
from app.services.database import db
from app.services.storage import storage
from app.routers import analyze, biometrics, generate, reports, settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🎤 VoxMaster AI Backend Starting...")
    await db.connect()
    print(f"📊 Environment: {settings.environment}")
    print(f"🔗 Railway Storage: {'Enabled' if storage.use_railway else 'Local fallback'}")
    yield
    # Shutdown
    await db.disconnect()
    print("👋 VoxMaster AI Backend Shutting Down...")


app = FastAPI(
    title="VoxMaster AI",
    description="Unified Vocal Intelligence Platform - Automated vocal technique analysis, voice biometrics, and generative synthesis",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(biometrics.router, prefix="/api/biometrics", tags=["Biometrics"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generation"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])


# Serve local storage files (development only)
@app.get("/api/storage/{category}/{file_id}")
async def serve_storage_file(category: str, file_id: str):
    """Serve files from local storage (development mode)."""
    file_path = storage.get_local_file_path(category, file_id)
    if file_path:
        # Determine content type
        content_type = "application/octet-stream"
        if file_id.endswith(".wav"):
            content_type = "audio/wav"
        elif file_id.endswith(".mp3"):
            content_type = "audio/mpeg"
        elif file_id.endswith(".pdf"):
            content_type = "application/pdf"
        
        return FileResponse(file_path, media_type=content_type)
    
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="File not found")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "VoxMaster AI",
        "version": "0.1.0",
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    # Check database connection
    if db.demo_mode:
        db_status = "demo"
    else:
        db_status = "ready"
        try:
            async with db.connection() as conn:
                if conn:
                    await conn.fetchval("SELECT 1")
        except Exception:
            db_status = "error"
    
    return {
        "status": "healthy",
        "demo_mode": db.demo_mode,
        "services": {
            "database": db_status,
            "analysis": "ready",
            "biometrics": "ready",
            "generation": "ready" if settings.elevenlabs_api_key else "not_configured",
            "storage": "railway" if storage.use_railway else "local",
        },
    }
