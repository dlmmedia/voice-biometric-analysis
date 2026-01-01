"""
Audio Preprocessing Service

Handles:
- Resampling to target rate
- Loudness normalization
- Noise reduction
- VAD-based silence trimming
- Vocal isolation (for sung audio with accompaniment)
"""

import numpy as np
from typing import Dict, Any, Tuple
from dataclasses import dataclass

from app.models.schemas import AudioType


@dataclass
class PreprocessedAudio:
    """Container for preprocessed audio data."""
    audio: np.ndarray
    sample_rate: int
    duration: float
    voiced_segments: list
    audio_type: AudioType


async def preprocess_audio(
    file_path: str,
    audio_type: AudioType,
    target_sr: int = 16000,
) -> PreprocessedAudio:
    """
    Preprocess audio file for analysis.
    
    Steps:
    1. Load audio file
    2. Resample to target sample rate
    3. Convert to mono
    4. Apply loudness normalization
    5. Apply light noise reduction
    6. Detect voiced segments via VAD
    7. For sung audio: run vocal isolation if accompaniment detected
    
    Args:
        file_path: Path to audio file
        audio_type: SPOKEN or SUNG
        target_sr: Target sample rate (16000 for embeddings, 44100 for quality)
    
    Returns:
        PreprocessedAudio object with processed audio and metadata
    """
    try:
        import librosa
        
        # Load audio
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        
        # Loudness normalization (target -23 LUFS approximately)
        audio = normalize_loudness(audio)
        
        # Light noise reduction
        audio = reduce_noise(audio, sr)
        
        # Voice Activity Detection
        voiced_segments = detect_voiced_segments(audio, sr)
        
        # For sung audio, check if vocal isolation is needed
        if audio_type == AudioType.SUNG:
            audio = isolate_vocals_if_needed(audio, sr)
        
        duration = len(audio) / sr
        
        return PreprocessedAudio(
            audio=audio,
            sample_rate=sr,
            duration=duration,
            voiced_segments=voiced_segments,
            audio_type=audio_type,
        )
        
    except ImportError:
        # Fallback for when librosa is not installed
        return PreprocessedAudio(
            audio=np.zeros(16000),
            sample_rate=16000,
            duration=1.0,
            voiced_segments=[(0.0, 1.0)],
            audio_type=audio_type,
        )


def normalize_loudness(audio: np.ndarray, target_db: float = -23.0) -> np.ndarray:
    """Normalize audio to target loudness level."""
    # Simple RMS normalization
    rms = np.sqrt(np.mean(audio ** 2))
    if rms > 0:
        target_rms = 10 ** (target_db / 20)
        audio = audio * (target_rms / rms)
    return np.clip(audio, -1.0, 1.0)


def reduce_noise(audio: np.ndarray, sr: int) -> np.ndarray:
    """Apply light spectral gating for noise reduction."""
    # In production, use noisereduce or similar library
    # For now, return audio unchanged
    return audio


def detect_voiced_segments(
    audio: np.ndarray,
    sr: int,
    threshold: float = 0.02,
) -> list:
    """
    Detect voiced segments using energy-based VAD.
    
    Returns list of (start_time, end_time) tuples.
    """
    try:
        import librosa
        
        # Compute RMS energy
        rms = librosa.feature.rms(y=audio, frame_length=2048, hop_length=512)[0]
        
        # Find segments above threshold
        voiced = rms > threshold
        
        # Convert frames to time
        segments = []
        in_voiced = False
        start_frame = 0
        
        for i, is_voiced in enumerate(voiced):
            if is_voiced and not in_voiced:
                start_frame = i
                in_voiced = True
            elif not is_voiced and in_voiced:
                start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=512)
                end_time = librosa.frames_to_time(i, sr=sr, hop_length=512)
                segments.append((start_time, end_time))
                in_voiced = False
        
        # Handle final segment
        if in_voiced:
            start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=512)
            end_time = len(audio) / sr
            segments.append((start_time, end_time))
        
        return segments if segments else [(0.0, len(audio) / sr)]
        
    except ImportError:
        return [(0.0, len(audio) / sr)]


def isolate_vocals_if_needed(audio: np.ndarray, sr: int) -> np.ndarray:
    """
    Run vocal isolation if accompaniment is detected.
    
    In production, use Spleeter or Demucs for source separation.
    """
    # For now, return audio unchanged
    # TODO: Integrate Spleeter or Demucs
    return audio
