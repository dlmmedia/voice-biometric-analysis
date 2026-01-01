"""
Storage Service - Railway Blob Storage Integration

Handles file uploads and downloads for audio files and reports.
For development without Railway, falls back to local file storage.
"""

import os
import httpx
import base64
from typing import Optional, Tuple
from pathlib import Path
import uuid
from datetime import datetime

from app.config import settings


class StorageService:
    """
    Blob storage service with Railway integration.
    Falls back to local storage in development.
    """
    
    def __init__(self):
        self.railway_url = settings.railway_blob_url
        self.railway_token = settings.railway_blob_token
        self.local_storage_path = Path("./storage")
        self.use_railway = bool(self.railway_url and self.railway_token)
        
        # Create local storage directories if not using Railway
        if not self.use_railway:
            self._init_local_storage()
    
    def _init_local_storage(self):
        """Initialize local storage directories."""
        directories = ["audio", "reports", "temp"]
        for dir_name in directories:
            dir_path = self.local_storage_path / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)
    
    async def upload_audio(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "audio/wav"
    ) -> Tuple[str, str]:
        """
        Upload audio file to storage.
        
        Returns:
            Tuple of (file_id, file_url)
        """
        file_id = f"audio_{uuid.uuid4().hex[:12]}_{filename}"
        
        if self.use_railway:
            url = await self._upload_to_railway(file_data, file_id, content_type)
        else:
            url = await self._save_to_local(file_data, "audio", file_id)
        
        return file_id, url
    
    async def upload_report(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "application/pdf"
    ) -> Tuple[str, str]:
        """
        Upload report file to storage.
        
        Returns:
            Tuple of (file_id, file_url)
        """
        file_id = f"report_{uuid.uuid4().hex[:12]}_{filename}"
        
        if self.use_railway:
            url = await self._upload_to_railway(file_data, file_id, content_type)
        else:
            url = await self._save_to_local(file_data, "reports", file_id)
        
        return file_id, url
    
    async def get_file(self, file_url: str) -> Optional[bytes]:
        """
        Retrieve file from storage.
        
        Returns:
            File data as bytes or None if not found.
        """
        if self.use_railway:
            return await self._get_from_railway(file_url)
        else:
            return await self._get_from_local(file_url)
    
    async def delete_file(self, file_url: str) -> bool:
        """
        Delete file from storage.
        
        Returns:
            True if deleted, False otherwise.
        """
        if self.use_railway:
            return await self._delete_from_railway(file_url)
        else:
            return await self._delete_from_local(file_url)
    
    async def get_file_as_base64(self, file_url: str) -> Optional[str]:
        """Get file as base64 encoded string."""
        data = await self.get_file(file_url)
        if data:
            return base64.b64encode(data).decode('utf-8')
        return None
    
    # ============== Railway Implementation ==============
    
    async def _upload_to_railway(
        self,
        file_data: bytes,
        file_id: str,
        content_type: str
    ) -> str:
        """Upload file to Railway Blob Storage."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.railway_token}",
                "Content-Type": content_type,
            }
            
            response = await client.put(
                f"{self.railway_url}/{file_id}",
                content=file_data,
                headers=headers,
                timeout=60.0,
            )
            response.raise_for_status()
            
            return f"{self.railway_url}/{file_id}"
    
    async def _get_from_railway(self, file_url: str) -> Optional[bytes]:
        """Get file from Railway Blob Storage."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.railway_token}",
            }
            
            response = await client.get(
                file_url,
                headers=headers,
                timeout=60.0,
            )
            
            if response.status_code == 200:
                return response.content
            return None
    
    async def _delete_from_railway(self, file_url: str) -> bool:
        """Delete file from Railway Blob Storage."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.railway_token}",
            }
            
            response = await client.delete(
                file_url,
                headers=headers,
                timeout=30.0,
            )
            
            return response.status_code in [200, 204, 404]
    
    # ============== Local Storage Implementation ==============
    
    async def _save_to_local(
        self,
        file_data: bytes,
        category: str,
        file_id: str
    ) -> str:
        """Save file to local storage."""
        file_path = self.local_storage_path / category / file_id
        
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # Return a local URL that can be served by the API
        return f"/api/storage/{category}/{file_id}"
    
    async def _get_from_local(self, file_url: str) -> Optional[bytes]:
        """Get file from local storage."""
        # Parse the local URL to get the file path
        if file_url.startswith("/api/storage/"):
            relative_path = file_url.replace("/api/storage/", "")
            file_path = self.local_storage_path / relative_path
            
            if file_path.exists():
                with open(file_path, "rb") as f:
                    return f.read()
        
        return None
    
    async def _delete_from_local(self, file_url: str) -> bool:
        """Delete file from local storage."""
        if file_url.startswith("/api/storage/"):
            relative_path = file_url.replace("/api/storage/", "")
            file_path = self.local_storage_path / relative_path
            
            if file_path.exists():
                file_path.unlink()
                return True
        
        return False
    
    def get_local_file_path(self, category: str, file_id: str) -> Optional[Path]:
        """Get the local file path for serving files."""
        file_path = self.local_storage_path / category / file_id
        if file_path.exists():
            return file_path
        return None


# Global storage service instance
storage = StorageService()
