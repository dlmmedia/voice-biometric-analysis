"""
Biometrics Router - Voice Signature and Verification Endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import tempfile
import os

from app.models.schemas import (
    EnrollmentRequest,
    EnrollmentResponse,
    VerificationRequest,
    VerificationResponse,
    VoiceSignature,
)
from app.services.embeddings import extract_embedding, compute_similarity

router = APIRouter()


@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_voice(
    files: List[UploadFile] = File(...),
    name: str = Form(...),
    include_singing: bool = Form(False),
):
    """
    Enroll a new voice signature from multiple audio samples.
    
    - **files**: Multiple audio files (minimum 3 recommended)
    - **name**: Name for the voice signature
    - **include_singing**: Whether samples include singing for singing centroid
    
    Returns:
    - Voice signature ID
    - Quality score
    - Centroid types created
    """
    
    if len(files) < 3:
        raise HTTPException(
            status_code=400,
            detail="Minimum 3 audio samples required for reliable enrollment"
        )
    
    try:
        embeddings = []
        quality_scores = []
        
        for file in files:
            # Save and process each file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            # Extract embedding
            embedding, quality = await extract_embedding(tmp_path)
            embeddings.append(embedding)
            quality_scores.append(quality)
            
            # Cleanup
            os.unlink(tmp_path)
        
        # Compute centroid from embeddings
        # In production, this would use proper aggregation
        avg_quality = sum(quality_scores) / len(quality_scores)
        
        return EnrollmentResponse(
            signature_id="sig_" + os.urandom(8).hex(),
            name=name,
            samples_count=len(files),
            quality_score=avg_quality,
            has_spoken_centroid=True,
            has_singing_centroid=include_singing,
            status="active",
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=VerificationResponse)
async def verify_identity(
    file: UploadFile = File(...),
    signature_id: Optional[str] = Form(None),
):
    """
    Verify speaker identity against enrolled signatures.
    
    - **file**: Audio sample to verify
    - **signature_id**: Optional specific signature to verify against (1:1)
                       If not provided, searches all signatures (1:N)
    
    Returns:
    - Match result (boolean)
    - Confidence score
    - Matched signature details (if found)
    """
    
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Extract embedding from test sample
        test_embedding, quality = await extract_embedding(tmp_path)
        
        # Cleanup
        os.unlink(tmp_path)
        
        # In production, compare against stored signatures
        # For now, return mock result
        
        return VerificationResponse(
            match=True,
            confidence=94.5,
            matched_signature_id=signature_id or "sig_primary",
            matched_signature_name="Primary Voice",
            anti_spoofing={
                "replay_detected": False,
                "ai_generated": False,
                "liveness_verified": True,
            },
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signatures")
async def list_signatures():
    """List all enrolled voice signatures."""
    # In production, fetch from database
    return {
        "signatures": [
            {
                "id": "sig_primary",
                "name": "Primary Voice",
                "enrolled_at": "2024-01-15",
                "samples_count": 5,
                "quality_score": 92,
                "status": "active",
            }
        ]
    }


@router.delete("/signatures/{signature_id}")
async def delete_signature(signature_id: str):
    """Delete a voice signature."""
    # In production, delete from database
    return {"deleted": signature_id, "status": "success"}
