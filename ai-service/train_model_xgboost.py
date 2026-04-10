"""
Train XGBoost Model Script
==========================
Trains an XGBoost model for train delay prediction.
XGBoost is faster and more accurate than RandomForest.

This script:
1. Generates realistic synthetic railway data
2. Trains an XGBRegressor model
3. Saves the trained model as xgboost_model.pkl
4. Outputs performance metrics (R2, MAE)
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import xgboost as xgb


# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.logger import logger


def generate_synthetic_data(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate synthetic railway dataset with realistic patterns.

    Args:
        n_samples: Number of samples to generate

    Returns:
        DataFrame with features and target
    """
    logger.info(f"Generating {n_samples} synthetic samples...")

    np.random.seed(42)  # For reproducibility

    # Generate features
    traffic_density = np.random.uniform(0, 1, n_samples)
    weather_score = np.random.uniform(0, 1, n_samples)
    historical_delay = np.random.exponential(scale=15, size=n_samples)
    signal_status = np.random.choice([0, 1, 2], size=n_samples, p=[0.6, 0.3, 0.1])

    # Generate target (delay_minutes) with realistic relationships
    base_delay = 5.0

    # Traffic impact (0-30 minutes)
    traffic_impact = traffic_density * 30

    # Weather impact (0-25 minutes)
    weather_impact = (1 - weather_score) * 25

    # Signal impact (0-15 minutes)
    signal_impact = (signal_status / 2) * 15

    # Historical delay impact (scaled)
    historical_impact = historical_delay * 0.5

    # Add noise and create final delay
    noise = np.random.normal(0, 3, n_samples)
    delay_minutes = (
        base_delay
        + traffic_impact
        + weather_impact
        + signal_impact
        + historical_impact
        + noise
    )

    # Ensure non-negative delays
    delay_minutes = np.maximum(delay_minutes, 0)

    # Create DataFrame
    df = pd.DataFrame({
        "traffic_density": traffic_density,
        "weather_score": weather_score,
        "historical_delay": historical_delay,
        "signal_status": signal_status,
        "delay_minutes": delay_minutes
    })

    logger.info(f"Data generation complete. Sample data:\n{df.head()}")

    return df


def train_model(df: pd.DataFrame) -> xgb.XGBRegressor:
    """
    Train XGBRegressor on the dataset.

    Args:
        df: Training data

    Returns:
        Trained model
    """
    logger.info("Preparing features and target...")

    # Features
    X = df[["traffic_density", "weather_score", "historical_delay", "signal_status"]]
    y = df["delay_minutes"]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    logger.info(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")

    # Train model
    logger.info("Training XGBRegressor...")

    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbosity=0
    )

    model.fit(X_train, y_train)

    logger.info("Model training complete!")

    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    # Training metrics
    train_r2 = r2_score(y_train, y_pred_train)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))

    # Test metrics
    test_r2 = r2_score(y_test, y_pred_test)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

    logger.info("=" * 50)
    logger.info("XGBOOST MODEL PERFORMANCE METRICS")
    logger.info("=" * 50)
    logger.info(f"Training R2 Score:  {train_r2:.4f}")
    logger.info(f"Training MAE:       {train_mae:.2f} minutes")
    logger.info(f"Training RMSE:      {train_rmse:.2f} minutes")
    logger.info("-" * 50)
    logger.info(f"Test R2 Score:      {test_r2:.4f}")
    logger.info(f"Test MAE:           {test_mae:.2f} minutes")
    logger.info(f"Test RMSE:          {test_rmse:.2f} minutes")
    logger.info("=" * 50)

    # Feature importance
    feature_importance = pd.DataFrame({
        "feature": X.columns,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)

    logger.info("\nFeature Importance:")
    for _, row in feature_importance.iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")

    return model


def save_model(model: xgb.XGBRegressor, path: Path) -> None:
    """
    Save trained model to disk.

    Args:
        model: Trained model
        path: Output path
    """
    # Ensure directory exists
    path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, path)
    logger.info(f"Model saved to: {path}")


def main():
    """Main training pipeline."""
    logger.info("=" * 60)
    logger.info("XGBOOST MODEL TRAINING")
    logger.info("=" * 60)

    # Configuration
    N_SAMPLES = 10000
    MODEL_PATH = Path(__file__).parent / "model" / "xgboost_model.pkl"

    # Generate data
    df = generate_synthetic_data(n_samples=N_SAMPLES)

    # Train model
    model = train_model(df)

    # Save model
    save_model(model, MODEL_PATH)

    logger.info("=" * 60)
    logger.info("XGBOOST TRAINING COMPLETE")
    logger.info("=" * 60)

    return model


if __name__ == "__main__":
    main()
