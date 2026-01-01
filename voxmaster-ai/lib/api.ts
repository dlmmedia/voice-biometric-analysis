/**
 * VoxMaster AI API Client
 * 
 * Client for communicating with the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
  status: number;
}

class VoxMasterAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = {
        detail: await response.text(),
        status: response.status,
      };
      throw error;
    }

    return response.json();
  }

  // ============== Health ==============

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request('/');
  }

  // ============== Analysis ==============

  async analyzeAudio(
    file: File,
    audioType: 'spoken' | 'sung',
    promptType: 'sustained' | 'passage' | 'verse'
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('audio_type', audioType);
    formData.append('prompt_type', promptType);

    return this.request('/api/analyze/', {
      method: 'POST',
      body: formData,
    });
  }

  async getFeatureInfo(): Promise<FeatureInfo> {
    return this.request('/api/analyze/features');
  }

  async getScoringInfo(): Promise<ScoringInfo> {
    return this.request('/api/analyze/scoring-info');
  }

  // ============== Biometrics ==============

  async enrollVoice(
    files: File[],
    name: string,
    includeSinging: boolean = false
  ): Promise<EnrollmentResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('name', name);
    formData.append('include_singing', String(includeSinging));

    return this.request('/api/biometrics/enroll', {
      method: 'POST',
      body: formData,
    });
  }

  async verifyVoice(
    file: File,
    signatureId?: string
  ): Promise<VerificationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (signatureId) {
      formData.append('signature_id', signatureId);
    }

    return this.request('/api/biometrics/verify', {
      method: 'POST',
      body: formData,
    });
  }

  async listSignatures(): Promise<{ signatures: VoiceSignature[] }> {
    return this.request('/api/biometrics/signatures');
  }

  async deleteSignature(signatureId: string): Promise<{ deleted: string; status: string }> {
    return this.request(`/api/biometrics/signatures/${signatureId}`, {
      method: 'DELETE',
    });
  }

  // ============== Generation ==============

  async generateVoice(request: GenerationRequest): Promise<GenerationResponse> {
    return this.request('/api/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  }

  async getVoiceTypes(): Promise<{ voice_types: VoiceTypeInfo[] }> {
    return this.request('/api/generate/voice-types');
  }

  async getPerceptualProfiles(): Promise<{ profiles: PerceptualProfileInfo[] }> {
    return this.request('/api/generate/perceptual-profiles');
  }
}

// ============== Types ==============

export interface TimbreScores {
  brightness: number;
  breathiness: number;
  warmth: number;
  roughness: number;
}

export interface WeightScores {
  weight: number;
  pressed: number;
}

export interface PlacementScores {
  forwardness: number;
  ring_index: number;
  nasality: number;
}

export interface SweetSpotScore {
  clarity: number;
  warmth: number;
  presence: number;
  smoothness: number;
  harshness_penalty: number;
  total: number;
}

export interface AcousticFeatures {
  spectral_centroid: number;
  spectral_rolloff?: number;
  hnr: number;
  cpp: number;
  h1_h2: number;
  f0_mean: number;
  f0_range: [number, number];
  formants: { f1: number; f2: number; f3: number; f4: number };
  mfccs?: number[];
  jitter?: number;
  shimmer?: number;
}

export interface AnalysisResponse {
  id?: string;
  filename: string;
  audio_url?: string;
  audio_type: string;
  prompt_type: string;
  timbre: TimbreScores;
  weight: WeightScores;
  placement: PlacementScores;
  sweet_spot: SweetSpotScore;
  features: AcousticFeatures;
  analyzed_at: string;
}

export interface FeatureInfo {
  spectral: string[];
  harmonic: string[];
  formants: string[];
  cepstral: string[];
  pitch: string[];
}

export interface ScoringInfo {
  timbre: Record<string, string>;
  weight: Record<string, string>;
  placement: Record<string, string>;
  sweet_spot: Record<string, string>;
}

export interface VoiceSignature {
  id: string;
  name: string;
  enrolled_at: string;
  samples_count: number;
  quality_score: number;
  status: string;
  has_spoken_centroid?: boolean;
  has_singing_centroid?: boolean;
}

export interface EnrollmentResponse {
  signature_id: string;
  name: string;
  samples_count: number;
  quality_score: number;
  has_spoken_centroid: boolean;
  has_singing_centroid: boolean;
  status: string;
}

export interface AntiSpoofingResult {
  replay_detected: boolean;
  ai_generated: boolean;
  liveness_verified: boolean;
}

export interface VerificationResponse {
  match: boolean;
  confidence: number;
  matched_signature_id?: string;
  matched_signature_name?: string;
  anti_spoofing: AntiSpoofingResult;
}

export interface GenerationRequest {
  text: string;
  signature_id: string;
  voice_type: 'command' | 'intimate' | 'storyteller' | 'whisper' | 'urgent';
  inflections?: string[];
  perceptual_profile: 'podcast' | 'warm' | 'broadcast' | 'asmr';
  pitch_variance?: number;
  speaking_rate?: number;
  expressiveness?: number;
}

export interface VerificationScores {
  identity_match: number;
  voice_type_accuracy: number;
  perceptual_match: number;
}

export interface GenerationResponse {
  generation_id: string;
  status: string;
  audio_url?: string;
  audio_base64?: string;
  duration_seconds?: number;
  voice_type: string;
  perceptual_profile: string;
  verification_scores: VerificationScores;
}

export interface VoiceTypeInfo {
  id: string;
  name: string;
  description: string;
  parameters: {
    weight: string;
    pitch_variance: string;
    presence: string;
  };
}

export interface PerceptualProfileInfo {
  id: string;
  name: string;
  target_metrics: {
    clarity: number;
    warmth: number;
    presence: number;
  };
}

// Export singleton instance
export const api = new VoxMasterAPI();
export default api;
