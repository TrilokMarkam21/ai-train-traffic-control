# Training AI Model with Real Railway Data - Complete Guide

## 🎯 Step-by-Step Process

### **PHASE 1: COLLECT REAL DATA**

#### Option 1: Government Railway Databases
- **Indian Railways**: Data available at data.gov.in
- **UK National Rail**: open data at data.transport.gov.uk
- **Europe**: Open data from European railway operators
- **USA**: FRA (Federal Railroad Administration) data

#### Option 2: Individual Railway Operators
- Direct data requests from:
  - Indian Railways divisions
  - Regional transit authorities
  - Metro systems (Delhi Metro, Mumbai Metro, etc.)

#### Option 3: Public APIs
- OpenTrainTimes API (UK trains)
- Transit Feed (global transit data)
- Transitopen data feeds

#### Option 4: Kaggle Datasets
- Search "train delay" or "railway" on Kaggle.com
- Popular: NYC MTA data, Chicago Metra data, European Train Delays dataset

---

## 🔄 DATA REQUIREMENTS

### Minimum Data Needed
Your CSV/Excel file should have these columns:

```
Required Columns:
├── traffic_density        (0.0-1.0)      # Section occupancy level
├── weather_score          (0.0-1.0)      # Weather quality (0=bad, 1=clear)
├── historical_delay       (0-120)        # Minutes already delayed
├── signal_status          (0, 1, 2)      # 0=green, 1=yellow, 2=red
└── delay_minutes          (0+)           # ACTUAL delay (target to predict)

Optional but helpful:
├── train_number           (string)       # E.g., "12345"
├── route_id               (string)       # E.g., "DELHI_MUMBAI"
├── station_name           (string)       # Station name
├── scheduled_time         (datetime)     # When should it arrive?
├── actual_time            (datetime)     # When did it actually arrive?
├── speed_kmh              (float)        # Current speed
├── passenger_count        (int)          # Occupancy
└── maintenance_status     (0/1)          # Is train under maintenance?
```

---

## 📊 DATA COLLECTION EXAMPLES

### Example 1: Western Railways (India)
```
If you get data like:
  Train_ID,Station,Scheduled_Arrival,Actual_Arrival,Current_Delay,Speed,Occupancy
  12001,"Delhi Central","10:30","10:45",15,80,750
  12002,"New Delhi","11:00","11:18",18,75,680
  
Convert to our format:
  traffic_density = occupancy/1000 = 0.75
  weather_score = 0.8 (estimate or from weather API)
  historical_delay = current_delay = 15
  signal_status = 1 (estimate from speed: <50=yellow, >80=green)
  delay_minutes = scheduled - actual = 15
```

### Example 2: Public CSV File
```
If you download from open data:
  trip_id,stop_sequence,arrival_time,departure_time,stop_id,section_status

Parse it:
  - Calculate delays vs schedule
  - Estimate traffic from consecutive stop delays
  - Normalize to 0-1 scale
  - Aggregate into our 4 features
```

---

## 🛠️ DATA PREPROCESSING PIPELINE

### Step 1: Load Your Raw Data
```python
import pandas as pd

# Load your real data
df_raw = pd.read_csv("railway_data.csv")

# Inspect it
print(df_raw.head())
print(df_raw.info())
print(df_raw.describe())
```

### Step 2: Handle Missing Values
```python
# Check for missing data
print(df_raw.isnull().sum())

# Fill missing values intelligently:
df = df_raw.copy()

# For traffic_density: use median per section
df['traffic_density'].fillna(
    df.groupby('section_id')['traffic_density'].transform('median'),
    inplace=True
)

# For weather_score: use daily average
df['weather_score'].fillna(
    df.groupby(pd.Grouper(key='timestamp', freq='D'))['weather_score'].transform('mean'),
    inplace=True
)

# For signal_status: forward fill (assume previous state continues)
df['signal_status'].fillna(method='ffill', inplace=True)

# Drop remaining rows with missing critical values
df.dropna(subset=['delay_minutes'], inplace=True)

print(f"Rows remaining: {len(df)}")
```

