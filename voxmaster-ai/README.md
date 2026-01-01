# VoxMaster AI

**Unified Vocal Intelligence Platform**

A comprehensive vocal ecosystem designed for creators, performers, and security professionals. VoxMaster AI leverages the DLM Theory of Vocal Music and Perceptual Audio Engineering to analyze, generate, and protect the human voice.

## Features

### Phase A: Automated Vocal Analysis Pipeline
- **Tone Placement Analysis**: Measure energy in the 2.5-3.5 kHz "Singer's Formant"
- **Vocal Weight Scoring**: Compute CPP and H1-H2 ratios for source strength
- **Timbre Analysis**: Measure spectral centroid and HNR for tonal quality
- **Sweet Spot Score**: Perceptual quality scoring with ISO 226 weighting

### Phase B: Voice Biometrics (VoiceID Sentinel)
- Multi-faceted voice signatures (192-512 dimension embeddings)
- Speech and singing sub-centroids
- Anti-spoofing and liveness detection
- ECAPA-TDNN based speaker verification

### Phase C: PersonaFlow Generator
- Identity-conditioned voice synthesis via Eleven Labs
- Voice Type selection: Command, Intimate, Storyteller, Whisper, Urgent
- Inflection overlays: Punch, Drawl, Uptalk, Breath Pause
- Perceptual optimization profiles

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **UI Components**: ShadCN (Lyra style, orange theme)
- **Icons**: Tabler Icons
- **Charts**: Recharts
- **Styling**: Tailwind CSS

### Backend
- **Framework**: FastAPI (Python)
- **Audio DSP**: librosa, parselmouth (Praat), CREPE
- **ML**: PyTorch, ECAPA-TDNN
- **Database**: Supabase (PostgreSQL)

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Storage**: Supabase Storage

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- pnpm (recommended) or npm

### Frontend Setup

```bash
cd voxmaster-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Backend Setup

```bash
cd voxmaster-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
voxmaster-ai/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Dashboard
│   ├── analyze/              # Vocal analysis
│   ├── biometrics/           # Voice signatures
│   ├── generate/             # PersonaFlow
│   ├── reports/              # PDF exports
│   └── settings/             # Configuration
├── components/
│   ├── ui/                   # ShadCN components
│   ├── audio/                # Audio-specific components
│   ├── charts/               # Visualization components
│   └── layout/               # Layout components
├── lib/
│   ├── utils.ts              # Utilities
│   └── api.ts                # API client
├── backend/
│   └── app/
│       ├── main.py           # FastAPI entry
│       ├── routers/          # API endpoints
│       ├── services/         # Business logic
│       └── models/           # Pydantic schemas
└── README.md
```

## API Endpoints

### Analysis
- `POST /api/analyze/` - Analyze audio file
- `GET /api/analyze/features` - List extractable features
- `GET /api/analyze/scoring-info` - Scoring methodology

### Biometrics
- `POST /api/biometrics/enroll` - Enroll voice signature
- `POST /api/biometrics/verify` - Verify speaker identity
- `GET /api/biometrics/signatures` - List signatures
- `DELETE /api/biometrics/signatures/{id}` - Delete signature

### Generation
- `POST /api/generate/` - Generate voice audio
- `GET /api/generate/voice-types` - List voice types
- `GET /api/generate/perceptual-profiles` - List profiles

## Privacy & Security

VoxMaster AI follows privacy-first principles:

- **Raw Audio Policy**: Raw audio is processed in memory and deleted immediately after feature extraction
- **Biometric Encryption**: All stored embeddings are encrypted at rest (AES-256)
- **Consent-Based**: Explicit consent required for Voice Bank and Generation Identity Token usage
- **GDPR/CCPA Compliant**: Full data export and deletion capabilities

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- DLM Theory of Vocal Music
- ISO 226 Equal-Loudness Contours
- ECAPA-TDNN Speaker Verification
- ShadCN UI Components
