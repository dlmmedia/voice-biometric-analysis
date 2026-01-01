"""
VoxMaster AI - FastAPI Backend
Automated Vocal Technique Analysis Pipeline
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import analyze, biometrics, generate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🎤 VoxMaster AI Backend Starting...")
    yield
    # Shutdown
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
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(biometrics.router, prefix="/api/biometrics", tags=["Biometrics"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generation"])


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
    return {
        "status": "healthy",
        "services": {
            "analysis": "ready",
            "biometrics": "ready",
            "generation": "ready",
        },
    }
