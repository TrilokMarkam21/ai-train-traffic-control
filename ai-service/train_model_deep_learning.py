"""
Train Deep Learning Model on Railway Data
==========================================
Use TensorFlow/Keras to train a neural network for delay prediction.

Features:
- Neural network with batch normalization and dropout
- Early stopping to prevent overfitting
- Model checkpointing to save best weights
- Visualization of training history
- Comparison with RandomForest baseline

Usage:
    python train_model_deep_learning.py
"""

import sys
from pathlib import Path
import json

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from app.logger import logger

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    from sklearn.preprocessing import StandardScaler
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logger.error("TensorFlow not installed. Run: pip install tensorflow")

from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from app.deep_learning_predictor import DeepLearningPredictor


def load_data(csv_file: str = "railway_data.csv") -> pd.DataFrame:
    """Load the training data."""
    csv_path = Path(csv_file)
    
    if not csv_path.exists():
        raise FileNotFoundError(f"Data file not found: {csv_path}")
    
    logger.info(f"Loading data from {csv_file}...")
    df = pd.read_csv(csv_path)
    
    # Basic validation
    required_cols = ['traffic_density', 'weather_score', 'historical_delay', 'signal_status', 'delay_minutes']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Clean data
    df = df.dropna(subset=['delay_minutes'])
    
    logger.info(f"Loaded {len(df)} records")
    
    return df


def preprocess_data(df: pd.DataFrame) -> tuple:
    """
    Preprocess data for deep learning.
    
    Returns:
        Tuple of (X_train, X_test, y_train, y_test, scaler_stats, X_scaler)
    """
    logger.info("Preprocessing data...")
    
    # Features and target
    X = df[['traffic_density', 'weather_score', 'historical_delay', 'signal_status']].values
    y = df['delay_minutes'].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Normalize features for neural network
    X_scaler = StandardScaler()
    X_train = X_scaler.fit_transform(X_train)
    X_test = X_scaler.transform(X_test)
    
    # Normalize target
    y_scaler = StandardScaler()
    y_train_norm = y_scaler.fit_transform(y_train.reshape(-1, 1)).flatten()
    y_test_norm = y_scaler.transform(y_test.reshape(-1, 1)).flatten()
    
    # Save scaler statistics for later inference
    scaler_stats = {
        'traffic_density': {'mean': float(X_scaler.mean_[0]), 'std': float(X_scaler.scale_[0])},
        'weather_score': {'mean': float(X_scaler.mean_[1]), 'std': float(X_scaler.scale_[1])},
        'historical_delay': {'mean': float(X_scaler.mean_[2]), 'std': float(X_scaler.scale_[2])},
        'signal_status': {'mean': float(X_scaler.mean_[3]), 'std': float(X_scaler.scale_[3])},
        'delay_minutes': {'mean': float(y_scaler.mean_[0]), 'std': float(y_scaler.scale_[0])}
    }
    
    logger.info(f"Training set: {len(X_train)}, Test set: {len(X_test)}")
    logger.info(f"Features normalized using StandardScaler")
    
    return X_train, X_test, y_train_norm, y_test_norm, scaler_stats, X_scaler, y_train, y_test


def train_deep_learning_model(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    model_path: str = "model/train_model_dl.h5"
) -> keras.Model:
    """
    Train the neural network model.
    """
    logger.info("Building and training neural network...")
    
    # Create predictor and build model
    predictor = DeepLearningPredictor(model_path)
    model = predictor.build_and_compile()
    
    # Callbacks
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=15,
        restore_best_weights=True,
        verbose=1
    )
    
    model_checkpoint = ModelCheckpoint(
        model_path,
        monitor='val_loss',
        save_best_only=True,
        verbose=0
    )
    
    # Train
    logger.info("Training on 50 epochs with early stopping...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=50,
        batch_size=32,
        callbacks=[early_stopping, model_checkpoint],
        verbose=1
    )
    
    return model, history


