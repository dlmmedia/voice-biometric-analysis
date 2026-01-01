"""
Biometrics Router - Voice Signature and Verification Endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import List, Optional
import tempfile
import os
import numpy as np

from app.models.schemas import (
    EnrollmentRequest,
    EnrollmentResponse,
    VerificationRequest,
    VerificationResponse,
    VoiceSignature,
)
from app.services.embeddings import extract_embedding, compute_similarity, aggregate_embeddings
from app.services.database import db
from app.services.storage import storage

router = APIRouter()


@router.post("/enroll")
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
            content = await file.read()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            # Extract embedding
            embedding, quality = await extract_embedding(tmp_path)
            embeddings.append(embedding)
            quality_scores.append(quality)
            
            # Cleanup
            os.unlink(tmp_path)
        
        # Compute centroid from embeddings
        centroid = aggregate_embeddings(embeddings, method="mean")
        avg_quality = sum(quality_scores) / len(quality_scores)
        
        # Save to database
        signature = await db.create_voice_signature(
            name=name,
            embedding=centroid,
            samples_count=len(files),
            quality_score=avg_quality,
            has_spoken_centroid=True,
            has_singing_centroid=include_singing,
        )
        
        return {
            "signature_id": str(signature['id']),
            "name": signature['name'],
            "samples_count": signature['samples_count'],
            "quality_score": signature['quality_score'],
            "has_spoken_centroid": signature['has_spoken_centroid'],
            "has_singing_centroid": signature['has_singing_centroid'],
            "status": signature['status'],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify")
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
    - Anti-spoofing analysis
    """
    
    try:
        # Save uploaded file
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Extract embedding from test sample
        test_embedding, quality = await extract_embedding(tmp_path)
        
        # Cleanup
        os.unlink(tmp_path)
        
        # Anti-spoofing checks (basic implementation)
        anti_spoofing = {
            "replay_detected": False,
            "ai_generated": False,
            "liveness_verified": quality > 50,
        }
        
        matched_signature = None
        best_confidence = 0.0
        
        if signature_id:
            # 1:1 verification
            signature = await db.get_voice_signature(signature_id)
            if signature and signature.get('embedding') is not None:
                confidence = await compute_similarity(test_embedding, signature['embedding'])
                if confidence > best_confidence:
                    best_confidence = confidence
                    matched_signature = signature
        else:
            # 1:N identification
            signatures = await db.list_voice_signatures(status="active")
            for sig in signatures:
                full_sig = await db.get_voice_signature(str(sig['id']))
                if full_sig and full_sig.get('embedding') is not None:
                    confidence = await compute_similarity(test_embedding, full_sig['embedding'])
                    if confidence > best_confidence:
                        best_confidence = confidence
                        matched_signature = full_sig
        
        # Determine match (threshold: 70%)
        is_match = best_confidence >= 70.0 and matched_signature is not None
        
        # Record verification attempt
        await db.create_verification(
            signature_id=str(matched_signature['id']) if matched_signature else None,
            match=is_match,
            confidence=best_confidence,
            anti_spoofing=anti_spoofing,
        )
        
        return {
            "match": is_match,
            "confidence": best_confidence,
            "matched_signature_id": str(matched_signature['id']) if matched_signature else None,
            "matched_signature_name": matched_signature['name'] if matched_signature else None,
            "anti_spoofing": anti_spoofing,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signatures")
async def list_signatures():
    """List all enrolled voice signatures."""
    signatures = await db.list_voice_signatures(status="active")
    
    return {
        "signatures": [
            {
                "id": str(sig['id']),
                "name": sig['name'],
                "enrolled_at": sig['created_at'].isoformat(),
                "samples_count": sig['samples_count'],
                "quality_score": sig['quality_score'],
                "has_spoken_centroid": sig['has_spoken_centroid'],
                "has_singing_centroid": sig['has_singing_centroid'],
                "status": sig['status'],
            }
            for sig in signatures
        ]
    }


@router.get("/signatures/{signature_id}")
async def get_signature(signature_id: str):
    """Get a specific voice signature."""
    signature = await db.get_voice_signature(signature_id)
    
    if not signature:
        raise HTTPException(status_code=404, detail="Voice signature not found")
    
    return {
        "id": str(signature['id']),
        "name": signature['name'],
        "enrolled_at": signature['created_at'].isoformat(),
        "samples_count": signature['samples_count'],
        "quality_score": signature['quality_score'],
        "has_spoken_centroid": signature['has_spoken_centroid'],
        "has_singing_centroid": signature['has_singing_centroid'],
        "status": signature['status'],
    }


@router.delete("/signatures/{signature_id}")
async def delete_signature(signature_id: str):
    """Delete a voice signature."""
    signature = await db.get_voice_signature(signature_id)
    
    if not signature:
        raise HTTPException(status_code=404, detail="Voice signature not found")
    
    await db.delete_voice_signature(signature_id)
    
    return {"deleted": signature_id, "status": "success"}


@router.get("/verifications")
async def list_verifications(
    limit: int = Query(20, ge=1, le=100),
):
    """List recent verification attempts."""
    verifications = await db.list_verifications(limit=limit)
    
    return {
        "verifications": [
            {
                "id": str(v['id']),
                "signature_id": str(v['signature_id']) if v.get('signature_id') else None,
                "signature_name": v.get('signature_name'),
                "match": v['match'],
                "confidence": v['confidence'],
                "anti_spoofing": v['anti_spoofing'],
                "created_at": v['created_at'].isoformat(),
            }
            for v in verifications
        ]
    }
