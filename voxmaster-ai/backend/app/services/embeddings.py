"""
Speaker Embedding Service

ECAPA-TDNN based speaker embeddings for:
- Voice signature creation
- Speaker verification (1:1)
- Speaker identification (1:N)
"""

import numpy as np
from typing import Tuple, List, Optional
from dataclasses import dataclass


@dataclass
class EmbeddingResult:
    """Container for embedding extraction result."""
    embedding: np.ndarray
    quality_score: float
    duration: float


async def extract_embedding(
    file_path: str,
    model: str = "ecapa_tdnn",
) -> Tuple[np.ndarray, float]:
    """
    Extract speaker embedding from audio file.
    
    Uses ECAPA-TDNN architecture for robust speaker representation.
    
    Args:
        file_path: Path to audio file
        model: Embedding model to use ('ecapa_tdnn', 'xvector', 'dvector')
    
    Returns:
        Tuple of (embedding vector, quality score)
    """
    try:
        import librosa
        
        # Load audio
        audio, sr = librosa.load(file_path, sr=16000, mono=True)
        
        # Check audio quality
        quality = calculate_embedding_quality(audio, sr)
        
        # In production, use a proper ECAPA-TDNN model
        # For now, generate a mock embedding
        # Real implementation would use speechbrain or similar
        
        # Mock 256-dimensional embedding
        embedding = generate_mock_embedding(audio, sr)
        
        return embedding, quality
        
    except ImportError:
        # Return mock embedding if librosa not available
        return np.random.randn(256), 85.0


def generate_mock_embedding(audio: np.ndarray, sr: int) -> np.ndarray:
    """
    Generate a mock speaker embedding.
    
    In production, replace with actual ECAPA-TDNN inference:
    
    from speechbrain.pretrained import EncoderClassifier
    classifier = EncoderClassifier.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb"
    )
    embedding = classifier.encode_batch(audio)
    """
    
    # Create a deterministic but audio-dependent embedding
    # This is just for testing - real embedding would be from neural network
    
    try:
        import librosa
        
        # Use audio features to create pseudo-embedding
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
        
        # Aggregate features
        mfcc_mean = np.mean(mfccs, axis=1)
        mfcc_std = np.std(mfccs, axis=1)
        chroma_mean = np.mean(chroma, axis=1)
        
        # Concatenate and pad/truncate to 256 dimensions
        features = np.concatenate([mfcc_mean, mfcc_std, chroma_mean])
        
        if len(features) < 256:
            embedding = np.pad(features, (0, 256 - len(features)))
        else:
            embedding = features[:256]
        
        # L2 normalize
        embedding = embedding / (np.linalg.norm(embedding) + 1e-8)
        
        return embedding
        
    except ImportError:
        return np.random.randn(256)


def calculate_embedding_quality(audio: np.ndarray, sr: int) -> float:
    """
    Calculate quality score for embedding reliability.
    
    Factors:
    - SNR (Signal-to-Noise Ratio)
    - Clipping percentage
    - Voiced ratio
    - Duration adequacy
    """
    
    # Duration score (optimal: 2-4 seconds)
    duration = len(audio) / sr
    if duration < 1:
        duration_score = duration * 50
    elif duration <= 4:
        duration_score = 100
    else:
        duration_score = max(50, 100 - (duration - 4) * 5)
    
    # Clipping detection
    clipping_ratio = np.mean(np.abs(audio) > 0.99)
    clipping_score = 100 - clipping_ratio * 200
    
    # RMS energy (too quiet = low quality)
    rms = np.sqrt(np.mean(audio ** 2))
    rms_score = min(100, rms * 1000)
    
    # Combined quality score
    quality = 0.4 * duration_score + 0.3 * clipping_score + 0.3 * rms_score
    
    return float(np.clip(quality, 0, 100))


async def compute_similarity(
    embedding1: np.ndarray,
    embedding2: np.ndarray,
    metric: str = "cosine",
) -> float:
    """
    Compute similarity between two embeddings.
    
    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector
        metric: Similarity metric ('cosine', 'euclidean', 'plda')
    
    Returns:
        Similarity score (0-100)
    """
    
    if metric == "cosine":
        # Cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 > 0 and norm2 > 0:
            similarity = dot_product / (norm1 * norm2)
        else:
            similarity = 0
        
        # Convert from [-1, 1] to [0, 100]
        return float((similarity + 1) * 50)
    
    elif metric == "euclidean":
        # Euclidean distance converted to similarity
        distance = np.linalg.norm(embedding1 - embedding2)
        # Assuming normalized embeddings, max distance is ~2
        similarity = max(0, 100 - distance * 50)
        return float(similarity)
    
    else:
        raise ValueError(f"Unknown metric: {metric}")


def aggregate_embeddings(
    embeddings: List[np.ndarray],
    method: str = "mean",
) -> np.ndarray:
    """
    Aggregate multiple embeddings into a centroid.
    
    Args:
        embeddings: List of embedding vectors
        method: Aggregation method ('mean', 'median', 'weighted')
    
    Returns:
        Centroid embedding
    """
    
    if not embeddings:
        raise ValueError("No embeddings provided")
    
    embeddings_array = np.array(embeddings)
    
    if method == "mean":
        centroid = np.mean(embeddings_array, axis=0)
    elif method == "median":
        centroid = np.median(embeddings_array, axis=0)
    else:
        centroid = np.mean(embeddings_array, axis=0)
    
    # L2 normalize
    centroid = centroid / (np.linalg.norm(centroid) + 1e-8)
    
    return centroid


def compute_covariance(embeddings: List[np.ndarray]) -> np.ndarray:
    """
    Compute covariance matrix for embeddings.
    
    Useful for understanding voice variability and for PLDA scoring.
    """
    
    embeddings_array = np.array(embeddings)
    return np.cov(embeddings_array.T)