### Step 3: Normalize Features to 0-1 Scale
```python
# Some data might be in different scales (0-60 min delay, vs 0-150 min)
# Normalize to match our AI model expectations

from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler(feature_range=(0, 1))

# traffic_density - already 0-1, just validate
df['traffic_density'] = df['traffic_density'].clip(0, 1)

# weather_score - already 0-1, just validate  
df['weather_score'] = df['weather_score'].clip(0, 1)

# historical_delay - cap at 120 minutes, then normalize
df['historical_delay'] = df['historical_delay'].clip(0, 120)

# signal_status - ensure it's 0, 1, or 2
df['signal_status'] = df['signal_status'].astype(int).clip(0, 2)

# delay_minutes - no capping, but handle outliers
delay_q99 = df['delay_minutes'].quantile(0.99)
df['delay_minutes'] = df['delay_minutes'].clip(0, delay_q99)

print("Data normalized successfully!")
```

### Step 4: Remove Outliers (Optional)
```python
# Remove extreme outliers that might be data errors
# Keep only values within 3 standard deviations

for col in ['traffic_density', 'weather_score', 'historical_delay', 'delay_minutes']:
    mean = df[col].mean()
    std = df[col].std()
    lower = mean - 3*std
    upper = mean + 3*std
    
    df = df[(df[col] >= lower) & (df[col] <= upper)]
    
    print(f"{col}: Removed {len(df_raw) - len(df)} outliers")

print(f"Final dataset size: {len(df)}")
```

### Step 5: Verify Data Quality
```python
# Check for data quality issues
print("Data Quality Report:")
print("=" * 50)

# Check ranges
print(f"traffic_density range: {df['traffic_density'].min():.2f} - {df['traffic_density'].max():.2f}")
print(f"weather_score range: {df['weather_score'].min():.2f} - {df['weather_score'].max():.2f}")
print(f"historical_delay range: {df['historical_delay'].min():.2f} - {df['historical_delay'].max():.2f}")
print(f"signal_status values: {sorted(df['signal_status'].unique())}")
print(f"delay_minutes range: {df['delay_minutes'].min():.2f} - {df['delay_minutes'].max():.2f}")

# Check distributions
print("\nDelay Statistics:")
print(df['delay_minutes'].describe())

# Good sign: delay_minutes should have reasonable mean (5-20 min)
# if mean is > 50 min, data might be skewed
```

---

## 🐍 MODIFIED TRAINING SCRIPT

Create a new file: `train_model_real_data.py`

