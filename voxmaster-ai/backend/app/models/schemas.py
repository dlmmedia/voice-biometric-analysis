"""
Pydantic Models for VoxMaster AI API
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class AudioType(str, Enum):
    SPOKEN = "spoken"
    SUNG = "sung"


class PromptType(str, Enum):
    SUSTAINED = "sustained"
    PASSAGE = "passage"
    VERSE = "verse"


class VoiceType(str, Enum):
    COMMAND = "command"
    INTIMATE = "intimate"
    STORYTELLER = "storyteller"
    WHISPER = "whisper"
    URGENT = "urgent"


class PerceptualProfile(str, Enum):
    PODCAST = "podcast"
    WARM = "warm"
    BROADCAST = "broadcast"
    ASMR = "asmr"


# ============== Analysis Models ==============

class TimbreScores(BaseModel):
    brightness: float = Field(..., ge=0, le=100, description="Spectral brightness score")
    breathiness: float = Field(..., ge=0, le=100, description="Breathiness score")
    warmth: float = Field(..., ge=0, le=100, description="Warmth score")
    roughness: float = Field(..., ge=0, le=100, description="Roughness score")


class WeightScores(BaseModel):
    weight: float = Field(..., ge=0, le=100, description="Light (0) to Heavy (100) scale")
    pressed: float = Field(..., ge=0, le=100, description="Breathy (0) to Pressed (100) scale")


class PlacementScores(BaseModel):
    forwardness: float = Field(..., ge=0, le=100, description="Back (0) to Forward (100)")
    ring_index: float = Field(..., ge=0, le=100, description="Singer's formant strength")
    nasality: float = Field(..., ge=0, le=100, description="Nasality measure")


class SweetSpotScore(BaseModel):
    clarity: float = Field(..., ge=0, le=100)
    warmth: float = Field(..., ge=0, le=100)
    presence: float = Field(..., ge=0, le=100)
    smoothness: float = Field(..., ge=0, le=100)
    harshness_penalty: float = Field(..., ge=0, le=100)
    total: float = Field(..., ge=0, le=100, description="Weighted composite score")


class AcousticFeatures(BaseModel):
    spectral_centroid: float = Field(..., description="Hz")
    spectral_rolloff: Optional[float] = None
    hnr: float = Field(..., description="Harmonics-to-Noise Ratio in dB")
    cpp: float = Field(..., description="Cepstral Peak Prominence in dB")
    h1_h2: float = Field(..., description="H1-H2 ratio in dB")
    f0_mean: float = Field(..., description="Mean fundamental frequency in Hz")
    f0_range: List[float] = Field(..., description="[min, max] F0 in Hz")
    formants: Dict[str, float] = Field(..., description="F1-F4 frequencies in Hz")
    mfccs: Optional[List[float]] = Field(None, description="13 MFCC coefficients")
    jitter: Optional[float] = None
    shimmer: Optional[float] = None


class AnalysisRequest(BaseModel):
    audio_type: AudioType = AudioType.SPOKEN
    prompt_type: PromptType = PromptType.SUSTAINED


class AnalysisResponse(BaseModel):
    filename: str
    audio_type: str
    prompt_type: str
    timbre: TimbreScores
    weight: WeightScores
    placement: PlacementScores
    sweet_spot: SweetSpotScore
    features: AcousticFeatures
    analyzed_at: datetime = Field(default_factory=datetime.now)


# ============== Biometrics Models ==============

class VoiceSignature(BaseModel):
    id: str
    name: str
    enrolled_at: datetime
    samples_count: int
    quality_score: float = Field(..., ge=0, le=100)
    status: str = "active"
    has_spoken_centroid: bool = True
    has_singing_centroid: bool = False


class EnrollmentRequest(BaseModel):
    name: str
    include_singing: bool = False


class EnrollmentResponse(BaseModel):
    signature_id: str
    name: str
    samples_count: int
    quality_score: float
    has_spoken_centroid: bool
    has_singing_centroid: bool
    status: str


class VerificationRequest(BaseModel):
    signature_id: Optional[str] = None  # If None, search all (1:N)


class AntiSpoofingResult(BaseModel):
    replay_detected: bool = False
    ai_generated: bool = False
    liveness_verified: bool = True


class VerificationResponse(BaseModel):
    match: bool
    confidence: float = Field(..., ge=0, le=100)
    matched_signature_id: Optional[str] = None
    matched_signature_name: Optional[str] = None
    anti_spoofing: AntiSpoofingResult


# ============== Generation Models ==============

class GenerationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    signature_id: str
    voice_type: VoiceType = VoiceType.STORYTELLER
    inflections: List[str] = Field(default_factory=list)
    perceptual_profile: PerceptualProfile = PerceptualProfile.PODCAST
    pitch_variance: float = Field(default=50, ge=0, le=100)
    speaking_rate: float = Field(default=50, ge=0, le=100)
    expressiveness: float = Field(default=70, ge=0, le=100)


class VerificationScores(BaseModel):
    identity_match: float
    voice_type_accuracy: float
    perceptual_match: float


class GenerationResponse(BaseModel):
    generation_id: str
    status: str
    audio_url: Optional[str] = None
    audio_base64: Optional[str] = None
    duration_seconds: Optional[float] = None
    voice_type: VoiceType
    perceptual_profile: PerceptualProfile
    verification_scores: VerificationScores
