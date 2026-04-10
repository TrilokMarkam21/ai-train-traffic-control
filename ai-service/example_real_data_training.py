"""
Real Data Training Example
==========================
Complete working example showing how to:
1. Generate example real data (simulating actual railway data)
2. Preprocess it
3. Train the model
4. Evaluate performance

Run this to see the full pipeline in action:
    python example_real_data_training.py
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from app.logger import logger


def generate_realistic_data(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generate realistic railway data (more realistic than fully synthetic).
    
    This simulates actual operating conditions with patterns:
    - Early morning trains have less delay
    - Peak hours have more congestion
    - Bad weather increases delays
    - Red signals cause significant delays
    - Delays compound (if delayed before, more likely delayed after)
    """
    logger.info(f"\n🔄 Generating {n_samples} realistic railway records...")
    
    np.random.seed(42)
    
    # Simulate a day's data
    records = []
    
    # Define different time periods with different conditions
    periods = [
        {'name': 'Early Morning (4-7 AM)', 'traffic': 0.1, 'weather': 0.9, 'n': int(n_samples * 0.15)},
        {'name': 'Morning Peak (7-10 AM)', 'traffic': 0.8, 'weather': 0.85, 'n': int(n_samples * 0.2)},
        {'name': 'Midday (10 AM-2 PM)', 'traffic': 0.5, 'weather': 0.8, 'n': int(n_samples * 0.2)},
        {'name': 'Evening Peak (2-6 PM)', 'traffic': 0.8, 'weather': 0.75, 'n': int(n_samples * 0.25)},
        {'name': 'Night (6 PM-4 AM)', 'traffic': 0.3, 'weather': 0.7, 'n': int(n_samples * 0.2)},
    ]
    
    for period in periods:
        logger.info(f"  {period['name']}: {period['n']} records")
        
        for _ in range(period['n']):
            # Base traffic with variation
            traffic_density = period['traffic'] + np.random.normal(0, 0.1)
            traffic_density = np.clip(traffic_density, 0, 1)
            
            # Weather with some correlation to traffic
            weather_score = period['weather'] + np.random.normal(0, 0.05)
            weather_score = np.clip(weather_score, 0, 1)
            
            # Signal status - more red signals during congestion
            if traffic_density > 0.7:
                signal_probs = [0.2, 0.3, 0.5]  # More red signals
            elif traffic_density > 0.4:
                signal_probs = [0.5, 0.3, 0.2]  # Mixed
            else:
                signal_probs = [0.7, 0.2, 0.1]  # Mostly green
            
            signal_status = np.random.choice([0, 1, 2], p=signal_probs)
            
            # Historical delay - depends on time of day
            if period['name'] == 'Early Morning (4-7 AM)':
                historical_delay = 0  # Right on time in morning
            elif period['name'] == 'Morning Peak (7-10 AM)':
                historical_delay = np.random.exponential(8)  # Starts building up
            else:
                historical_delay = np.random.exponential(12)  # Compounding
            
            historical_delay = np.clip(historical_delay, 0, 120)
            
            # Predicted delay - based on all factors
            base_delay = 2
            
            # Traffic impact
            traffic_impact = traffic_density * 40
            
            # Weather impact
            weather_impact = (1 - weather_score) * 30
            
            # Signal impact
            signal_impact = (signal_status / 2) * 20
            
            # Historical delay effect
            historical_impact = historical_delay * 0.4
            
            # Add noise
            noise = np.random.normal(0, 2)
            
            delay_minutes = max(0, base_delay + traffic_impact + weather_impact + 
                               signal_impact + historical_impact + noise)
            
            records.append({
                'traffic_density': traffic_density,
                'weather_score': weather_score,
                'historical_delay': historical_delay,
                'signal_status': signal_status,
                'delay_minutes': delay_minutes
            })
    
    df = pd.DataFrame(records)
    
    logger.info(f"\n✓ Generated data summary:")
    logger.info(f"  Total: {len(df)} records")
    logger.info(f"  Traffic: {df['traffic_density'].mean():.3f} (mean)")
    logger.info(f"  Weather: {df['weather_score'].mean():.3f} (mean)")
    logger.info(f"  Delay: {df['delay_minutes'].mean():.1f} min (mean)")
    
    return df


