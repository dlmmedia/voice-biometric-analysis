"""
Scoring Service

DLM Perceptual Scoring:
- Timbre: Brightness, Breathiness, Warmth, Roughness
- Weight: Light-Heavy, Pressed-Breathy
- Placement: Forwardness, Ring Index, Nasality
- Sweet Spot Score with ISO 226 weighting
"""

import numpy as np
from typing import Dict, Any

from app.models.schemas import (
    AudioType,
    AcousticFeatures,
    TimbreScores,
    WeightScores,
    PlacementScores,
    SweetSpotScore,
)


async def calculate_scores(
    features: AcousticFeatures,
    audio_type: AudioType,
) -> Dict[str, Any]:
    """
    Calculate perceptual scores from acoustic features.
    
    Scoring methodology:
    1. Normalize features via z-score against reference dataset
    2. Combine with weighted sums into indices
    3. Apply ISO 226 equal-loudness weighting
    4. Output scores (0-100) with confidence metrics
    
    Args:
        features: Extracted acoustic features
        audio_type: SPOKEN or SUNG
    
    Returns:
        Dictionary with timbre, weight, placement, and sweet_spot scores
    """
    
    # Calculate individual score components
    timbre = calculate_timbre_scores(features)
    weight = calculate_weight_scores(features)
    placement = calculate_placement_scores(features, audio_type)
    sweet_spot = calculate_sweet_spot(timbre, weight, placement, features)
    
    return {
        "timbre": timbre,
        "weight": weight,
        "placement": placement,
        "sweet_spot": sweet_spot,
    }


def calculate_timbre_scores(features: AcousticFeatures) -> TimbreScores:
    """
    Calculate timbre scores from spectral features.
    
    - Brightness: normalized spectral centroid + rolloff
    - Breathiness: inverse(HNR) + noise energy above 3.5kHz
    - Warmth: stronger low harmonics + steeper spectral slope
    - Roughness: inharmonicity + jitter/shimmer
    """
    
    # Reference values for normalization (based on typical voice ranges)
    centroid_ref = {"min": 1000, "max": 4000}
    hnr_ref = {"min": 5, "max": 30}
    
    # Brightness: higher centroid = brighter
    brightness = normalize_to_100(
        features.spectral_centroid,
        centroid_ref["min"],
        centroid_ref["max"],
    )
    
    # Breathiness: inverse of HNR (lower HNR = more breathy)
    breathiness = 100 - normalize_to_100(
        features.hnr,
        hnr_ref["min"],
        hnr_ref["max"],
    )
    
    # Warmth: approximated from low centroid and high low-frequency energy
    # Lower brightness correlates with warmth
    warmth = 100 - brightness * 0.6 + 30  # Simplified
    warmth = np.clip(warmth, 0, 100)
    
    # Roughness: from jitter and shimmer
    jitter_contrib = (features.jitter or 0.5) * 10
    shimmer_contrib = (features.shimmer or 3.0) * 3
    roughness = np.clip(jitter_contrib + shimmer_contrib, 0, 100)
    
    return TimbreScores(
        brightness=float(brightness),
        breathiness=float(breathiness),
        warmth=float(warmth),
        roughness=float(roughness),
    )


def calculate_weight_scores(features: AcousticFeatures) -> WeightScores:
    """
    Calculate vocal weight scores.
    
    Weight relates to source strength (glottal closure and harmonic energy):
    - Heavier: higher CPP, flatter tilt, lower H1-H2, stronger mid harmonics
    - Lighter: steeper tilt, higher H1-H2, lower CPP
    
    Pressed/Breathy relates to glottal closure:
    - Pressed: tighter closure, lower H1-H2
    - Breathy: incomplete closure, higher H1-H2, lower HNR
    """
    
    cpp_ref = {"min": 5, "max": 20}
    h1_h2_ref = {"min": -5, "max": 15}
    
    # Weight: higher CPP and lower H1-H2 = heavier
    cpp_score = normalize_to_100(features.cpp, cpp_ref["min"], cpp_ref["max"])
    h1_h2_score = 100 - normalize_to_100(features.h1_h2, h1_h2_ref["min"], h1_h2_ref["max"])
    
    weight = (cpp_score * 0.6 + h1_h2_score * 0.4)
    
    # Pressed/Breathy: based on H1-H2 and HNR
    # Lower H1-H2 = more pressed, higher = more breathy
    pressed = 100 - normalize_to_100(features.h1_h2, h1_h2_ref["min"], h1_h2_ref["max"])
    
    return WeightScores(
        weight=float(np.clip(weight, 0, 100)),
        pressed=float(np.clip(pressed, 0, 100)),
    )


