"""
Settings Router - User Preferences and API Key Management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.database import db
from app.config import settings as app_settings

router = APIRouter()


class NotificationSettings(BaseModel):
    analysis_complete: bool = True
    generation_complete: bool = True
    security_alerts: bool = True
    product_updates: bool = False


class PrivacySettings(BaseModel):
    voice_bank: bool = False
    generation_token: bool = True
    analytics: bool = False


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    compact_mode: Optional[bool] = None
    default_audio_type: Optional[str] = None
    auto_export_reports: Optional[bool] = None
    notifications: Optional[NotificationSettings] = None
    privacy: Optional[PrivacySettings] = None


class APIKeyUpdate(BaseModel):
    key_type: str  # elevenlabs, openai
    api_key: str


class APIKeyVerifyRequest(BaseModel):
    key_type: str
    api_key: str


@router.get("/")
async def get_settings():
    """Get current user settings."""
    user_settings = await db.get_or_create_settings()
    
    return {
        "theme": user_settings.get('theme', 'system'),
        "compact_mode": user_settings.get('compact_mode', False),
        "default_audio_type": user_settings.get('default_audio_type', 'spoken'),
        "auto_export_reports": user_settings.get('auto_export_reports', False),
        "notifications": user_settings.get('notifications', {
            "analysis_complete": True,
            "generation_complete": True,
            "security_alerts": True,
            "product_updates": False,
        }),
        "privacy": user_settings.get('privacy', {
            "voice_bank": False,
            "generation_token": True,
            "analytics": False,
        }),
        "api_keys": {
            "elevenlabs": bool(user_settings.get('elevenlabs_api_key_encrypted')),
            "openai": bool(user_settings.get('openai_api_key_encrypted')),
        },
    }


@router.patch("/")
async def update_settings(update: SettingsUpdate):
    """Update user settings."""
    updates = {}
    
    if update.theme is not None:
        if update.theme not in ['light', 'dark', 'system']:
            raise HTTPException(status_code=400, detail="Invalid theme value")
        updates['theme'] = update.theme
    
    if update.compact_mode is not None:
        updates['compact_mode'] = update.compact_mode
    
    if update.default_audio_type is not None:
        if update.default_audio_type not in ['spoken', 'sung']:
            raise HTTPException(status_code=400, detail="Invalid audio type")
        updates['default_audio_type'] = update.default_audio_type
    
    if update.auto_export_reports is not None:
        updates['auto_export_reports'] = update.auto_export_reports
    
    if update.notifications is not None:
        updates['notifications'] = update.notifications.model_dump()
    
    if update.privacy is not None:
        updates['privacy'] = update.privacy.model_dump()
    
    if updates:
        await db.update_settings(**updates)
    
    return await get_settings()


@router.post("/api-keys")
async def save_api_key(request: APIKeyUpdate):
    """Save an API key (encrypted)."""
    # In production, encrypt the API key before storing
    # For now, we'll store it directly (should use proper encryption)
    
    if request.key_type == "elevenlabs":
        await db.update_settings(elevenlabs_api_key_encrypted=request.api_key)
    elif request.key_type == "openai":
        await db.update_settings(openai_api_key_encrypted=request.api_key)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown key type: {request.key_type}")
    
    return {"status": "saved", "key_type": request.key_type}


@router.post("/api-keys/verify")
async def verify_api_key(request: APIKeyVerifyRequest):
    """Verify an API key by making a test request."""
    import httpx
    
    try:
        if request.key_type == "elevenlabs":
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.elevenlabs.io/v1/user",
                    headers={"xi-api-key": request.api_key},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "valid": True,
                        "key_type": "elevenlabs",
                        "info": {
                            "subscription": user_data.get("subscription", {}).get("tier"),
                            "character_limit": user_data.get("subscription", {}).get("character_limit"),
                        }
                    }
                else:
                    return {"valid": False, "key_type": "elevenlabs", "error": "Invalid API key"}
        
        elif request.key_type == "openai":
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {request.api_key}"},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    return {"valid": True, "key_type": "openai"}
                else:
                    return {"valid": False, "key_type": "openai", "error": "Invalid API key"}
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown key type: {request.key_type}")
    
    except httpx.TimeoutException:
        return {"valid": False, "key_type": request.key_type, "error": "Request timeout"}
    except Exception as e:
        return {"valid": False, "key_type": request.key_type, "error": str(e)}


@router.delete("/api-keys/{key_type}")
async def delete_api_key(key_type: str):
    """Delete an API key."""
    if key_type == "elevenlabs":
        await db.update_settings(elevenlabs_api_key_encrypted=None)
    elif key_type == "openai":
        await db.update_settings(openai_api_key_encrypted=None)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown key type: {key_type}")
    
    return {"status": "deleted", "key_type": key_type}


@router.get("/api-usage")
async def get_api_usage():
    """Get API usage statistics."""
    # In production, track actual API usage
    # For now, return placeholder data
    return {
        "today": 0,
        "this_month": 0,
        "estimated_cost": 0.00,
    }


@router.delete("/data/signatures")
async def delete_all_signatures():
    """Delete all voice signatures (danger zone)."""
    count = await db.delete_all_signatures()
    return {"deleted_count": count, "status": "success"}


@router.get("/data/export")
async def export_user_data():
    """Export all user data."""
    import json
    
    # Gather all user data
    signatures = await db.list_voice_signatures()
    analyses = await db.list_analyses(limit=1000)
    reports = await db.list_reports(limit=1000)
    verifications = await db.list_verifications(limit=1000)
    user_settings = await db.get_or_create_settings()
    
    # Remove sensitive data
    for sig in signatures:
        sig.pop('embedding', None)
    
    export_data = {
        "exported_at": str(db),
        "voice_signatures": signatures,
        "analyses": analyses,
        "reports": reports,
        "verification_history": verifications,
        "settings": user_settings,
    }
    
    from fastapi.responses import Response
    return Response(
        content=json.dumps(export_data, default=str, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=voxmaster_data_export.json"}
    )
