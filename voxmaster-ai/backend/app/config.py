"""
VoxMaster AI Configuration

Environment-based configuration management.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database (Neon PostgreSQL)
    database_url: str = "postgresql://localhost/voxmaster"
    
    # ElevenLabs API
    elevenlabs_api_key: Optional[str] = None
    
    # OpenAI API (optional)
    openai_api_key: Optional[str] = None
    
    # Railway Blob Storage
    railway_blob_url: Optional[str] = None
    railway_blob_token: Optional[str] = None
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # Environment
    environment: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings singleton
settings = get_settings()
