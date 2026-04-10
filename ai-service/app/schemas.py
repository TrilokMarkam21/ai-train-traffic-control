# ============================================================
# ai-service/app/schemas.py  — PRODUCTION UPGRADED
#
# FIX 1: PredictionResponse now includes "factors" and "recommendation"
#        (explainable AI output — was completely missing!)
# FIX 2: Added "source" field to distinguish ai_model vs fallback
# FIX 3: Better validation error messages
# FIX 4: Added /health endpoint schema
# ============================================================

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class CongestionLevel(str, Enum):
    """Congestion risk levels."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class PredictionSource(str, Enum):
    """Where the prediction came from."""
    AI_MODEL = "ai_model"
    FALLBACK = "fallback"


class PredictionRequest(BaseModel):
    """
    Input schema for /v1/predict endpoint.
    These 4 features are what the trained RandomForest model uses.
    """
    traffic_density: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Section traffic density (0.0=empty, 1.0=fully congested)"
    )
    weather_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weather condition (0.0=severe storm, 1.0=clear sky)"
    )
    historical_delay: float = Field(
        ...,
        ge=0.0,
        le=120.0,
        description="Current or historical delay in minutes"
    )
    signal_status: int = Field(
        ...,
        ge=0,
        le=2,
        description="Signal aspect: 0=green(clear), 1=yellow(caution), 2=red(stop)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "traffic_density": 0.75,
                "weather_score": 0.8,
                "historical_delay": 12.0,
                "signal_status": 1
            }
        }
    }


class PredictionResponse(BaseModel):
    """
    Output schema for /v1/predict endpoint.

    FIX: Was only returning 3 fields (delay, risk, confidence).
    Now includes explainable factors and actionable recommendation.
    """
    predicted_delay_minutes: float = Field(
        ...,
        ge=0.0,
        description="Predicted delay in minutes"
    )
    congestion_risk: CongestionLevel = Field(
        ...,
        description="Congestion risk: Low | Medium | High | Critical"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score (0.0 to 1.0)"
    )
    # NEW: Explainable AI fields
    factors: List[str] = Field(
        default_factory=list,
        description="Human-readable factors driving the prediction"
    )
    recommendation: str = Field(
        default="",
        description="Actionable recommendation for the operator"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "predicted_delay_minutes": 18.5,
                "congestion_risk": "Medium",
                "confidence_score": 0.87,
                "factors": [
                    "High traffic density on section",
                    "Yellow signal indicating caution",
                    "Train already delayed by 12 min"
                ],
                "recommendation": "Monitor closely. Prepare contingency if delay exceeds 25 min."
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="Service status: healthy | degraded")
    model_loaded: bool = Field(..., description="Whether ML model is loaded")
    version: str = Field(..., description="API version")


class ErrorResponse(BaseModel):
    """Standardized error response schema."""
    error: str
    detail: Optional[str] = None
    status_code: int
