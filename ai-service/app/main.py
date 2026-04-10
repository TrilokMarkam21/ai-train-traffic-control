# ============================================================
# ai-service/app/main.py  — PRODUCTION UPGRADED
#
# FIX 1: /v1/predict now returns factors + recommendation
#        (was only returning delay, risk, confidence)
# FIX 2: Better startup logging
# FIX 3: Added /v1/predict/batch endpoint for multiple predictions
# FIX 4: Health endpoint returns more detail
# ============================================================

from contextlib import asynccontextmanager
from typing import AsyncGenerator, List
import sys


if sys.version_info >= (3, 14):
    raise RuntimeError(
        "ai-service requires Python < 3.14 due to FastAPI/Pydantic runtime compatibility. "
        "Use Python 3.13 (for example: py -3.13 -m uvicorn app.main:app --reload --port 8000)."
    )

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import config
from app.logger import logger
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    HealthResponse,
    ErrorResponse,
    CongestionLevel,
)

# Import both predictors - we'll use ensemble if available, fallback to single predictor
from app.predictor import predictor as predictor_instance

# Try to use ensemble predictor (XGBoost + LSTM), fall back to single predictor if models not available
try:
    from app.ensemble_predictor import get_ensemble_predictor
    ensemble_mode = True
except ImportError:
    ensemble_mode = False
    logger.warning("Ensemble predictor not available, using fallback predictor only")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: load models on startup."""
    logger.info("=" * 55)
    logger.info(f"  {config.settings.app_name} v{config.settings.app_version}")
    logger.info("=" * 55)

    if ensemble_mode:
        try:
            ensemble = get_ensemble_predictor()
            status = ensemble.get_status()
            logger.info(f"[OK] Ensemble predictor initialized")
            logger.info(f"     - XGBoost: {'✓' if status['xgboost'] else '✗'}")
            logger.info(f"     - LSTM: {'✓' if status['lstm'] else '✗'}")
            if status['ensemble_available']:
                logger.info("[OK] Both models available — using ensemble!")
            else:
                logger.warning("[WARN] Only one model loaded — not an ensemble yet")
        except Exception as e:
            logger.error(f"[ERROR] Ensemble initialization failed: {str(e)}")
            logger.warning("       Falling back to XGBoost...")
    else:
        model_loaded = predictor_instance.load_model()
        if model_loaded:
            logger.info("[OK] XGBoost model loaded and ready")
        else:
            logger.warning("[WARN] Model not loaded — predictions will fail")
            logger.warning("      Run: cd ai-service && python train_model_xgboost.py")

    logger.info(f"[OK] FastAPI ready on port {config.settings.port}")
    yield
    logger.info("Shutting down AI service...")


app = FastAPI(
    title=config.settings.app_name,
    version=config.settings.app_version,
    description=(
        "AI-powered train delay prediction and congestion risk analysis service. "
        "Uses XGBoost + LSTM ensemble with explainable AI output."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Error Handlers ────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "detail": str(exc.errors()),
            "status_code": 422,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred",
            "status_code": 500,
        },
    )


# ─── Endpoints ─────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AI Train Traffic Control — Prediction Service",
        "version": config.settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "predict": "/v1/predict",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Service health check",
)
async def health_check():
    """Returns service status and model availability."""
    if ensemble_mode:
        try:
            ensemble = get_ensemble_predictor()
            status = ensemble.get_status()
            is_loaded = status.get('xgboost', False)  # At least XGBoost should be loaded
            return HealthResponse(
                status="healthy" if is_loaded else "degraded",
                model_loaded=is_loaded,
                version=config.settings.app_version,
            )
        except Exception as e:
            logger.warning(f"Ensemble health check failed: {str(e)}")

    return HealthResponse(
        status="degraded",
        model_loaded=False,
        version=config.settings.app_version,
    )


@app.get(
    "/v1/models",
    tags=["Models"],
    summary="Get available ML models information",
)
async def get_models_info():
    """
    Returns information about available ML models.

    Shows which models are loaded and ready for prediction:
    - XGBoost: Fast, accurate gradient boosting model
    - LSTM: Long Short-Term Memory model for temporal patterns
    - Ensemble: Combines both models for best accuracy
    """
    if not ensemble_mode:
        return {
            "ensemble_available": False,
            "models": {
                "xgboost": {
                    "status": "active" if predictor_instance.is_loaded else "not_loaded",
                    "type": "XGBoost Regressor",
                    "description": "Fast, accurate gradient boosting model"
                }
            }
        }

    try:
        ensemble = get_ensemble_predictor()
        status = ensemble.get_status()

        return {
            "ensemble_available": status['ensemble_available'],
            "prediction_mode": "ensemble" if status['ensemble_available'] else ("xgboost" if status['xgboost'] else "none"),
            "models": {
                "xgboost": {
                    "status": "active" if status['xgboost'] else "not_loaded",
                    "type": "XGBoost Regressor",
                    "description": "Fast, accurate gradient boosting model - learns feature relationships",
                    "features": ["traffic_density", "weather_score", "historical_delay", "signal_status"]
                },
                "lstm": {
                    "status": "active" if status['lstm'] else "not_loaded",
                    "type": "LSTM Neural Network",
                    "description": "Long Short-Term Memory model - captures temporal patterns and sequences",
                    "features": ["traffic_density", "weather_score", "historical_delay", "signal_status"]
                }
            },
            "ensemble_description": "Weighted average of XGBoost and LSTM predictions with agreement scoring"
        }
    except Exception as e:
        logger.warning(f"Error getting models info: {str(e)}")
        return {
            "ensemble_available": False,
            "error": "Could not retrieve models info",
            "detail": str(e)
        }


@app.post(
    "/v1/predict",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict train delay, congestion risk, and get AI explanation",
    responses={
        200: {"description": "Prediction successful with explainable factors"},
        422: {"model": ErrorResponse, "description": "Invalid input data"},
        500: {"model": ErrorResponse, "description": "Prediction failed"},
        503: {"model": ErrorResponse, "description": "Model not loaded"},
    },
)
async def predict(request: PredictionRequest):
    """
    ## Predict Train Delay & Congestion Risk

    Takes 4 traffic features and returns:
    - **predicted_delay_minutes** — how long the train will be delayed
    - **congestion_risk** — Low | Medium | High | Critical
    - **confidence_score** — model certainty (0.0 to 1.0)
    - **factors** — human-readable explanation of what's causing the prediction
    - **recommendation** — actionable guidance for the operator

    ### Input Features:
    | Field | Range | Description |
    |-------|-------|-------------|
    | traffic_density | 0.0–1.0 | How congested the section is |
    | weather_score | 0.0–1.0 | Weather quality (1.0 = clear) |
    | historical_delay | 0–120 min | Existing/historical delay |
    | signal_status | 0, 1, 2 | 0=green, 1=yellow, 2=red |
    """
    
    try:
        if ensemble_mode:
            # Try ensemble prediction first
            try:
                ensemble = get_ensemble_predictor()
                import numpy as np
                features = np.array([[
                    request.traffic_density,
                    request.weather_score,
                    request.historical_delay,
                    request.signal_status
                ]])
                
                predicted_delay, confidence, source, factors = ensemble.predict_ensemble(features)
                
                # Get congestion risk from predictor (they share the same logic)
                congestion_risk = predictor_instance._calculate_congestion_risk(
                    request.traffic_density,
                    request.weather_score,
                    predicted_delay,
                    request.signal_status
                )
                
                recommendation = predictor_instance.generate_recommendation(
                    congestion_risk, predicted_delay
                )
                
                response = PredictionResponse(
                    predicted_delay_minutes=round(predicted_delay, 2),
                    congestion_risk=CongestionLevel(congestion_risk),
                    confidence_score=round(confidence, 3),
                    factors=factors,
                    recommendation=recommendation,
                )

                logger.info(
                    f"Prediction (via {source}): delay={response.predicted_delay_minutes}min "
                    f"risk={response.congestion_risk} "
                    f"confidence={response.confidence_score}"
                )

                return response
            except Exception as e:
                logger.warning(f"Ensemble prediction failed, falling back: {str(e)}")
        
        # Fallback: Use RandomForest only
        if not predictor_instance.is_loaded:
            if not predictor_instance.load_model():
                logger.error("Prediction rejected — model not loaded")
                raise HTTPException(
                    status_code=503,
                    detail="ML model not loaded. Please run python train_model.py first.",
                )

        # Full prediction pipeline: delay + risk + confidence + factors + recommendation
        (
            predicted_delay,
            congestion_risk,
            confidence,
            factors,
            recommendation,
        ) = predictor_instance.predict_with_risk(
            traffic_density=request.traffic_density,
            weather_score=request.weather_score,
            historical_delay=request.historical_delay,
            signal_status=request.signal_status,
        )

        response = PredictionResponse(
            predicted_delay_minutes=round(predicted_delay, 2),
            congestion_risk=CongestionLevel(congestion_risk),
            confidence_score=round(confidence, 3),
            factors=factors,
            recommendation=recommendation,
        )

        logger.info(
            f"Prediction: delay={response.predicted_delay_minutes}min "
            f"risk={response.congestion_risk} "
            f"confidence={response.confidence_score} "
            f"factors={len(factors)}"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post(
    "/v1/predict/batch",
    tags=["Prediction"],
    summary="Batch predict for multiple trains at once",
)
async def predict_batch(requests: List[PredictionRequest]):
    """Predict delays for multiple trains in a single API call."""
    
    if ensemble_mode:
        try:
            ensemble = get_ensemble_predictor()
            status = ensemble.get_status()
            if not (status['xgboost'] or status['lstm']):
                raise HTTPException(status_code=503, detail="No models loaded")
        except Exception as e:
            logger.warning(f"Ensemble check failed: {str(e)}")
    elif not predictor_instance.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if len(requests) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 predictions per batch")

    results = []
    if ensemble_mode:
        try:
            ensemble = get_ensemble_predictor()
            import numpy as np
            
            for req in requests:
                try:
                    features = np.array([[
                        req.traffic_density,
                        req.weather_score,
                        req.historical_delay,
                        req.signal_status
                    ]])
                    
                    predicted_delay, confidence, source, factors = ensemble.predict_ensemble(features)
                    congestion_risk = predictor_instance._calculate_congestion_risk(
                        req.traffic_density,
                        req.weather_score,
                        predicted_delay,
                        req.signal_status
                    )
                    recommendation = predictor_instance.generate_recommendation(
                        congestion_risk, predicted_delay
                    )
                    
                    results.append({
                        "predicted_delay_minutes": round(predicted_delay, 2),
                        "congestion_risk": congestion_risk,
                        "confidence_score": round(confidence, 3),
                        "factors": factors,
                        "recommendation": recommendation,
                        "prediction_source": source,
                    })
                except Exception as e:
                    logger.warning(f"Batch prediction error: {str(e)}")
                    results.append({"error": str(e)})
            
            return {"success": True, "predictions": results, "count": len(results)}
        except Exception as e:
            logger.warning(f"Ensemble batch failed, falling back: {str(e)}")
    
    # Fallback to single predictor
    for req in requests:
        try:
            delay, risk, conf, factors, rec = predictor_instance.predict_with_risk(
                req.traffic_density, req.weather_score,
                req.historical_delay, req.signal_status
            )
            results.append({
                "predicted_delay_minutes": round(delay, 2),
                "congestion_risk": risk,
                "confidence_score": round(conf, 3),
                "factors": factors,
                "recommendation": rec,
            })
        except Exception as e:
            results.append({"error": str(e)})

    return {"success": True, "predictions": results, "count": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.settings.host,
        port=config.settings.port,
        reload=config.settings.debug,
    )
