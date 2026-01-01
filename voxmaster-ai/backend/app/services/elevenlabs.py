"""
ElevenLabs TTS Service

Integration with ElevenLabs API for voice generation in PersonaFlow.
"""

import httpx
import base64
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass

from app.config import settings


@dataclass
class GenerationResult:
    """Container for generation result."""
    audio_data: bytes
    duration_seconds: float
    voice_id: str
    model_id: str


# Voice type to ElevenLabs parameters mapping
VOICE_TYPE_PARAMS = {
    "command": {
        "stability": 0.75,
        "similarity_boost": 0.85,
        "style": 0.6,
        "use_speaker_boost": True,
    },
    "intimate": {
        "stability": 0.65,
        "similarity_boost": 0.70,
        "style": 0.4,
        "use_speaker_boost": False,
    },
    "storyteller": {
        "stability": 0.50,
        "similarity_boost": 0.75,
        "style": 0.8,
        "use_speaker_boost": True,
    },
    "whisper": {
        "stability": 0.80,
        "similarity_boost": 0.60,
        "style": 0.2,
        "use_speaker_boost": False,
    },
    "urgent": {
        "stability": 0.45,
        "similarity_boost": 0.80,
        "style": 0.9,
        "use_speaker_boost": True,
    },
}


class ElevenLabsService:
    """ElevenLabs API client for voice generation."""
    
    BASE_URL = "https://api.elevenlabs.io/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.elevenlabs_api_key
        self._voices_cache: Optional[Dict[str, Any]] = None
    
    @property
    def is_configured(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers."""
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        return {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
        }
    
    async def get_voices(self) -> Dict[str, Any]:
        """Get available voices from ElevenLabs."""
        if self._voices_cache:
            return self._voices_cache
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/voices",
                headers=self._get_headers(),
                timeout=30.0,
            )
            response.raise_for_status()
            self._voices_cache = response.json()
            return self._voices_cache
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        voice_type: str = "storyteller",
        model_id: str = "eleven_multilingual_v2",
        pitch_variance: float = 50.0,
        speaking_rate: float = 50.0,
    ) -> GenerationResult:
        """
        Generate speech using ElevenLabs API.
        
        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID
            voice_type: VoxMaster voice type for parameter mapping
            model_id: ElevenLabs model ID
            pitch_variance: 0-100 scale for pitch variation
            speaking_rate: 0-100 scale for speaking rate
        
        Returns:
            GenerationResult with audio data
        """
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        
        # Get voice type parameters
        params = VOICE_TYPE_PARAMS.get(voice_type, VOICE_TYPE_PARAMS["storyteller"]).copy()
        
        # Adjust based on user controls
        # Pitch variance affects stability (inverse relationship)
        params["stability"] = max(0.2, min(1.0, params["stability"] - (pitch_variance - 50) / 100))
        
        # Speaking rate doesn't directly map to ElevenLabs API
        # We could implement this with prosody SSML if needed
        
        request_body = {
            "text": text,
            "model_id": model_id,
            "voice_settings": params,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{voice_id}",
                headers=self._get_headers(),
                json=request_body,
                timeout=120.0,
            )
            response.raise_for_status()
            
            audio_data = response.content
            
            # Estimate duration (rough approximation: 150 words per minute, avg 5 chars per word)
            word_count = len(text) / 5
            duration_seconds = (word_count / 150) * 60
            
            return GenerationResult(
                audio_data=audio_data,
                duration_seconds=duration_seconds,
                voice_id=voice_id,
                model_id=model_id,
            )
    
    async def clone_voice(
        self,
        name: str,
        audio_files: list[bytes],
        description: str = "Voice cloned via VoxMaster AI",
    ) -> str:
        """
        Clone a voice from audio samples.
        
        Args:
            name: Name for the cloned voice
            audio_files: List of audio file bytes
            description: Voice description
        
        Returns:
            Voice ID of the cloned voice
        """
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        
        # Prepare multipart form data
        files = []
        for i, audio_data in enumerate(audio_files):
            files.append(("files", (f"sample_{i}.wav", audio_data, "audio/wav")))
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/voices/add",
                headers={"xi-api-key": self.api_key},
                data={"name": name, "description": description},
                files=files,
                timeout=120.0,
            )
            response.raise_for_status()
            
            result = response.json()
            return result["voice_id"]
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get user subscription info."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/user",
                headers=self._get_headers(),
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()


# Global service instance
elevenlabs = ElevenLabsService()
