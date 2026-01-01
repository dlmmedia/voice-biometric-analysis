"""
Generation Router - PersonaFlow Voice Generation Endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io

from app.models.schemas import (
    GenerationRequest,
    GenerationResponse,
    VoiceType,
    PerceptualProfile,
)

router = APIRouter()


@router.post("/", response_model=GenerationResponse)
async def generate_voice(request: GenerationRequest):
    """
    Generate voice audio using PersonaFlow layered control.
    
    Layers:
    1. **Identity**: Voice signature for speaker conditioning
    2. **Voice Type**: Command, Intimate, Storyteller, Whisper, Urgent
    3. **Inflections**: Punch, Drawl, Uptalk, Breath Pause
    4. **Perceptual Profile**: Podcast Clarity, Warm/Intimate, Broadcast, ASMR
    
    Returns:
    - Generation ID
    - Audio URL or base64 data
    - Analysis verification scores
    """
    
    if not request.text:
        raise HTTPException(status_code=400, detail="Text prompt is required")
    
    if not request.signature_id:
        raise HTTPException(status_code=400, detail="Voice signature ID is required")
    
    # In production, this would:
    # 1. Load voice signature/embedding
    # 2. Map voice type to parameter ranges
    # 3. Call Eleven Labs API with conditioning
    # 4. Apply perceptual optimization
    # 5. Return generated audio
    
    # For now, return mock response
    return GenerationResponse(
        generation_id="gen_" + request.signature_id[-8:],
        status="completed",
        audio_url="/api/generate/audio/gen_mock",
        duration_seconds=12.5,
        voice_type=request.voice_type,
        perceptual_profile=request.perceptual_profile,
        verification_scores={
            "identity_match": 96.2,
            "voice_type_accuracy": 89.5,
            "perceptual_match": 91.0,
        },
    )


@router.get("/audio/{generation_id}")
async def get_audio(generation_id: str):
    """Stream generated audio file."""
    # In production, retrieve from storage
    raise HTTPException(status_code=404, detail="Audio not found")


@router.get("/voice-types")
async def list_voice_types():
    """List available voice types with parameter mappings."""
    return {
        "voice_types": [
            {
                "id": "command",
                "name": "Command",
                "description": "Authoritative, high presence",
                "parameters": {
                    "weight": "heavy",
                    "pitch_variance": "low",
                    "presence": "high",
                },
            },
            {
                "id": "intimate",
                "name": "Intimate",
                "description": "Warm, soft, close proximity",
                "parameters": {
                    "weight": "light",
                    "pitch_variance": "medium",
                    "presence": "medium",
                },
            },
            {
                "id": "storyteller",
                "name": "Storyteller",
                "description": "Engaging, dynamic range",
                "parameters": {
                    "weight": "medium",
                    "pitch_variance": "high",
                    "presence": "medium",
                },
            },
            {
                "id": "whisper",
                "name": "Whisper",
                "description": "Breathy, low volume",
                "parameters": {
                    "weight": "light",
                    "pitch_variance": "low",
                    "presence": "low",
                },
            },
            {
                "id": "urgent",
                "name": "Urgent",
                "description": "Fast-paced, high energy",
                "parameters": {
                    "weight": "heavy",
                    "pitch_variance": "medium",
                    "presence": "high",
                },
            },
        ]
    }


@router.get("/perceptual-profiles")
async def list_perceptual_profiles():
    """List available perceptual optimization profiles."""
    return {
        "profiles": [
            {
                "id": "podcast",
                "name": "Podcast Clarity",
                "target_metrics": {
                    "clarity": 85,
                    "warmth": 60,
                    "presence": 75,
                },
            },
            {
                "id": "warm",
                "name": "Warm/Intimate",
                "target_metrics": {
                    "clarity": 65,
                    "warmth": 85,
                    "presence": 55,
                },
            },
            {
                "id": "broadcast",
                "name": "Broadcast",
                "target_metrics": {
                    "clarity": 90,
                    "warmth": 50,
                    "presence": 80,
                },
            },
            {
                "id": "asmr",
                "name": "ASMR",
                "target_metrics": {
                    "clarity": 70,
                    "warmth": 75,
                    "presence": 40,
                },
            },
        ]
    }