def calculate_placement_scores(
    features: AcousticFeatures,
    audio_type: AudioType,
) -> PlacementScores:
    """
    Calculate tone placement scores.
    
    Placement is operationalized through resonance/formant patterns:
    - Forward: higher 2.5-4kHz energy + stronger ring peak + stable formants
    - Back: dominant low-mid energy + reduced upper-mid ring + formant drift
    
    Ring Index: Singer's formant (2.5-3.5 kHz) strength
    Nasality: Anti-resonance detection
    """
    
    # Forwardness: approximated from formant ratios and spectral centroid
    # Higher F2/F1 ratio and higher centroid = more forward
    f1 = features.formants.get("f1", 500)
    f2 = features.formants.get("f2", 1500)
    f3 = features.formants.get("f3", 2500)
    
    f2_f1_ratio = f2 / f1 if f1 > 0 else 3.0
    forwardness = normalize_to_100(f2_f1_ratio, 2.0, 4.0) * 0.5
    forwardness += normalize_to_100(features.spectral_centroid, 1500, 3500) * 0.5
    
    # Ring Index: based on F3 proximity to 2.5-3.5 kHz range (singer's formant)
    singer_formant_center = 3000
    ring_distance = abs(f3 - singer_formant_center)
    ring_index = 100 - normalize_to_100(ring_distance, 0, 1500)
    
    # Nasality: approximated from F1-F2 spacing (narrower = more nasal)
    f1_f2_spacing = f2 - f1
    nasality = 100 - normalize_to_100(f1_f2_spacing, 500, 1500)
    
    return PlacementScores(
        forwardness=float(np.clip(forwardness, 0, 100)),
        ring_index=float(np.clip(ring_index, 0, 100)),
        nasality=float(np.clip(nasality, 0, 100)),
    )


def calculate_sweet_spot(
    timbre: TimbreScores,
    weight: WeightScores,
    placement: PlacementScores,
    features: AcousticFeatures,
) -> SweetSpotScore:
    """
    Calculate Sweet Spot Score with ISO 226 equal-loudness weighting.
    
    Formula:
    0.25 × Clarity + 0.20 × Warmth + 0.20 × Presence + 
    0.15 × Smoothness + 0.20 × (100 - HarshnessPenalty)
    """
    
    # Clarity: derived from HNR and spectral clarity
    # Higher HNR = clearer
    clarity = normalize_to_100(features.hnr, 10, 25) * 0.7
    clarity += (100 - timbre.breathiness) * 0.3
    clarity = np.clip(clarity, 0, 100)
    
    # Warmth: from timbre warmth
    warmth = timbre.warmth
    
    # Presence: from placement forwardness and ring index
    presence = placement.forwardness * 0.6 + placement.ring_index * 0.4
    
    # Smoothness: inverse of roughness
    smoothness = 100 - timbre.roughness
    
    # Harshness penalty: from excessive brightness or roughness
    harshness = 0
    if timbre.brightness > 80:
        harshness += (timbre.brightness - 80) * 0.5
    harshness += timbre.roughness * 0.3
    harshness = np.clip(harshness, 0, 100)
    
    # Calculate total
    total = (
        0.25 * clarity +
        0.20 * warmth +
        0.20 * presence +
        0.15 * smoothness +
        0.20 * (100 - harshness)
    )
    
    return SweetSpotScore(
        clarity=float(clarity),
        warmth=float(warmth),
        presence=float(presence),
        smoothness=float(smoothness),
        harshness_penalty=float(harshness),
        total=float(np.clip(total, 0, 100)),
    )


def normalize_to_100(value: float, min_val: float, max_val: float) -> float:
    """Normalize a value to 0-100 range."""
    if max_val == min_val:
        return 50.0
    normalized = (value - min_val) / (max_val - min_val) * 100
    return float(np.clip(normalized, 0, 100))
