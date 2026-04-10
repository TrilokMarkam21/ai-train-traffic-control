# 🚀 Quick Start: Training on Real Data

## 📋 In 5 Minutes

### 1. Prepare Your Data (2 min)

Create a CSV file named `railway_data.csv` in the `ai-service` folder with these columns:

```csv
traffic_density,weather_score,historical_delay,signal_status,delay_minutes
0.75,0.8,12.0,1,18.5
0.85,0.6,8.0,2,22.3
0.2,0.95,0.0,0,3.2
...
```

**Column Meanings:**
- `traffic_density`: 0.0 (empty) to 1.0 (fully congested)
- `weather_score`: 0.0 (severe storm) to 1.0 (clear sky)
- `historical_delay`: Current delay in minutes (0-120)
- `signal_status`: 0 (green/clear), 1 (yellow/caution), or 2 (red/stop)
- `delay_minutes`: **ACTUAL delay** (this is what we predict)

**Minimum requirement:** At least 100 rows of data (500+ is better)

### 2. Run Training Script (2 min)

```bash
# Navigate to ai-service folder
cd d:\clonetest\ai-train-traffic-control\ai-service

# Activate virtual environment
.\venv\Scripts\activate

# Run training script
python train_model_real_data.py
```

### 3. Watch the Output (1 min)

You'll see:
```
==================================================
AI TRAIN TRAFFIC CONTROL - REAL DATA TRAINING
==================================================

Loading data from railway_data.csv...
Loaded 1000 records

Handling missing values...
Normalizing feature ranges...
Removing outliers...

DATA QUALITY REPORT
==================================================
Total records: 995
  traffic_density:  0.100 - 0.980 (mean: 0.523)
  weather_score:    0.200 - 0.980 (mean: 0.743)
  historical_delay: 0.0 - 35.0 (mean: 11.2)
  signal_status:    [0, 1, 2]
  delay_minutes:    1.5 - 78.4 (mean: 24.3, std: 18.5)

Training model...

MODEL PERFORMANCE METRICS
==================================================
TRAINING METRICS:
  R² Score: 0.9234 (explains 92.34% of variance)
  MAE:      1.87 minutes (avg error)
  RMSE:     2.34 minutes

TEST METRICS:
  R² Score: 0.8912
  MAE:      2.45 minutes
  RMSE:     3.12 minutes

✓ Model saved to: model/train_model.pkl
```

### 4. Restart AI Service

The new model is automatically loaded when you restart:

```bash
# Kill the current AI service (Ctrl+C in its terminal)

# Restart it
.\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

### 5. Test It! ✅

Go to `http://localhost:8000/docs` and test the `/v1/predict` endpoint with your data.

You should see **better predictions now** with **real data patterns**!

---

## 🎯 Example: Converting Real Data

### If You Have Railway Operating Logs

**Your data might look like:**
```
train_id,station,scheduled_arrival,actual_arrival,traffic_level
12001,"Delhi Central","10:30","10:45","medium"
12002,"New Delhi","11:00","11:18","high"
```

**Convert to our format:**
```python
import pandas as pd

# Load your data
df = pd.read_csv('operating_logs.csv')

# Calculate features
output = pd.DataFrame({
    'traffic_density': df['traffic_level'].map({
        'low': 0.2, 'medium': 0.5, 'high': 0.85, 'congested': 0.95
    }),
    'weather_score': 0.8,  # Get from weather API or estimates
    'historical_delay': pd.to_datetime(df['actual_arrival']) - pd.to_datetime(df['scheduled_arrival']).dt.total_seconds() / 60,
    'signal_status': df['traffic_level'].map({
        'low': 0, 'medium': 1, 'high': 2, 'congested': 2
    }),
    'delay_minutes': (pd.to_datetime(df['actual_arrival']) - pd.to_datetime(df['scheduled_arrival'])).dt.total_seconds() / 60
})

output.to_csv('railway_data.csv', index=False)
```

---

## 🔧 Troubleshooting

### ❌ "FileNotFoundError: Data file not found"
**Solution:** Make sure you have `railway_data.csv` in the `ai-service` folder. Check the exact filename matches.

### ❌ "Missing required columns"
**Solution:** Your CSV must have exactly these columns:
- `traffic_density`
- `weather_score`
- `historical_delay`
- `signal_status`
- `delay_minutes`

Column names are CASE-SENSITIVE and must match exactly!

### ❌ "R² Score is very low (< 0.7)"
**Solutions:**
1. More data needed (get 500+ samples)
2. Features might not correlate well with delays
3. Add more features (passenger count, weather extremes, etc.)

### ❌ "Only 10 records after preprocessing"
**Solution:** Your data has quality issues:
- Too many missing values
- Wrong data types
- Outliers removed most data

Check data quality: Print first few rows, check for NaN, verify number ranges.

---

## 📊 How to Get More Real Data

### Option 1: Government Data
- **India:** data.gov.in → Search "train delay"
- **UK:** data.transport.gov.uk
- **EU:** European data portal
- **USA:** transportation.gov

### Option 2: Kaggle
- Search "train delay" or "railway" on kaggle.com
- Download CSV and preprocess to our format

### Option 3: Your Own Logs
- Export from your railway signaling/operating system
- Convert using the example above

### Option 4: Generate Semi-Real Data
```python
# Blend synthetic + real patterns
import pandas as pd
import numpy as np

# Real data you collected
df_real = pd.read_csv('your_data.csv')

# Synthetic data with similar distributions
np.random.seed(42)
delay_mean = df_real['delay_minutes'].mean()
delay_std = df_real['delay_minutes'].std()

df_synthetic = pd.DataFrame({
    'traffic_density': np.random.beta(5, 5, 1000),  # Similar distribution
    'weather_score': np.random.beta(7, 3, 1000),
    'historical_delay': np.random.exponential(delay_mean/2, 1000),
    'signal_status': np.random.choice([0, 1, 2], 1000, p=[0.6, 0.3, 0.1]),
    'delay_minutes': np.random.normal(delay_mean, delay_std, 1000)
})

# Combine
df_combined = pd.concat([df_real, df_synthetic], ignore_index=True)
df_combined.to_csv('railway_data.csv', index=False)
```

---

## ✨ Performance Expectations

With different amounts of real data:

| Data Size | Expected R² | Accuracy |
|-----------|-----------|----------|
| 100 samples | 0.75-0.80 | Fair |
| 500 samples | 0.80-0.85 | Good |
| 1000+ samples | 0.85-0.92 | Excellent |
| 5000+ samples | 0.90-0.95 | Excellent |

---

## 📝 Files Created

```
ai-service/
├── train_model_real_data.py          ← NEW: Script to train on real data
├── railway_data_sample.csv           ← NEW: Sample CSV format
├── REAL_DATA_TRAINING_GUIDE.md       ← NEW: Detailed guide
├── QUICK_START_REAL_DATA.md          ← This file
├── train_model.py                    ← Original (synthetic data)
└── model/
    └── train_model.pkl               ← MODEL (will be updated)
```

---

## 🎓 Learning Resources

- **scikit-learn documentation:** https://scikit-learn.org/stable/modules/ensemble.html#random-forests
- **RandomForest explained:** https://towardsdatascience.com/random-forest-in-python-24d0893d51c0
- **Feature importance:** https://scikit-learn.org/stable/modules/ensemble.html#feature-importance-evaluation

---

**Ready?** Start with the sample data, then replace with your real data! 🚀