```python
"""
Train Model with Real Railway Data
==================================
Modified script that loads real data instead of generating synthetic data.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

sys.path.insert(0, str(Path(__file__).parent))
from app.logger import logger


def load_and_preprocess_real_data(csv_file: str) -> pd.DataFrame:
    """
    Load and preprocess real railway data from CSV.
    
    Args:
        csv_file: Path to your CSV file
    
    Returns:
        Preprocessed DataFrame with correct features
    """
    logger.info(f"Loading data from {csv_file}...")
    
    df = pd.read_csv(csv_file)
    logger.info(f"Loaded {len(df)} records")
    
    # Ensure required columns exist
    required_cols = ['traffic_density', 'weather_score', 'historical_delay', 'signal_status', 'delay_minutes']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Handle missing values
    logger.info("Handling missing values...")
    df = df.dropna(subset=['delay_minutes'])  # Drop if target is missing
    
    # Fill feature values with median
    for col in required_cols[:-1]:
        df[col].fillna(df[col].median(), inplace=True)
    
    # Normalize to valid ranges
    logger.info("Normalizing feature ranges...")
    df['traffic_density'] = df['traffic_density'].clip(0, 1)
    df['weather_score'] = df['weather_score'].clip(0, 1)
    df['historical_delay'] = df['historical_delay'].clip(0, 120)
    df['signal_status'] = df['signal_status'].astype(int).clip(0, 2)
    df['delay_minutes'] = df['delay_minutes'].clip(0, df['delay_minutes'].quantile(0.99))
    
    # Remove outliers (values > 3 std devs from mean)
    logger.info("Removing outliers...")
    initial_len = len(df)
    for col in ['traffic_density', 'weather_score', 'historical_delay', 'delay_minutes']:
        mean = df[col].mean()
        std = df[col].std()
        df = df[(df[col] >= mean - 3*std) & (df[col] <= mean + 3*std)]
    
    logger.info(f"Removed {initial_len - len(df)} outliers")
    
    # Log data quality
    logger.info("\nData Quality Report:")
    logger.info(f"  Records: {len(df)}")
    logger.info(f"  traffic_density: {df['traffic_density'].min():.2f} - {df['traffic_density'].max():.2f}")
    logger.info(f"  weather_score: {df['weather_score'].min():.2f} - {df['weather_score'].max():.2f}")
    logger.info(f"  historical_delay: {df['historical_delay'].min():.2f} - {df['historical_delay'].max():.2f}")
    logger.info(f"  signal_status: {sorted(df['signal_status'].unique())}")
    logger.info(f"  delay_minutes: {df['delay_minutes'].min():.2f} - {df['delay_minutes'].max():.2f} (mean: {df['delay_minutes'].mean():.2f})")
    
    return df


def train_model(df: pd.DataFrame) -> RandomForestRegressor:
    """Train RandomForest on real data."""
    
    logger.info("Preparing features and target...")
    X = df[["traffic_density", "weather_score", "historical_delay", "signal_status"]]
    y = df["delay_minutes"]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    logger.info(f"Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    logger.info("Training RandomForestRegressor...")
    
    model = RandomForestRegressor(
        n_estimators=50,          # Increase from 20 since we have real data
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    
    test_r2 = r2_score(y_test, y_pred_test)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    logger.info("=" * 60)
    logger.info("MODEL PERFORMANCE (REAL DATA)")
    logger.info("=" * 60)
    logger.info(f"Training R²:  {train_r2:.4f}")
    logger.info(f"Training MAE: {train_mae:.2f} minutes")
    logger.info(f"Training RMSE:{train_rmse:.2f} minutes")
    logger.info("-" * 60)
    logger.info(f"Test R²:      {test_r2:.4f}")
    logger.info(f"Test MAE:     {test_mae:.2f} minutes")
    logger.info(f"Test RMSE:    {test_rmse:.2f} minutes")
    logger.info("=" * 60)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        "feature": X.columns,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)
    
    logger.info("\nFeature Importance (Real Data):")
    for _, row in feature_importance.iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")
    
    return model


def save_model(model: RandomForestRegressor, path: Path) -> None:
    """Save trained model."""
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    logger.info(f"Model saved to: {path}")


def main():
    """Main training pipeline with real data."""
    logger.info("=" * 60)
    logger.info("TRAINING WITH REAL RAILWAY DATA")
    logger.info("=" * 60)
    
    # Configuration
    CSV_FILE = "railway_data.csv"  # CHANGE THIS TO YOUR FILE PATH
    MODEL_PATH = Path(__file__).parent / "model" / "train_model.pkl"
    
    # Load and preprocess
    df = load_and_preprocess_real_data(CSV_FILE)
    
    # Train
    model = train_model(df)
    
    # Save
    save_model(model, MODEL_PATH)
    
    logger.info("\nTraining complete!")


if __name__ == "__main__":
    main()
```

---

## 🚀 HOW TO USE

### 1. Prepare Your Data
```bash
# Your data should be in CSV format:
# traffic_density,weather_score,historical_delay,signal_status,delay_minutes
# 0.75,0.8,12.0,1,18.5
# 0.85,0.6,8.0,2,22.3
# ...

# Save as: railway_data.csv (in ai-service folder)
```

### 2. Run Training
```bash
cd d:\clonetest\ai-train-traffic-control\ai-service

# Make sure venv is activated
.\venv\Scripts\activate

# Run training with real data
.\venv\Scripts\python train_model_real_data.py
```

