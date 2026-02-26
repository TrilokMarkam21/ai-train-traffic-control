"""
Main Application Module
=======================
FastAPI application entry point with endpoints, middleware, and error handling.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import config
from app.logger import logger
from app.predictor import predictor
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    HealthResponse,
    ErrorResponse,
    CongestionLevel
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {config.settings.app_name} v{config.settings.app_version}")
    
    # Load model at startup
    model_loaded = predictor.load_model()
    if not model_loaded:
        logger.warning("Model not loaded - predictions will fail")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")


# Create FastAPI application
app = FastAPI(
    title=config.settings.app_name,
    version=config.settings.app_version,
    description="AI-powered train delay and congestion risk prediction service",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Error Handlers ==============

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "detail": str(exc.errors()),
            "status_code": 422
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    logger.warning(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred",
            "status_code": 500
        }
    )


# ============== Endpoints ==============

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - redirect to docs."""
    return {
        "message": "AI Train Traffic Control Service",
        "docs": "/docs",
        "health": "/health"
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint"
)
async def health_check():
    """
    Health check endpoint.
    
    Returns the service status and model loading state.
    """
    return HealthResponse(
        status="healthy" if predictor.is_loaded else "degraded",
        model_loaded=predictor.is_loaded,
        version=config.settings.app_version
    )


@app.post(
    "/v1/predict",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict train delay and congestion risk",
    responses={
        200: {"description": "Prediction successful"},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def predict(request: PredictionRequest):
    """
    Predict train delay and congestion risk.
    
    This endpoint takes traffic-related features and returns:
    - **predicted_delay_minutes**: Expected delay in minutes
    - **congestion_risk**: Risk level (Low, Medium, High)
    - **confidence_score**: Model confidence (0.0 - 1.0)
    
    ## Input Features:
    - **traffic_density**: Current traffic density (0.0 - 1.0)
    - **weather_score**: Weather condition score (0.0 - 1.0)
    - **historical_delay**: Historical delay in minutes
    - **signal_status**: Signal status (0=green, 1=yellow, 2=red)
    """
    logger.info(f"Prediction request received: {request.model_dump()}")
    
    # Check if model is loaded
    if not predictor.is_loaded:
        logger.error("Model not loaded - rejecting prediction request")
        raise HTTPException(
            status_code=503,
            detail="Model not available. Please try again later."
        )
    
    try:
        # Make prediction
        predicted_delay, congestion_risk, confidence = predictor.predict_with_risk(
            traffic_density=request.traffic_density,
            weather_score=request.weather_score,
            historical_delay=request.historical_delay,
            signal_status=request.signal_status
        )
        
        # Create response
        response = PredictionResponse(
            predicted_delay_minutes=round(predicted_delay, 2),
            congestion_risk=CongestionLevel(congestion_risk),
            confidence_score=round(confidence, 2)
        )
        
        logger.info(
            f"Prediction successful: delay={response.predicted_delay_minutes}min, "
            f"risk={response.congestion_risk}, confidence={response.confidence_score}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ============== Application Info ==============

def get_app() -> FastAPI:
    """Return the FastAPI application instance."""
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.settings.host,
        port=config.settings.port,
        reload=config.settings.debug
    )
