"""
Train LSTM Model Script
=======================
Trains an LSTM (Long Short-Term Memory) neural network for train delay prediction.
LSTM learns temporal patterns from sequences of historical delays.

This script:
1. Generates synthetic time-series railway data
2. Trains an LSTM model using TensorFlow/Keras
3. Saves the trained model as lstm_model.h5 and scaler stats
4. Outputs performance metrics (R2, MAE)
"""

import sys
from pathlib import Path
import json

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Suppress TensorFlow warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Sequential
from tensorflow.keras.callbacks import EarlyStopping


# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.logger import logger


def generate_time_series_data(n_samples: int = 1000, sequence_length: int = 5) -> tuple:
    """
    Generate synthetic time-series railway dataset.

    Args:
        n_samples: Number of samples to generate
        sequence_length: Length of historical sequences (5 = last 5 delays)

    Returns:
        Tuple of (X_sequences, y_targets, feature_data)
    """
    logger.info(f"Generating {n_samples} synthetic time-series samples...")

    np.random.seed(42)

    # Generate base delay sequences (temporal dependency)
    all_delays = []
    feature_sequences = []

    for _ in range(n_samples + sequence_length):
        traffic = np.random.uniform(0, 1)
        weather = np.random.uniform(0, 1)
        signal = np.random.choice([0, 1, 2])

        # Calculate delay with temporal component
        base_delay = 5.0
        traffic_impact = traffic * 30
        weather_impact = (1 - weather) * 25
        signal_impact = (signal / 2) * 15

        noise = np.random.normal(0, 2)
        delay = max(0, base_delay + traffic_impact + weather_impact + signal_impact + noise)

        all_delays.append(delay)
        feature_sequences.append([traffic, weather, signal])

    # Create sequences for LSTM
    X_sequences = []
    y_targets = []

    for i in range(len(all_delays) - sequence_length):
        # Get sequence of last N delays
        delay_seq = all_delays[i:i + sequence_length]
        X_sequences.append(delay_seq)
        # Target is the next delay
        y_targets.append(all_delays[i + sequence_length])

    X_sequences = np.array(X_sequences)
    y_targets = np.array(y_targets)

    logger.info(f"Created {len(X_sequences)} sequences of length {sequence_length}")
    logger.info(f"Target data shape: {y_targets.shape}")
    logger.info(f"Sample sequence: {X_sequences[0]}")

    return X_sequences, y_targets


def train_model(X_sequences: np.ndarray, y_targets: np.ndarray) -> tuple:
    """
    Train LSTM model on time-series data.

    Args:
        X_sequences: Input sequences (n_samples, sequence_length)
        y_targets: Target delays

    Returns:
        Tuple of (model, y_pred_train, y_pred_test, y_test)
    """
    # Split data
    split_idx = int(len(X_sequences) * 0.8)
    X_train, X_test = X_sequences[:split_idx], X_sequences[split_idx:]
    y_train, y_test = y_targets[:split_idx], y_targets[split_idx:]

    logger.info(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")

    # Normalize sequences
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train.reshape(-1, X_train.shape[1])).reshape(X_train.shape)
    X_test_scaled = scaler.transform(X_test.reshape(-1, X_test.shape[1])).reshape(X_test.shape)

    # Normalize targets
    y_scaler = StandardScaler()
    y_train_scaled = y_scaler.fit_transform(y_train.reshape(-1, 1)).flatten()
    y_test_scaled = y_scaler.transform(y_test.reshape(-1, 1)).flatten()

    logger.info("Training LSTM model...")

    # Build LSTM model
    model = Sequential([
        layers.LSTM(32, activation='relu', input_shape=(X_train.shape[1], 1)),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(1)
    ])

    model.compile(optimizer='adam', loss='mse', metrics=['mae'])

    # Train with early stopping
    early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

    # Reshape for LSTM (needs 3D: samples, timesteps, features)
    X_train_3d = X_train_scaled.reshape((X_train_scaled.shape[0], X_train_scaled.shape[1], 1))
    X_test_3d = X_test_scaled.reshape((X_test_scaled.shape[0], X_test_scaled.shape[1], 1))

    history = model.fit(
        X_train_3d, y_train_scaled,
        epochs=100,
        batch_size=32,
        validation_split=0.2,
        callbacks=[early_stop],
        verbose=0
    )

    logger.info("LSTM training complete!")

    # Evaluate
    y_pred_train_scaled = model.predict(X_train_3d, verbose=0)
    y_pred_test_scaled = model.predict(X_test_3d, verbose=0)

    # Denormalize predictions
    y_pred_train = y_scaler.inverse_transform(y_pred_train_scaled)
    y_pred_test = y_scaler.inverse_transform(y_pred_test_scaled)

    # Calculate metrics
    train_r2 = r2_score(y_train, y_pred_train)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))

    test_r2 = r2_score(y_test, y_pred_test)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

    logger.info("=" * 50)
    logger.info("LSTM MODEL PERFORMANCE METRICS")
    logger.info("=" * 50)
    logger.info(f"Training R2 Score:  {train_r2:.4f}")
    logger.info(f"Training MAE:       {train_mae:.2f} minutes")
    logger.info(f"Training RMSE:      {train_rmse:.2f} minutes")
    logger.info("-" * 50)
    logger.info(f"Test R2 Score:      {test_r2:.4f}")
    logger.info(f"Test MAE:           {test_mae:.2f} minutes")
    logger.info(f"Test RMSE:          {test_rmse:.2f} minutes")
    logger.info("=" * 50)

    return model, y_scaler, X_train_scaled, y_pred_train, y_pred_test, y_test


def save_model(model, y_scaler, model_path: Path, scaler_path: Path) -> None:
    """
    Save trained LSTM model and scaler stats.

    Args:
        model: Trained LSTM model
        y_scaler: Target value scaler
        model_path: Path to save model
        scaler_path: Path to save scaler stats
    """
    # Ensure directory exists
    model_path.parent.mkdir(parents=True, exist_ok=True)

    # Save model
    model.save(str(model_path))
    logger.info(f"Model saved to: {model_path}")

    # Save scaler stats for inference
    scaler_stats = {
        'mean': float(y_scaler.mean_[0]),
        'std': float(y_scaler.scale_[0])
    }

    with open(scaler_path, 'w') as f:
        json.dump(scaler_stats, f)

    logger.info(f"Scaler stats saved to: {scaler_path}")


def main():
    """Main training pipeline."""
    logger.info("=" * 60)
    logger.info("LSTM MODEL TRAINING")
    logger.info("=" * 60)

    # Configuration
    N_SAMPLES = 2000
    SEQUENCE_LENGTH = 5
    MODEL_PATH = Path(__file__).parent / "model" / "lstm_model.h5"
    SCALER_PATH = Path(__file__).parent / "model" / "lstm_scaler_stats.json"

    # Generate data
    X_sequences, y_targets = generate_time_series_data(n_samples=N_SAMPLES, sequence_length=SEQUENCE_LENGTH)

    # Train model
    model, y_scaler, X_train_scaled, y_pred_train, y_pred_test, y_test = train_model(X_sequences, y_targets)

    # Save model
    save_model(model, y_scaler, MODEL_PATH, SCALER_PATH)

    logger.info("=" * 60)
    logger.info("LSTM TRAINING COMPLETE")
    logger.info("=" * 60)

    return model


if __name__ == "__main__":
    main()