### 3. Monitor Training Output
```
[INFO] Loading data from railway_data.csv...
[INFO] Loaded 5000 records
[INFO] Handling missing values...
[INFO] Normalizing feature ranges...
[INFO] Removing outliers...
[INFO] Removed 42 outliers

Data Quality Report:
  Records: 4958
  traffic_density: 0.00 - 1.00
  weather_score: 0.15 - 0.98
  historical_delay: 0.0 - 120.0
  signal_status: [0, 1, 2]
  delay_minutes: 1.2 - 45.3 (mean: 14.7)

[INFO] Training set: 3966, Test set: 992
[INFO] Training RandomForestRegressor...

MODEL PERFORMANCE (REAL DATA)
============================================================
Training R²:  0.8923
Training MAE: 2.34 minutes
Training RMSE:3.12 minutes
---
Test R²:      0.8654
Test MAE:     2.89 minutes
Test RMSE:    3.87 minutes
============================================================

Feature Importance (Real Data):
  traffic_density: 0.3421
  historical_delay: 0.2834
  signal_status: 0.2103
  weather_score: 0.1642

Model saved to: model/train_model.pkl
```

---

## 📈 EXPECTED IMPROVEMENTS WITH REAL DATA

| Metric | Synthetic | Real Data | Improvement |
|--------|-----------|-----------|-------------|
| R² Score | 0.89 | 0.92+ | More accurate |
| MAE | 2.34 min | 1.8 min | Better precision |
| Feature Importance | Generic | Actual patterns | Relevant to your railway |
| Confidence | 92% | 95%+ | More trustworthy |

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: "Missing required column"
**Solution:** Ensure your CSV has: `traffic_density`, `weather_score`, `historical_delay`, `signal_status`, `delay_minutes`

### Issue: "Data ranges don't match"
**Solution:** Your data might have different scales. Example:
- If delays are in seconds, divide by 60
- If traffic is 0-100, divide by 100
- Add this: `df['traffic_density'] = df['your_column'] / 100`

### Issue: "R² score is very low (< 0.5)"
**Solutions:**
1. More data needed (get 5000+ samples)
2. Features don't capture delay (maybe add more features)
3. Data quality issue (check for noise/errors)

### Issue: "Model performs great on training but bad on test"
**Solution:** Overfitting. Reduce tree depth:
```python
model = RandomForestRegressor(
    max_depth=10,  # Reduce from 20
    min_samples_split=10,  # Increase from 5
)
```

---

## 🔗 REAL DATA SOURCES

### Indian Railways
- **Website:** data.gov.in
- **Dataset:** Train delay data
- **Format:** CSV/JSON
- **Examples:**
  - Delhi Division daily statistics
  - Indian Railways Performance Dashboard

### Public Kaggle Datasets
- **Search:** "train delay", "railway", "transport"
- **Popular:**
  - NYC MTA Subway data
  - Chicago Metra on-time performance
  - European Train Delays dataset

### Use Your Own Data
If you have actual logs from a railway system:

```python
# Convert operating logs to our format
def convert_operating_logs(operational_data):
    """
    Convert your actual operational logs to training format.
    Example: logs from a real signaling system
    """
    result = {
        'traffic_density': calculate_occupancy(operational_data),
        'weather_score': get_weather_data(operational_data['date']),
        'historical_delay': operational_data['delay_so_far'],
        'signal_status': get_signal_aspect(operational_data),
        'delay_minutes': operational_data['actual_delay']
    }
    return result
```

---

## ✅ CHECKLIST

- [ ] Found real railway data (CSV file)
- [ ] Verified it has required columns
- [ ] Run preprocessing to normalize values
- [ ] Check data quality report
- [ ] Update CSV_FILE path in train_model_real_data.py
- [ ] Run training script
- [ ] Check R² score is > 0.85
- [ ] Restart FastAPI service to use new model
- [ ] Test predictions are more accurate

---

**Next step:** Get your real data CSV file ready and run the training script!
