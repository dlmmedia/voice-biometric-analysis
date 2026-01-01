"""
Database Service - Neon PostgreSQL Integration

Provides async database operations using asyncpg for VoxMaster AI.
Supports demo mode when no database is configured.
"""

import asyncpg
import json
import pickle
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager
import numpy as np
import uuid

from app.config import settings


class DemoDataStore:
    """In-memory data store for demo mode when no database is available."""
    
    def __init__(self):
        self.voice_signatures: Dict[str, Dict] = {}
        self.analyses: Dict[str, Dict] = {}
        self.reports: Dict[str, Dict] = {}
        self.verifications: List[Dict] = []
        self.settings: Dict = {
            "id": str(uuid.uuid4()),
            "theme": "system",
            "compact_mode": False,
            "default_audio_type": "spoken",
            "auto_export_reports": False,
            "notifications": {
                "analysis_complete": True,
                "generation_complete": True,
                "security_alerts": True,
                "product_updates": False,
            },
            "privacy": {
                "voice_bank_enabled": False,
                "generation_identity_token_enabled": True,
                "analytics_data_enabled": False,
            },
            "created_at": datetime.utcnow().isoformat(),
        }


class DatabaseService:
    """Async PostgreSQL database service using Neon. Falls back to demo mode."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.demo_mode = False
        self.demo_store: Optional[DemoDataStore] = None
    
    async def connect(self):
        """Create connection pool or enable demo mode."""
        # Check if database URL is configured
        if not settings.database_url or settings.database_url == "postgresql://localhost/voxmaster":
            print("⚠️  No database configured - running in DEMO MODE")
            print("   Data will be stored in memory and lost on restart")
            self.demo_mode = True
            self.demo_store = DemoDataStore()
            return
        
        if self.pool is None:
            try:
                self.pool = await asyncpg.create_pool(
                    settings.database_url,
                    min_size=2,
                    max_size=10,
                    command_timeout=60,
                )
                print("✅ Connected to Neon PostgreSQL")
            except Exception as e:
                print(f"⚠️  Database connection failed: {e}")
                print("   Running in DEMO MODE - data stored in memory")
                self.demo_mode = True
                self.demo_store = DemoDataStore()
    
    async def disconnect(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            print("👋 Disconnected from Neon PostgreSQL")
        if self.demo_mode:
            print("👋 Demo mode ended - in-memory data cleared")
            self.demo_store = None
    
    @asynccontextmanager
    async def connection(self):
        """Get a connection from the pool."""
        if self.demo_mode:
            # Return a dummy context for demo mode
            yield None
            return
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            yield conn
    
    def is_connected(self) -> bool:
        """Check if database is connected or in demo mode."""
        return self.pool is not None or self.demo_mode
    
    # ============== Voice Signatures ==============
    
    async def create_voice_signature(
        self,
        name: str,
        embedding: Optional[np.ndarray] = None,
        samples_count: int = 0,
        quality_score: float = 0.0,
        has_spoken_centroid: bool = True,
        has_singing_centroid: bool = False,
    ) -> Dict[str, Any]:
        """Create a new voice signature."""
        if self.demo_mode:
            sig_id = str(uuid.uuid4())
            signature = {
                "id": sig_id,
                "name": name,
                "embedding": embedding,
                "samples_count": samples_count,
                "quality_score": quality_score,
                "has_spoken_centroid": has_spoken_centroid,
                "has_singing_centroid": has_singing_centroid,
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }
            self.demo_store.voice_signatures[sig_id] = signature
            return {k: v for k, v in signature.items() if k != "embedding"}
        
        async with self.connection() as conn:
            # Serialize embedding as bytes if provided
            embedding_bytes = pickle.dumps(embedding) if embedding is not None else None
            
            row = await conn.fetchrow(
                """
                INSERT INTO voice_signatures 
                (name, embedding, samples_count, quality_score, has_spoken_centroid, has_singing_centroid)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, name, samples_count, quality_score, has_spoken_centroid, 
                          has_singing_centroid, status, created_at
                """,
                name, embedding_bytes, samples_count, quality_score,
                has_spoken_centroid, has_singing_centroid
            )
            return dict(row)
    
    async def get_voice_signature(self, signature_id: str) -> Optional[Dict[str, Any]]:
        """Get a voice signature by ID."""
        if self.demo_mode:
            return self.demo_store.voice_signatures.get(signature_id)
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, name, embedding, samples_count, quality_score, 
                       has_spoken_centroid, has_singing_centroid, status, created_at
                FROM voice_signatures WHERE id = $1
                """,
                signature_id
            )
            if row:
                result = dict(row)
                # Deserialize embedding
                if result.get('embedding'):
                    result['embedding'] = pickle.loads(result['embedding'])
                return result
            return None
    
    async def list_voice_signatures(self, status: str = "active") -> List[Dict[str, Any]]:
        """List all voice signatures with given status."""
        if self.demo_mode:
            return [
                {k: v for k, v in sig.items() if k != "embedding"}
                for sig in self.demo_store.voice_signatures.values()
                if sig.get("status") == status
            ]
        
        async with self.connection() as conn:
            rows = await conn.fetch(
                """
                SELECT id, name, samples_count, quality_score, has_spoken_centroid,
                       has_singing_centroid, status, created_at
                FROM voice_signatures 
                WHERE status = $1
                ORDER BY created_at DESC
                """,
                status
            )
            return [dict(row) for row in rows]
    
    async def update_voice_signature(
        self,
        signature_id: str,
        embedding: Optional[np.ndarray] = None,
        samples_count: Optional[int] = None,
        quality_score: Optional[float] = None,
        has_singing_centroid: Optional[bool] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update a voice signature."""
        if self.demo_mode:
            if signature_id not in self.demo_store.voice_signatures:
                return None
            sig = self.demo_store.voice_signatures[signature_id]
            if embedding is not None:
                sig["embedding"] = embedding
            if samples_count is not None:
                sig["samples_count"] = samples_count
            if quality_score is not None:
                sig["quality_score"] = quality_score
            if has_singing_centroid is not None:
                sig["has_singing_centroid"] = has_singing_centroid
            sig["updated_at"] = datetime.utcnow().isoformat()
            return {k: v for k, v in sig.items() if k != "embedding"}
        
        async with self.connection() as conn:
            updates = []
            values = []
            param_idx = 1
            
            if embedding is not None:
                updates.append(f"embedding = ${param_idx}")
                values.append(pickle.dumps(embedding))
                param_idx += 1
            
            if samples_count is not None:
                updates.append(f"samples_count = ${param_idx}")
                values.append(samples_count)
                param_idx += 1
            
            if quality_score is not None:
                updates.append(f"quality_score = ${param_idx}")
                values.append(quality_score)
                param_idx += 1
            
            if has_singing_centroid is not None:
                updates.append(f"has_singing_centroid = ${param_idx}")
                values.append(has_singing_centroid)
                param_idx += 1
            
            if not updates:
                return await self.get_voice_signature(signature_id)
            
            updates.append(f"updated_at = ${param_idx}")
            values.append(datetime.utcnow())
            param_idx += 1
            
            values.append(signature_id)
            
            row = await conn.fetchrow(
                f"""
                UPDATE voice_signatures 
                SET {', '.join(updates)}
                WHERE id = ${param_idx}
                RETURNING id, name, samples_count, quality_score, has_spoken_centroid,
                          has_singing_centroid, status, created_at, updated_at
                """,
                *values
            )
            return dict(row) if row else None
    
    async def delete_voice_signature(self, signature_id: str) -> bool:
        """Delete a voice signature (soft delete)."""
        if self.demo_mode:
            if signature_id in self.demo_store.voice_signatures:
                self.demo_store.voice_signatures[signature_id]["status"] = "deleted"
                return True
            return False
        
        async with self.connection() as conn:
            result = await conn.execute(
                """
                UPDATE voice_signatures SET status = 'deleted', updated_at = NOW()
                WHERE id = $1
                """,
                signature_id
            )
            return result == "UPDATE 1"
    
    # ============== Analyses ==============
    
    async def create_analysis(
        self,
        filename: str,
        audio_url: Optional[str],
        audio_type: str,
        prompt_type: str,
        timbre: Dict[str, Any],
        weight: Dict[str, Any],
        placement: Dict[str, Any],
        sweet_spot: Dict[str, Any],
        features: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a new analysis record."""
        if self.demo_mode:
            analysis_id = str(uuid.uuid4())
            analysis = {
                "id": analysis_id,
                "filename": filename,
                "audio_url": audio_url,
                "audio_type": audio_type,
                "prompt_type": prompt_type,
                "timbre": timbre,
                "weight": weight,
                "placement": placement,
                "sweet_spot": sweet_spot,
                "features": features,
                "created_at": datetime.utcnow().isoformat(),
            }
            self.demo_store.analyses[analysis_id] = analysis
            return analysis
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO analyses 
                (filename, audio_url, audio_type, prompt_type, timbre, weight, placement, sweet_spot, features)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, filename, audio_url, audio_type, prompt_type, 
                          timbre, weight, placement, sweet_spot, features, created_at
                """,
                filename, audio_url, audio_type, prompt_type,
                json.dumps(timbre), json.dumps(weight), json.dumps(placement),
                json.dumps(sweet_spot), json.dumps(features)
            )
            result = dict(row)
            # Parse JSON fields
            for field in ['timbre', 'weight', 'placement', 'sweet_spot', 'features']:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result
    
    async def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get an analysis by ID."""
        if self.demo_mode:
            return self.demo_store.analyses.get(analysis_id)
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, filename, audio_url, audio_type, prompt_type,
                       timbre, weight, placement, sweet_spot, features, created_at
                FROM analyses WHERE id = $1
                """,
                analysis_id
            )
            if row:
                result = dict(row)
                for field in ['timbre', 'weight', 'placement', 'sweet_spot', 'features']:
                    if result.get(field):
                        result[field] = json.loads(result[field])
                return result
            return None
    
    async def list_analyses(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent analyses."""
        if self.demo_mode:
            analyses = list(self.demo_store.analyses.values())
            analyses.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return analyses[:limit]
        
        async with self.connection() as conn:
            rows = await conn.fetch(
                """
                SELECT id, filename, audio_url, audio_type, prompt_type,
                       sweet_spot, created_at
                FROM analyses
                ORDER BY created_at DESC
                LIMIT $1
                """,
                limit
            )
            results = []
            for row in rows:
                result = dict(row)
                if result.get('sweet_spot'):
                    result['sweet_spot'] = json.loads(result['sweet_spot'])
                results.append(result)
            return results
    
    async def delete_analysis(self, analysis_id: str) -> bool:
        """Delete an analysis."""
        if self.demo_mode:
            if analysis_id in self.demo_store.analyses:
                del self.demo_store.analyses[analysis_id]
                return True
            return False
        
        async with self.connection() as conn:
            result = await conn.execute(
                "DELETE FROM analyses WHERE id = $1",
                analysis_id
            )
            return result == "DELETE 1"
    
    # ============== Reports ==============
    
    async def create_report(
        self,
        filename: str,
        analysis_id: Optional[str],
        report_url: str,
        report_type: str,
        size_bytes: int,
    ) -> Dict[str, Any]:
        """Create a new report record."""
        if self.demo_mode:
            report_id = str(uuid.uuid4())
            audio_file = None
            if analysis_id and analysis_id in self.demo_store.analyses:
                audio_file = self.demo_store.analyses[analysis_id].get("filename")
            report = {
                "id": report_id,
                "filename": filename,
                "analysis_id": analysis_id,
                "report_url": report_url,
                "report_type": report_type,
                "size_bytes": size_bytes,
                "audio_file": audio_file,
                "created_at": datetime.utcnow().isoformat(),
            }
            self.demo_store.reports[report_id] = report
            return report
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO reports (filename, analysis_id, report_url, report_type, size_bytes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, filename, analysis_id, report_url, report_type, size_bytes, created_at
                """,
                filename, analysis_id, report_url, report_type, size_bytes
            )
            return dict(row)
    
    async def list_reports(self, report_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List reports, optionally filtered by type."""
        if self.demo_mode:
            reports = list(self.demo_store.reports.values())
            if report_type:
                reports = [r for r in reports if r.get("report_type") == report_type]
            reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return reports[:limit]
        
        async with self.connection() as conn:
            if report_type:
                rows = await conn.fetch(
                    """
                    SELECT r.id, r.filename, r.analysis_id, r.report_url, r.report_type, 
                           r.size_bytes, r.created_at, a.filename as audio_file
                    FROM reports r
                    LEFT JOIN analyses a ON r.analysis_id = a.id
                    WHERE r.report_type = $1
                    ORDER BY r.created_at DESC
                    LIMIT $2
                    """,
                    report_type, limit
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT r.id, r.filename, r.analysis_id, r.report_url, r.report_type,
                           r.size_bytes, r.created_at, a.filename as audio_file
                    FROM reports r
                    LEFT JOIN analyses a ON r.analysis_id = a.id
                    ORDER BY r.created_at DESC
                    LIMIT $1
                    """,
                    limit
                )
            return [dict(row) for row in rows]
    
    async def delete_report(self, report_id: str) -> bool:
        """Delete a report."""
        if self.demo_mode:
            if report_id in self.demo_store.reports:
                del self.demo_store.reports[report_id]
                return True
            return False
        
        async with self.connection() as conn:
            result = await conn.execute(
                "DELETE FROM reports WHERE id = $1",
                report_id
            )
            return result == "DELETE 1"
    
    # ============== Verification History ==============
    
    async def create_verification(
        self,
        signature_id: Optional[str],
        match: bool,
        confidence: float,
        anti_spoofing: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Record a verification attempt."""
        if self.demo_mode:
            signature_name = None
            if signature_id and signature_id in self.demo_store.voice_signatures:
                signature_name = self.demo_store.voice_signatures[signature_id].get("name")
            verification = {
                "id": str(uuid.uuid4()),
                "signature_id": signature_id,
                "match": match,
                "confidence": confidence,
                "anti_spoofing": anti_spoofing,
                "signature_name": signature_name,
                "created_at": datetime.utcnow().isoformat(),
            }
            self.demo_store.verifications.insert(0, verification)
            return verification
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO verification_history (signature_id, match, confidence, anti_spoofing)
                VALUES ($1, $2, $3, $4)
                RETURNING id, signature_id, match, confidence, anti_spoofing, created_at
                """,
                signature_id, match, confidence, json.dumps(anti_spoofing)
            )
            result = dict(row)
            if result.get('anti_spoofing'):
                result['anti_spoofing'] = json.loads(result['anti_spoofing'])
            return result
    
    async def list_verifications(self, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent verification attempts."""
        if self.demo_mode:
            return self.demo_store.verifications[:limit]
        
        async with self.connection() as conn:
            rows = await conn.fetch(
                """
                SELECT vh.id, vh.signature_id, vh.match, vh.confidence, 
                       vh.anti_spoofing, vh.created_at, vs.name as signature_name
                FROM verification_history vh
                LEFT JOIN voice_signatures vs ON vh.signature_id = vs.id
                ORDER BY vh.created_at DESC
                LIMIT $1
                """,
                limit
            )
            results = []
            for row in rows:
                result = dict(row)
                if result.get('anti_spoofing'):
                    result['anti_spoofing'] = json.loads(result['anti_spoofing'])
                results.append(result)
            return results
    
    # ============== User Settings ==============
    
    async def get_or_create_settings(self) -> Dict[str, Any]:
        """Get or create user settings (single-user mode)."""
        if self.demo_mode:
            return self.demo_store.settings
        
        async with self.connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM user_settings ORDER BY created_at LIMIT 1"
            )
            if row:
                result = dict(row)
                for field in ['notifications', 'privacy']:
                    if result.get(field):
                        result[field] = json.loads(result[field])
                return result
            
            # Create default settings
            row = await conn.fetchrow(
                """
                INSERT INTO user_settings DEFAULT VALUES
                RETURNING *
                """
            )
            result = dict(row)
            for field in ['notifications', 'privacy']:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result
    
    async def update_settings(self, **kwargs) -> Dict[str, Any]:
        """Update user settings."""
        if self.demo_mode:
            for key, value in kwargs.items():
                self.demo_store.settings[key] = value
            self.demo_store.settings["updated_at"] = datetime.utcnow().isoformat()
            return self.demo_store.settings
        
        async with self.connection() as conn:
            current = await self.get_or_create_settings()
            settings_id = current['id']
            
            updates = []
            values = []
            param_idx = 1
            
            for key, value in kwargs.items():
                if key in ['notifications', 'privacy'] and isinstance(value, dict):
                    value = json.dumps(value)
                updates.append(f"{key} = ${param_idx}")
                values.append(value)
                param_idx += 1
            
            if not updates:
                return current
            
            updates.append(f"updated_at = ${param_idx}")
            values.append(datetime.utcnow())
            param_idx += 1
            
            values.append(settings_id)
            
            row = await conn.fetchrow(
                f"""
                UPDATE user_settings 
                SET {', '.join(updates)}
                WHERE id = ${param_idx}
                RETURNING *
                """,
                *values
            )
            result = dict(row)
            for field in ['notifications', 'privacy']:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result
    
    async def delete_all_signatures(self) -> int:
        """Delete all voice signatures (danger zone)."""
        if self.demo_mode:
            count = len(self.demo_store.voice_signatures)
            self.demo_store.voice_signatures.clear()
            return count
        
        async with self.connection() as conn:
            result = await conn.execute(
                "DELETE FROM voice_signatures"
            )
            # Parse "DELETE X" to get count
            count = int(result.split()[-1]) if result else 0
            return count


# Global database service instance
db = DatabaseService()
