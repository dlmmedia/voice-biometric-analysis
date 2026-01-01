"""
Analysis Router - Vocal Technique Analysis Endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
import tempfile
import os

from app.services.preprocessing import preprocess_audio
from app.services.feature_extraction import extract_features
from app.services.scoring import calculate_scores
from app.services.database import db
from app.services.storage import storage
from app.models.schemas import AnalysisRequest, AnalysisResponse, AudioType

router = APIRouter()


@router.post("/")
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
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/x-wav", "audio/x-m4a"]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: WAV, MP3, M4A"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Save uploaded file temporarily for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Upload to storage
        audio_url = None
        try:
            _, audio_url = await storage.upload_audio(content, file.filename or "audio.wav")
        except Exception as storage_error:
            print(f"Warning: Could not upload to storage: {storage_error}")
        
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
        
        # Convert features to dict for storage
        features_dict = {
            "spectral_centroid": features.spectral_centroid,
            "spectral_rolloff": features.spectral_rolloff,
            "hnr": features.hnr,
            "cpp": features.cpp,
            "h1_h2": features.h1_h2,
            "f0_mean": features.f0_mean,
            "f0_range": features.f0_range,
            "formants": features.formants,
            "mfccs": features.mfccs,
            "jitter": features.jitter,
            "shimmer": features.shimmer,
        }
        
        # Convert scores to dicts
        timbre_dict = {
            "brightness": scores["timbre"].brightness,
            "breathiness": scores["timbre"].breathiness,
            "warmth": scores["timbre"].warmth,
            "roughness": scores["timbre"].roughness,
        }
        weight_dict = {
            "weight": scores["weight"].weight,
            "pressed": scores["weight"].pressed,
        }
        placement_dict = {
            "forwardness": scores["placement"].forwardness,
            "ring_index": scores["placement"].ring_index,
            "nasality": scores["placement"].nasality,
        }
        sweet_spot_dict = {
            "clarity": scores["sweet_spot"].clarity,
            "warmth": scores["sweet_spot"].warmth,
            "presence": scores["sweet_spot"].presence,
            "smoothness": scores["sweet_spot"].smoothness,
            "harshness_penalty": scores["sweet_spot"].harshness_penalty,
            "total": scores["sweet_spot"].total,
        }
        
        # Save to database
        analysis = await db.create_analysis(
            filename=file.filename or "audio.wav",
            audio_url=audio_url,
            audio_type=audio_type,
            prompt_type=prompt_type,
            timbre=timbre_dict,
            weight=weight_dict,
            placement=placement_dict,
            sweet_spot=sweet_spot_dict,
            features=features_dict,
        )
        
        return {
            "id": str(analysis['id']),
            "filename": analysis['filename'],
            "audio_url": analysis['audio_url'],
            "audio_type": analysis['audio_type'],
            "prompt_type": analysis['prompt_type'],
            "timbre": analysis['timbre'],
            "weight": analysis['weight'],
            "placement": analysis['placement'],
            "sweet_spot": analysis['sweet_spot'],
            "features": analysis['features'],
            "analyzed_at": analysis['created_at'].isoformat(),
        }
        
    except Exception as e:
        # Cleanup on error
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_analyses(
    limit: int = Query(20, ge=1, le=100),
):
    """List recent analyses."""
    analyses = await db.list_analyses(limit=limit)
    
    return {
        "analyses": [
            {
                "id": str(a['id']),
                "filename": a['filename'],
                "audio_type": a.get('audio_type'),
                "prompt_type": a.get('prompt_type'),
                "sweet_spot": a.get('sweet_spot'),
                "created_at": a['created_at'].isoformat(),
            }
            for a in analyses
        ]
    }


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get a specific analysis by ID."""
    analysis = await db.get_analysis(analysis_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "id": str(analysis['id']),
        "filename": analysis['filename'],
        "audio_url": analysis.get('audio_url'),
        "audio_type": analysis['audio_type'],
        "prompt_type": analysis['prompt_type'],
        "timbre": analysis['timbre'],
        "weight": analysis['weight'],
        "placement": analysis['placement'],
        "sweet_spot": analysis['sweet_spot'],
        "features": analysis['features'],
        "analyzed_at": analysis['created_at'].isoformat(),
    }


@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete an analysis."""
    analysis = await db.get_analysis(analysis_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Delete audio file from storage
    if analysis.get('audio_url'):
        await storage.delete_file(analysis['audio_url'])
    
    # Delete from database
    await db.delete_analysis(analysis_id)
    
    return {"deleted": analysis_id, "status": "success"}


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