def evaluate_model(
    model: keras.Model,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    y_scaler
) -> dict:
    """
    Evaluate the trained model.
    """
    logger.info("\nEvaluating model...")
    
    # Predictions
    y_pred_train = model.predict(X_train, verbose=0).flatten()
    y_pred_test = model.predict(X_test, verbose=0).flatten()
    
    # Denormalize
    y_train_denorm = y_scaler.inverse_transform(y_train.reshape(-1, 1)).flatten()
    y_test_denorm = y_scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
    y_pred_train_denorm = y_scaler.inverse_transform(y_pred_train.reshape(-1, 1)).flatten()
    y_pred_test_denorm = y_scaler.inverse_transform(y_pred_test.reshape(-1, 1)).flatten()
    
    # Metrics on normalized data (for reference)
    train_r2_norm = r2_score(y_train, y_pred_train)
    test_r2_norm = r2_score(y_test, y_pred_test)
    
    # Metrics on denormalized data (actual values in minutes)
    train_r2 = r2_score(y_train_denorm, y_pred_train_denorm)
    test_r2 = r2_score(y_test_denorm, y_pred_test_denorm)
    train_mae = mean_absolute_error(y_train_denorm, y_pred_train_denorm)
    test_mae = mean_absolute_error(y_test_denorm, y_pred_test_denorm)
    train_rmse = np.sqrt(mean_squared_error(y_train_denorm, y_pred_train_denorm))
    test_rmse = np.sqrt(mean_squared_error(y_test_denorm, y_pred_test_denorm))
    
    logger.info("\n" + "="*70)
    logger.info("DEEP LEARNING MODEL PERFORMANCE")
    logger.info("="*70)
    logger.info(f"TRAINING METRICS:")
    logger.info(f"  R² Score: {train_r2:.4f}          (explains {train_r2*100:.2f}% of variance)")
    logger.info(f"  MAE:      {train_mae:.2f} minutes  (avg error)")
    logger.info(f"  RMSE:     {train_rmse:.2f} minutes (root mean squared error)")
    logger.info(f"\nTEST METRICS (Generalization):")
    logger.info(f"  R² Score: {test_r2:.4f}          (explains {test_r2*100:.2f}% of variance)")
    logger.info(f"  MAE:      {test_mae:.2f} minutes  (avg error)")
    logger.info(f"  RMSE:     {test_rmse:.2f} minutes (root mean squared error)")
    logger.info("="*70)
    
    # Assess quality
    if test_r2 >= 0.90:
        logger.info(f"\n✓✓ Excellent! R² = {test_r2:.4f}")
    elif test_r2 >= 0.80:
        logger.info(f"\n✓ Good! R² = {test_r2:.4f}")
    elif test_r2 >= 0.70:
        logger.info(f"\n⚠ Fair. R² = {test_r2:.4f}")
    else:
        logger.info(f"\n✗ Poor. R² = {test_r2:.4f}")
    
    # Check overfitting
    gap = train_r2 - test_r2
    if gap > 0.1:
        logger.warning(f"\n⚠ Overfitting detected! (gap: {gap:.4f})")
    else:
        logger.info(f"\n✓ No significant overfitting (gap: {gap:.4f})")
    
    return {
        'train_r2': train_r2,
        'test_r2': test_r2,
        'train_mae': train_mae,
        'test_mae': test_mae,
        'train_rmse': train_rmse,
        'test_rmse': test_rmse
    }


