"""
Configuration Module
====================
Application configuration settings for the AI microservice.
Uses environment variables with sensible defaults.
"""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    app_name: str = "AI Train Traffic Control Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Model
    model_path: str = "model/train_model.pkl"
    
    # CORS
    cors_origins: list = ["*"]
    
    # API
    api_prefix: str = "/v1"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


class AppConfig:
    """Application configuration manager."""
    
    def __init__(self):
        self.settings = Settings()
        self._model_path: Optional[Path] = None
    
    @property
    def model_path(self) -> Path:
        """Get absolute path to the model file."""
        if self._model_path is None:
            # Resolve relative to this file's directory
            base_dir = Path(__file__).parent.parent
            self._model_path = base_dir / self.settings.model_path
        return self._model_path
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return not self.settings.debug
    
    def get_cors_origins(self) -> list:
        """Get CORS origins."""
        return self.settings.cors_origins


# Global configuration instance
config = AppConfig()
