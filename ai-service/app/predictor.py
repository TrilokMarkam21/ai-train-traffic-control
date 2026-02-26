"""
Predictor Module
===============
Handles model loading and prediction logic for the AI microservice.
Encapsulates all ML-related operations separate from API logic.
"""

import joblib
from pathlib import Path
from typing import Tuple

import numpy as np
from sklearn.ensemble import RandomForestRegressor

from app.config import config
from app.logger import logger


class TrainDelayPredictor:
    """
    Train delay prediction model wrapper.
    
    Handles model loading, inference, and prediction post-processing.
    """
    
    def __init__(self):
        self.model: RandomForestRegressor | None = None
        self.feature_names = [
            "traffic_density",
            "weather_score", 
            "historical_delay",
            "signal_status"
        ]
        self.is_loaded = False
        
    def load_model(self) -> bool:
        """
        Load the trained model from disk.
        
        Returns:
            True if model loaded successfully, False otherwise
        """
        model_path = config.model_path
        
        try:
            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return False
            
            self.model = joblib.load(model_path)
            self.is_loaded = True
            logger.info(f"Model loaded successfully from {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self.is_loaded = False
            return False
    
    def predict(self, features: np.ndarray) -> Tuple[float, float]:
        """
        Make predictions on input features.
        
        Args:
            features: Input features array of shape (n_samples, n_features)
        
        Returns:
            Tuple of (predicted_delay, confidence_score)
        
        Raises:
            ValueError: If model is not loaded
        """
        if not self.is_loaded or self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        try:
            # Make prediction
            prediction = self.model.predict(features)
            
            # Calculate confidence based on prediction variance
            # Use standard deviation of predictions from all trees
            tree_predictions = np.array([
                tree.predict(features)[0] for tree in self.model.estimators_
            ])
            std_dev = np.std(tree_predictions)
            
            # Convert std to confidence score (inverse relationship)
            # Lower variance = higher confidence
            confidence = 1.0 / (1.0 + std_dev)
            confidence = min(max(confidence, 0.0), 1.0)  # Clamp to [0, 1]
            
            return float(prediction[0]), float(confidence)
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise
    
    def predict_with_risk(
        self, 
        traffic_density: float,
        weather_score: float,
        historical_delay: float,
        signal_status: int
    ) -> Tuple[float, str, float]:
        """
        Make a complete prediction with congestion risk assessment.
        
        Args:
            traffic_density: Traffic density (0.0 - 1.0)
            weather_score: Weather score (0.0 - 1.0)
            historical_delay: Historical delay in minutes
            signal_status: Signal status (0, 1, or 2)
        
        Returns:
            Tuple of (predicted_delay, congestion_risk, confidence)
        """
        # Prepare features
        features = np.array([[
            traffic_density,
            weather_score,
            historical_delay,
            signal_status
        ]])
        
        # Get prediction
        predicted_delay, confidence = self.predict(features)
        
        # Ensure non-negative prediction
        predicted_delay = max(0.0, predicted_delay)
        
        # Determine congestion risk based on multiple factors
        congestion_risk = self._calculate_congestion_risk(
            traffic_density, weather_score, predicted_delay, signal_status
        )
        
        return predicted_delay, congestion_risk, confidence
    
    def _calculate_congestion_risk(
        self,
        traffic_density: float,
        weather_score: float,
        predicted_delay: float,
        signal_status: int
    ) -> str:
        """
        Calculate congestion risk level based on multiple factors.
        
        Args:
            traffic_density: Current traffic density
            weather_score: Weather conditions
            predicted_delay: Predicted delay in minutes
            signal_status: Current signal status
        
        Returns:
            Risk level: "Low", "Medium", or "High"
        """
        # Calculate risk score (0-100)
        risk_score = 0.0
        
        # Traffic density contribution (0-40 points)
        risk_score += traffic_density * 40
        
        # Weather contribution (0-25 points, worse weather = higher risk)
        risk_score += (1.0 - weather_score) * 25
        
        # Signal status contribution (0-20 points)
        risk_score += (signal_status / 2.0) * 20
        
        # Predicted delay contribution (0-15 points)
        risk_score += min(predicted_delay / 8.0, 1.0) * 15
        
        # Determine risk level
        if risk_score < 33:
            return "Low"
        elif risk_score < 66:
            return "Medium"
        else:
            return "High"


# Global predictor instance
predictor = TrainDelayPredictor()
