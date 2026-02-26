"""
Pydantic Schemas Module
=======================
Input and output validation schemas for the AI microservice.
Defines request/response structures with type hints and validation.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CongestionLevel(str, Enum):
    """Congestion risk levels."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class PredictionRequest(BaseModel):
    """
    Request schema for prediction endpoint.
    
    Attributes:
        traffic_density: Current traffic density (0.0 - 1.0)
        weather_score: Weather condition score (0.0 - 1.0, higher = better)
        historical_delay: Historical delay in minutes
        signal_status: Signal status (0 = green, 1 = yellow, 2 = red)
    """
    traffic_density: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Traffic density (0.0 = empty, 1.0 = maximum)"
    )
    weather_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weather score (0.0 = severe, 1.0 = clear)"
    )
    historical_delay: float = Field(
        ...,
        ge=0.0,
        le=120.0,
        description="Historical delay in minutes"
    )
    signal_status: int = Field(
        ...,
        ge=0,
        le=2,
        description="Signal status: 0=green, 1=yellow, 2=red"
    )
    
    @field_validator("traffic_density", "weather_score", "historical_delay")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        """Ensure values are non-negative."""
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "traffic_density": 0.65,
                "weather_score": 0.8,
                "historical_delay": 15.5,
                "signal_status": 1
            }
        }
    }


class PredictionResponse(BaseModel):
    """
    Response schema for prediction endpoint.
    
    Attributes:
        predicted_delay_minutes: Predicted delay in minutes
        congestion_risk: Congestion risk level (Low, Medium, High)
        confidence_score: Model confidence (0.0 - 1.0)
    """
    predicted_delay_minutes: float = Field(
        ...,
        ge=0.0,
        le=120.0,
        description="Predicted delay in minutes"
    )
    congestion_risk: CongestionLevel = Field(
        ...,
        description="Congestion risk level"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "predicted_delay_minutes": 18.5,
                "congestion_risk": "Medium",
                "confidence_score": 0.87
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    version: str = Field(..., description="API version")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "model_loaded": True,
                "version": "1.0.0"
            }
        }
    }


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    status_code: int = Field(..., description="HTTP status code")
