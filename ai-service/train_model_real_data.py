"""
Train Model with Real Railway Data
==================================
Modified script that loads real data instead of generating synthetic data.

Usage:
    python train_model_real_data.py

Expected CSV format:
    traffic_density,weather_score,historical_delay,signal_status,delay_minutes
    0.75,0.8,12.0,1,18.5
    0.85,0.6,8.0,2,22.3
    ...
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.logger import logger


def load_and_preprocess_real_data(csv_file: str) -> pd.DataFrame:
    """
    Load and preprocess real railway data from CSV.
    
    Args:
        csv_file: Path to your CSV file
        
    Returns:
        Preprocessed DataFrame with correct features
        
    Raises:
        FileNotFoundError: If CSV file doesn't exist
        ValueError: If required columns are missing
    """
    csv_path = Path(csv_file)
    
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Data file not found: {csv_path}\n"
            f"Please provide 'railway_data.csv' with columns:\n"
            f"  - traffic_density (0.0-1.0)\n"
            f"  - weather_score (0.0-1.0)\n"
            f"  - historical_delay (0-120)\n"
            f"  - signal_status (0, 1, or 2)\n"
            f"  - delay_minutes (target variable)"
        )
    
    logger.info(f"Loading data from {csv_file}...")
    
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        raise ValueError(f"Error reading CSV file: {str(e)}")
    
    logger.info(f"Loaded {len(df)} records")
    logger.info(f"Columns: {list(df.columns)}")
    
    # Ensure required columns exist
    required_cols = [
        'traffic_density', 
        'weather_score', 
        'historical_delay', 
        'signal_status', 
        'delay_minutes'
    ]
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(
            f"Missing required columns: {missing_cols}\n"
            f"Your CSV has: {list(df.columns)}\n"
            f"Required: {required_cols}"
        )
    
    # Handle missing values
    logger.info("Handling missing values...")
    initial_rows = len(df)
    
    # Drop rows with missing target (delay_minutes)
    df = df.dropna(subset=['delay_minutes'])
    
    # Fill feature values with column median
    for col in required_cols[:-1]:
        missing_count = df[col].isnull().sum()
        if missing_count > 0:
            median_val = df[col].median()
            logger.info(f"  Filling {missing_count} missing values in {col} with median: {median_val:.2f}")
            df[col].fillna(median_val, inplace=True)
    
    rows_dropped = initial_rows - len(df)
    if rows_dropped > 0:
        logger.info(f"Dropped {rows_dropped} rows with missing target values")
    
    # Normalize to valid ranges
    logger.info("Normalizing feature ranges...")
    
    # traffic_density: must be 0-1
    if df['traffic_density'].max() > 1.0 or df['traffic_density'].min() < 0:
        logger.warning(f"  traffic_density out of range: {df['traffic_density'].min():.2f} - {df['traffic_density'].max():.2f}")
        logger.warning("  Clipping to [0, 1]...")
    df['traffic_density'] = df['traffic_density'].clip(0, 1)
    
    # weather_score: must be 0-1
    if df['weather_score'].max() > 1.0 or df['weather_score'].min() < 0:
        logger.warning(f"  weather_score out of range: {df['weather_score'].min():.2f} - {df['weather_score'].max():.2f}")
        logger.warning("  Clipping to [0, 1]...")
    df['weather_score'] = df['weather_score'].clip(0, 1)
    
    # historical_delay: cap at 120 minutes
    max_delay = df['historical_delay'].max()
    if max_delay > 120:
        logger.warning(f"  historical_delay has values > 120: max = {max_delay:.2f}")
        logger.warning("  Clipping to [0, 120]...")
    df['historical_delay'] = df['historical_delay'].clip(0, 120)
    
    # signal_status: must be 0, 1, or 2
    df['signal_status'] = df['signal_status'].astype(int).clip(0, 2)
    invalid_signals = df[~df['signal_status'].isin([0, 1, 2])].shape[0]
    if invalid_signals > 0:
        logger.warning(f"  Found {invalid_signals} invalid signal_status values")
        logger.warning("  Converted to nearest valid value (0, 1, or 2)")
    
    # delay_minutes: clip at 99th percentile to remove extreme outliers
    delay_p99 = df['delay_minutes'].quantile(0.99)
    logger.info(f"  delay_minutes 99th percentile: {delay_p99:.2f}")
    df['delay_minutes'] = df['delay_minutes'].clip(0, delay_p99)
    
    # Remove statistical outliers (> 3 std dev from mean)
    logger.info("Removing statistical outliers (>3σ from mean)...")
    initial_len = len(df)
    
    for col in ['traffic_density', 'weather_score', 'historical_delay', 'delay_minutes']:
        mean = df[col].mean()
        std = df[col].std()
        lower = mean - 3 * std
        upper = mean + 3 * std
        
        n_outliers = ((df[col] < lower) | (df[col] > upper)).sum()
        if n_outliers > 0:
            logger.info(f"  {col}: Removing {n_outliers} outliers (range: {lower:.2f} - {upper:.2f})")
        
        df = df[(df[col] >= lower) & (df[col] <= upper)]
    
    outliers_removed = initial_len - len(df)
    logger.info(f"Total outliers removed: {outliers_removed}")
    
    # Log final data quality report
    logger.info("\n" + "="*70)
    logger.info("DATA QUALITY REPORT")
    logger.info("="*70)
    logger.info(f"Total records: {len(df)}")
    logger.info(f"\nfeature_ranges:")
    logger.info(f"  traffic_density:  {df['traffic_density'].min():.3f} - {df['traffic_density'].max():.3f} (mean: {df['traffic_density'].mean():.3f})")
    logger.info(f"  weather_score:    {df['weather_score'].min():.3f} - {df['weather_score'].max():.3f} (mean: {df['weather_score'].mean():.3f})")
    logger.info(f"  historical_delay: {df['historical_delay'].min():.1f} - {df['historical_delay'].max():.1f} (mean: {df['historical_delay'].mean():.1f})")
    logger.info(f"  signal_status:    {sorted(df['signal_status'].unique())} (distribution: {dict(df['signal_status'].value_counts())})")
    logger.info(f"\ntarget_variable:")
    logger.info(f"  delay_minutes:    {df['delay_minutes'].min():.1f} - {df['delay_minutes'].max():.1f} (mean: {df['delay_minutes'].mean():.1f}, std: {df['delay_minutes'].std():.1f})")
    logger.info("="*70 + "\n")
    
    if len(df) < 100:
        logger.warning(f"⚠️  WARNING: Only {len(df)} records after preprocessing!")
        logger.warning("   Recommend at least 500-1000 records for good model training")
    
    return df


def train_model(df: pd.DataFrame) -> RandomForestRegressor:
    """
    Train RandomForestRegressor on real railway data.
    
    Args:
        df: Training data with required columns
        
    Returns:
        Trained model
    """
    logger.info("Preparing features and target...")
    
    # Features and target
    X = df[["traffic_density", "weather_score", "historical_delay", "signal_status"]]
    y = df["delay_minutes"]
    
    # Split data (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    logger.info(f"Training set size: {len(X_train)}")
    logger.info(f"Test set size: {len(X_test)}")
    
    # Train RandomForest model
    logger.info("\nTraining RandomForestRegressor...")
    logger.info("  n_estimators: 50 trees")
    logger.info("  max_depth: 20")
    logger.info("  min_samples_split: 5")
    
    model = RandomForestRegressor(
        n_estimators=50,           # Number of decision trees
        max_depth=20,              # Maximum tree depth
        min_samples_split=5,       # Min samples to split a node
        min_samples_leaf=2,        # Min samples in leaf node
        random_state=42,           # Reproducibility
        n_jobs=-1                  # Use all CPU cores
    )
    
    model.fit(X_train, y_train)
    logger.info("✓ Model training complete!")
    
    # Make predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Calculate metrics
    train_r2 = r2_score(y_train, y_pred_train)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    
    test_r2 = r2_score(y_test, y_pred_test)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Log results
    logger.info("\n" + "="*70)
    logger.info("MODEL PERFORMANCE METRICS (REAL DATA)")
    logger.info("="*70)
    logger.info(f"TRAINING METRICS:")
    logger.info(f"  R² Score: {train_r2:.4f}          (explains {train_r2*100:.2f}% of variance)")
    logger.info(f"  MAE:      {train_mae:.2f} minutes  (avg error)")
    logger.info(f"  RMSE:     {train_rmse:.2f} minutes (root mean squared error)")
    logger.info(f"\nTEST METRICS (Generalization):")
    logger.info(f"  R² Score: {test_r2:.4f}          (explains {test_r2*100:.2f}% of variance)")
    logger.info(f"  MAE:      {test_mae:.2f} minutes  (avg error)")
    logger.info(f"  RMSE:     {test_rmse:.2f} minutes (root mean squared error)")
    
    # Evaluate model quality
    logger.info(f"\nMODEL QUALITY ASSESSMENT:")
    if test_r2 >= 0.90:
        logger.info(f"  ✓✓ Excellent! R² = {test_r2:.4f}")
    elif test_r2 >= 0.80:
        logger.info(f"  ✓ Good! R² = {test_r2:.4f}")
    elif test_r2 >= 0.70:
        logger.info(f"  ⚠ Fair. R² = {test_r2:.4f} (consider more/better data)")
    else:
        logger.info(f"  ✗ Poor. R² = {test_r2:.4f} (need more data or better features)")
    
    # Check for overfitting
    gap = train_r2 - test_r2
    if gap > 0.15:
        logger.warning(f"\n⚠ WARNING: Overfitting detected! (gap: {gap:.4f})")
        logger.warning("  Train R² much higher than Test R²")
        logger.warning("  Consider: reducing max_depth, increasing min_samples_split")
    else:
        logger.info(f"\n✓ No significant overfitting detected (gap: {gap:.4f})")
    
    logger.info("="*70)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        "feature": X.columns,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)
    
    logger.info("\nFEATURE IMPORTANCE (which features matter most?):")
    for _, row in feature_importance.iterrows():
        importance_pct = row['importance'] * 100
        bar = "█" * int(importance_pct / 5) + "░" * (20 - int(importance_pct / 5))
        logger.info(f"  {row['feature']:20s} {bar} {importance_pct:5.1f}%")
    
    return model


def save_model(model: RandomForestRegressor, path: Path) -> None:
    """
    Save trained model to disk using joblib.
    
    Args:
        model: Trained model
        path: Output file path
    """
    # Ensure directory exists
    path.parent.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(model, path)
    logger.info(f"\n✓ Model saved to: {path}")
    logger.info(f"  File size: {path.stat().st_size / 1024:.1f} KB")


def main():
    """
    Main training pipeline for real railway data.
    
    Steps:
        1. Load and preprocess real data from CSV
        2. Train RandomForest model
        3. Evaluate performance
        4. Save model to disk
    """
    logger.info("\n" + "="*70)
    logger.info("AI TRAIN TRAFFIC CONTROL - REAL DATA TRAINING SCRIPT")
    logger.info("="*70)
    
    # Configuration
    CSV_FILE = "railway_data.csv"  # CHANGE THIS to your data file
    MODEL_PATH = Path(__file__).parent / "model" / "train_model.pkl"
    
    logger.info(f"\nConfiguration:")
    logger.info(f"  Input data: {CSV_FILE}")
    logger.info(f"  Output model: {MODEL_PATH}")
    
    try:
        # Step 1: Load and preprocess
        logger.info("\n[STEP 1] Loading and preprocessing data...")
        df = load_and_preprocess_real_data(CSV_FILE)
        
        # Step 2: Train model
        logger.info("\n[STEP 2] Training model...")
        model = train_model(df)
        
        # Step 3: Save model
        logger.info("\n[STEP 3] Saving model...")
        save_model(model, MODEL_PATH)
        
        logger.info("\n" + "="*70)
        logger.info("✓✓ TRAINING COMPLETE!")
        logger.info("="*70)
        logger.info("\nNext steps:")
        logger.info("  1. Restart the AI service to load the new model:")
        logger.info("     Kill the uvicorn process and restart")
        logger.info("  2. Test the new model in the AI Control page")
        logger.info("  3. Monitor performance with your real data")
        logger.info("\nThe AI service will automatically detect the updated model.pkl file")
        logger.info("="*70 + "\n")
        
    except FileNotFoundError as e:
        logger.error(f"\n✗ ERROR: {str(e)}")
        sys.exit(1)
    except ValueError as e:
        logger.error(f"\n✗ ERROR: {str(e)}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n✗ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