def compare_with_baseline(test_metrics: dict) -> None:
    """
    Compare deep learning with RandomForest baseline.
    """
    logger.info("\n" + "="*70)
    logger.info("DEEP LEARNING vs RANDOMFOREST COMPARISON")
    logger.info("="*70)
    
    # Baseline (RandomForest from earlier training)
    rf_r2 = 0.9829
    rf_mae = 1.84
    
    dl_r2 = test_metrics['test_r2']
    dl_mae = test_metrics['test_mae']
    
    r2_diff = (dl_r2 - rf_r2) * 100
    mae_diff = ((rf_mae - dl_mae) / rf_mae) * 100
    
    logger.info(f"\nMetric          RandomForest    Deep Learning    Difference")
    logger.info("-"*70)
    logger.info(f"R² Score        {rf_r2:.4f}           {dl_r2:.4f}          {r2_diff:+.2f}%")
    logger.info(f"MAE             {rf_mae:.2f} min          {dl_mae:.2f} min          {mae_diff:+.1f}%")
    
    if dl_r2 > rf_r2:
        logger.info(f"\n✓ Deep Learning outperforms RandomForest by {abs(r2_diff):.2f}%!")
    elif abs(r2_diff) < 1:
        logger.info(f"\n≈ Both models perform similarly (difference < 1%)")
    else:
        logger.info(f"\n→ RandomForest is slightly better (difference {abs(r2_diff):.2f}%)")
    
    logger.info("\n💡 Use RandomForest for faster inference, Deep Learning for highest accuracy")
    logger.info("="*70)


def main():
    """Main training pipeline."""
    if not TENSORFLOW_AVAILABLE:
        logger.error("TensorFlow is required but not installed.")
        logger.error("Install with: pip install tensorflow")
        sys.exit(1)
    
    logger.info("\n" + "="*70)
    logger.info("DEEP LEARNING MODEL TRAINING")
    logger.info("="*70)
    
    try:
        # Step 1: Load data
        df = load_data()
        
        # Step 2: Preprocess
        X_train, X_test, y_train_norm, y_test_norm, scaler_stats, X_scaler, y_train_orig, y_test_orig = preprocess_data(df)
        
        # Step 3: Train
        model_path = "model/train_model_dl.h5"
        model, history = train_deep_learning_model(
            X_train, X_test, y_train_norm, y_test_norm, model_path
        )
        
        # Step 4: Save scaler stats
        scaler_path = Path("model") / "scaler_stats.json"
        scaler_path.parent.mkdir(parents=True, exist_ok=True)
        with open(scaler_path, 'w') as f:
            json.dump(scaler_stats, f, indent=2)
        logger.info(f"Scaler statistics saved to {scaler_path}")
        
        # Step 5: Evaluate
        metrics = evaluate_model(model, X_train, X_test, y_train_norm, y_test_norm, 
                                keras.preprocessing.sequence.pad_sequences.__self__.__class__.__bases__[0] if hasattr(keras.preprocessing.sequence, 'pad_sequences') else None)
        
        # Simple denormalization for evaluation
        y_train_denorm = y_train_orig
        y_test_denorm = y_test_orig
        y_pred_train_denorm = model.predict(X_train, verbose=0).flatten()
        y_pred_test_denorm = model.predict(X_test, verbose=0).flatten()
        
        # Denorm predictions
        y_pred_train_denorm = scaler_stats['delay_minutes']['std'] * y_pred_train_denorm + scaler_stats['delay_minutes']['mean']
        y_pred_test_denorm = scaler_stats['delay_minutes']['std'] * y_pred_test_denorm + scaler_stats['delay_minutes']['mean']
        
        train_r2 = r2_score(y_train_denorm, y_pred_train_denorm)
        test_r2 = r2_score(y_test_denorm, y_pred_test_denorm)
        test_mae = mean_absolute_error(y_test_denorm, y_pred_test_denorm)
        
        # Step 6: Compare
        compare_with_baseline({'test_r2': test_r2, 'test_mae': test_mae})
        
        logger.info("\n" + "="*70)
        logger.info("✓ DEEP LEARNING MODEL TRAINING COMPLETE!")
        logger.info("="*70)
        logger.info(f"\nModel saved to: {model_path}")
        logger.info(f"Scaler stats saved to: {scaler_path}")
        logger.info("\nNext steps:")
        logger.info("  1. Update AI service to use ensemble (RF + DL)")
        logger.info("  2. Test predictions in the UI")
        logger.info("  3. Monitor performance in production")
        logger.info("="*70 + "\n")
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
