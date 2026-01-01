"""
Analysis Router - Vocal Technique Analysis Endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import tempfile
import os

from app.services.preprocessing import preprocess_audio
from app.services.feature_extraction import extract_features
from app.services.scoring import calculate_scores
from app.models.schemas import AnalysisRequest, AnalysisResponse, AudioType

router = APIRouter()


@router.post("/", response_model=AnalysisResponse)
async def analyze_audio(
    file: UploadFile = File(...),
    audio_type: str = Form("spoken"),
    prompt_type: str = Form("sustained"),
):
    """
    Analyze uploaded audio file for vocal technique characteristics.
    
    - **file**: Audio file (WAV, MP3, M4A)
    - **audio_type**: Either 'spoken' or 'sung'
    - **prompt_type**: 'sustained', 'passage', or 'verse'
    
    Returns comprehensive vocal analysis including:
    - Timbre scores (brightness, breathiness, warmth, roughness)
    - Vocal weight (light-heavy scale, pressed-breathy scale)
    - Tone placement (forwardness, ring index, nasality)
    - Sweet Spot Score
    - Raw acoustic features
    """
    
    # Validate file type
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/x-wav"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Process audio
        audio_type_enum = AudioType.SUNG if audio_type == "sung" else AudioType.SPOKEN
        
        # Step 1: Preprocess audio
        preprocessed = await preprocess_audio(tmp_path, audio_type_enum)
        
        # Step 2: Extract features
        features = await extract_features(preprocessed, audio_type_enum)
        
        # Step 3: Calculate scores
        scores = await calculate_scores(features, audio_type_enum)
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
        return AnalysisResponse(
            filename=file.filename,
            audio_type=audio_type,
            prompt_type=prompt_type,
            timbre=scores["timbre"],
            weight=scores["weight"],
            placement=scores["placement"],
            sweet_spot=scores["sweet_spot"],
            features=features,
        )
        
    except Exception as e:
        # Cleanup on error
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/features")
async def list_features():
    """List all extractable acoustic features."""
    return {
        "spectral": [
            "spectral_centroid",
            "spectral_rolloff",
            "spectral_contrast",
            "spectral_flatness",
        ],
        "harmonic": [
            "hnr",
            "cpp",
            "h1_h2",
            "h1_a2",
            "h1_a3",
        ],
        "formants": ["f1", "f2", "f3", "f4"],
        "cepstral": ["mfcc_1", "mfcc_2", "...", "mfcc_13"],
        "pitch": ["f0_mean", "f0_std", "f0_range", "jitter", "shimmer"],
    }


@router.get("/scoring-info")
async def scoring_info():
    """Get information about the scoring methodology."""
    return {
        "timbre": {
            "brightness": "Normalized spectral centroid + rolloff (0-100)",
            "breathiness": "Inverse HNR + noise energy above 3.5kHz (0-100)",
            "warmth": "Low harmonic strength + spectral slope (0-100)",
            "roughness": "Inharmonicity + jitter/shimmer (0-100)",
        },
        "weight": {
            "light_heavy": "CPP + spectral tilt + H1-H2 (0-100, 0=light, 100=heavy)",
            "pressed_breathy": "HNR + open quotient proxy (0-100, 0=breathy, 100=pressed)",
        },
        "placement": {
            "forwardness": "2.5-4kHz energy + ring peak + formant stability (0-100)",
            "ring_index": "Singer's formant (2.5-3.5kHz) strength (0-100)",
            "nasality": "Anti-resonance detection (0-100)",
        },
        "sweet_spot": {
            "formula": "0.25×Clarity + 0.20×Warmth + 0.20×Presence + 0.15×Smoothness + 0.20×(100-Harshness)",
            "range": "0-100",
        },
    }
