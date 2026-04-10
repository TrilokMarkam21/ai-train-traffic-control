# ============================================================
# ai-service/app/predictor.py  — PRODUCTION UPGRADED
#
# FIX 1: Added generate_factors() — explainable AI output
# FIX 2: Added generate_recommendation() — actionable operator guidance
# FIX 3: Confidence score now better calibrated (not just 1/(1+std))
# FIX 4: predict_with_risk() now returns factors + recommendation
# FIX 5: Added "Critical" risk level for severe cases
# ============================================================

import joblib
import numpy as np
from pathlib import Path
from typing import Tuple, List

from app.config import config
from app.logger import logger


class TrainDelayPredictor:
    """
    Train delay prediction model wrapper.
    Handles model loading, inference, explainability, and recommendations.
    """

    def __init__(self):
        self.model = None
        self.feature_names = [
            "traffic_density",
            "weather_score",
            "historical_delay",
            "signal_status",
        ]
        self.is_loaded = False

    def load_model(self) -> bool:
        """Load the trained model from disk."""
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
        Make raw prediction from feature array.
        Returns (predicted_delay_minutes, confidence_score)
        """
        if not self.is_loaded or self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")

        prediction = self.model.predict(features)

        # Calculate confidence from tree variance
        tree_predictions = np.array([
            tree.predict(features)[0] for tree in self.model.estimators_
        ])
        std_dev = np.std(tree_predictions)
        mean_pred = np.mean(tree_predictions)

        # Coefficient of variation-based confidence (more reliable than raw std)
        if mean_pred > 0:
            cv = std_dev / mean_pred
            confidence = max(0.5, min(0.97, 1.0 - cv * 0.5))
        else:
            confidence = max(0.0, min(1.0, 1.0 / (1.0 + std_dev * 0.1)))

        return float(prediction[0]), round(float(confidence), 3)

    def _calculate_congestion_risk(
        self,
        traffic_density: float,
        weather_score: float,
        predicted_delay: float,
        signal_status: int,
    ) -> str:
        """
        Multi-factor risk score calculation (0-100 scale).
        Returns: Low | Medium | High | Critical
        """
        risk_score = 0.0
        risk_score += traffic_density * 35       # Traffic: 0–35 pts
        risk_score += (1.0 - weather_score) * 20  # Bad weather: 0–20 pts
        risk_score += (signal_status / 2.0) * 20  # Red signal: 0–20 pts
        risk_score += min(predicted_delay / 6.0, 1.0) * 25  # Delay: 0–25 pts

        if risk_score < 25:
            return "Low"
        elif risk_score < 50:
            return "Medium"
        elif risk_score < 75:
            return "High"
        else:
            return "Critical"

    def generate_factors(
        self,
        traffic_density: float,
        weather_score: float,
        historical_delay: float,
        signal_status: int,
        predicted_delay: float,
    ) -> List[str]:
        """
        Generate human-readable explanation of factors driving the prediction.
        This is the Explainable AI (XAI) component.
        """
        factors = []

        # Traffic density analysis
        if traffic_density >= 0.85:
            factors.append("Section is critically congested — trains queuing for entry")
        elif traffic_density >= 0.65:
            factors.append("High traffic density reducing section throughput")
        elif traffic_density >= 0.4:
            factors.append("Moderate traffic on section — minor flow restriction")

        # Weather conditions
        if weather_score <= 0.3:
            factors.append("Severe weather conditions causing speed restrictions")
        elif weather_score <= 0.6:
            factors.append("Adverse weather reducing operational speeds")

        # Signal status
        if signal_status == 2:
            factors.append("Red signal ahead — train must stop and wait clearance")
        elif signal_status == 1:
            factors.append("Caution signal — train must reduce speed approaching section")

        # Historical/existing delay
        if historical_delay >= 25:
            factors.append(
                f"Significant existing delay of {historical_delay:.0f} min propagating through network"
            )
        elif historical_delay >= 10:
            factors.append(f"Train already delayed by {historical_delay:.0f} min")
        elif historical_delay > 0:
            factors.append(f"Minor existing delay of {historical_delay:.0f} min")

        # Prediction outcome explanation
        if predicted_delay <= 3:
            factors.append("Section clear — on-time arrival expected")
        elif predicted_delay > 30:
            factors.append("Multiple compounding factors causing major delay")

        return factors if factors else ["Normal operating conditions — no significant delay factors"]

    def generate_recommendation(
        self,
        congestion_risk: str,
        predicted_delay: float,
    ) -> str:
        """
        Generate an actionable recommendation for the train operator/controller.
        """
        if congestion_risk == "Critical":
            return (
                f"⚠️ CRITICAL: Section overloaded. Hold train at previous signal. "
                f"Estimated clearance delay: {predicted_delay:.0f} min. "
                f"Consider alternate routing immediately."
            )
        elif congestion_risk == "High":
            return (
                f"🔴 HIGH RISK: Reduce approach speed to 40 km/h. "
                f"Expect {predicted_delay:.0f}-min delay. "
                f"Alert platform staff and downstream connections."
            )
        elif congestion_risk == "Medium":
            return (
                f"🟡 ADVISORY: Monitor section closely. "
                f"Predicted delay: {predicted_delay:.0f} min. "
                f"Prepare contingency if situation worsens."
            )
        else:
            return (
                f"✅ NORMAL: Section operating within parameters. "
                f"Predicted delay: {predicted_delay:.0f} min. "
                f"Continue standard monitoring."
            )

    def predict_with_risk(
        self,
        traffic_density: float,
        weather_score: float,
        historical_delay: float,
        signal_status: int,
    ) -> Tuple[float, str, float, List[str], str]:
        """
        Full prediction pipeline: delay + risk + confidence + factors + recommendation.

        Returns:
            Tuple of (predicted_delay, congestion_risk, confidence, factors, recommendation)
        """
        features = np.array([[
            traffic_density,
            weather_score,
            historical_delay,
            signal_status,
        ]])

        predicted_delay, confidence = self.predict(features)
        predicted_delay = max(0.0, predicted_delay)

        congestion_risk = self._calculate_congestion_risk(
            traffic_density, weather_score, predicted_delay, signal_status
        )

        factors = self.generate_factors(
            traffic_density, weather_score, historical_delay,
            signal_status, predicted_delay
        )

        recommendation = self.generate_recommendation(
            congestion_risk, predicted_delay
        )

        return predicted_delay, congestion_risk, confidence, factors, recommendation


# Global singleton
predictor = TrainDelayPredictor()