def train_and_evaluate(df: pd.DataFrame) -> None:
    """
    Train model on realistic data and show results.
    """
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
    
    logger.info("\n" + "="*70)
    logger.info("TRAINING ON REALISTIC DATA")
    logger.info("="*70)
    
    # Prepare
    X = df[['traffic_density', 'weather_score', 'historical_delay', 'signal_status']]
    y = df['delay_minutes']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train
    logger.info(f"\nTraining on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=50, max_depth=20, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    
    test_r2 = r2_score(y_test, y_pred_test)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    
    logger.info(f"\n{'METRIC':<20} {'TRAINING':<20} {'TEST':<20}")
    logger.info("="*60)
    logger.info(f"{'R² Score':<20} {train_r2:>19.4f} {test_r2:>19.4f}")
    logger.info(f"{'MAE (minutes)':<20} {train_mae:>19.2f} {test_mae:>19.2f}")
    logger.info("="*60)
    
    # Feature importance
    logger.info("\nFEATURE IMPORTANCE (which features matter):")
    for feature, importance in zip(X.columns, model.feature_importances_):
        bar = "█" * int(importance * 100 / 5)
        logger.info(f"  {feature:<20} {bar:<20} {importance*100:>5.1f}%")
    
    # Sample predictions
    logger.info("\nSAMPLE PREDICTIONS:")
    logger.info(f"{'Traffic':>10} {'Weather':>10} {'Delay':>10} {'Signal':>10} {'Predicted':>12} {'Actual':>10}")
    logger.info("-"*70)
    
    for i in range(min(5, len(X_test))):
        t = X_test.iloc[i]
        pred = y_pred_test[i]
        actual = y_test.iloc[i]
        
        logger.info(f"{t['traffic_density']:>10.2f} {t['weather_score']:>10.2f} "
                   f"{t['historical_delay']:>10.1f} {t['signal_status']:>10.0f} "
                   f"{pred:>12.1f} {actual:>10.1f}")
    
    logger.info("\n" + "="*70)
    logger.info("INTERPRETATION")
    logger.info("="*70)
    logger.info(f"✓ Model explains {test_r2*100:.1f}% of delay variance")
    logger.info(f"✓ Average prediction error: ±{test_mae:.1f} minutes")
    
    if test_r2 > 0.85:
        logger.info("✓ EXCELLENT model performance on realistic data!")
    elif test_r2 > 0.80:
        logger.info("✓ GOOD model performance - ready for use")
    else:
        logger.info("⚠ Fair performance - consider more data")


def save_realistic_data(df: pd.DataFrame, filename: str = "railway_data_realistic.csv") -> None:
    """
    Save the realistic data for later training.
    """
    df.to_csv(filename, index=False)
    logger.info(f"\n✓ Saved realistic data to: {filename}")
    logger.info(f"  You can now use this for: python train_model_real_data.py")


def main():
    logger.info("\n" + "="*70)
    logger.info("REAL DATA TRAINING EXAMPLE")
    logger.info("="*70)
    logger.info("\nThis example demonstrates:")
    logger.info("  1. Generating realistic railway data")
    logger.info("  2. Training the RandomForest model")
    logger.info("  3. Evaluating performance")
    logger.info("  4. Demonstrating improvement over synthetic data")
    
    # Step 1: Generate realistic data
    df = generate_realistic_data(n_samples=2000)
    
    # Step 2: Save it (so you can use it for actual training later)
    save_realistic_data(df)
    
    # Step 3: Train and evaluate
    train_and_evaluate(df)
    
    logger.info("\n" + "="*70)
    logger.info("NEXT STEPS")
    logger.info("="*70)
    logger.info("\n✓ To use realistic data for training:")
    logger.info("  1. Replace 'railway_data.csv' with your real data")
    logger.info("  2. Run: python train_model_real_data.py")
    logger.info("  3. Restart the AI service")
    logger.info("\n✓ Tips for better results:")
    logger.info("  - Collect data from multiple days/seasons")
    logger.info("  - Include weather information")
    logger.info("  - Track signal states accurately")
    logger.info("  - Aim for 1000+ training samples")
    logger.info("\n" + "="*70 + "\n")


if __name__ == "__main__":
    main()
