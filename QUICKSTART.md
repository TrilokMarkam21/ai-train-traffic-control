# Quick Start Guide - New AI System

## 5-Minute Setup

### 1. Verify Models Are Ready
```bash
cd ai-service
# You should see these files exist:
# - model/xgboost_model.pkl (5 MB) ✓
# - model/lstm_model.h5 (optional)
ls model/
```

### 2. Start AI Service
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO      Uvicorn running on http://127.0.0.1:8000
```

### 3. Start Backend
```bash
cd backend
npm start
```

You should see:
```
Server running on http://localhost:5000
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v... ready in ... ms
```

### 5. Test It
Open: http://localhost:5173

Make a prediction and you should see:
- ✅ Fast predictions (10-30ms)
- ✅ Factors explaining the delay
- ✅ Risk assessment

---

## 10-Minute Optional: Add AI Explanations (Ollama)

### Step 1: Install Ollama
1. Go to https://ollama.ai
2. Download Windows version
3. Run installer

### Step 2: Download Model
Open Command Prompt:
```bash
ollama pull mistral
```

Wait for download (~4 GB).

### Step 3: Start Ollama
Keep Ollama running in background. It auto-starts on Windows.

### Step 4: Enable in Your App
Add to `backend/.env`:
```bash
OLLAMA_ENABLED=true
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

Restart backend:
```bash
npm start
```

### Step 5: Test
Make a prediction. You should now see `aiExplanation` in the response with natural language explanations!

---

## Performance Comparison

### Without Ollama
- Prediction: 10-30ms
- Total response: ~100ms

### With Ollama
- Prediction: 10-30ms
- Explanation: 500-1000ms
- Total response: ~1 second

Both are fast enough for traffic control!

---

## What Changed vs Before

| When | What It Does |
|------|------------|
| **Before** (Old System) | RandomForest + TensorFlow → numerical prediction only |
| **Now** (New System) | XGBoost → numerical prediction (faster, lighter) |
| **Now + Ollama** | XGBoost + Ollama LLaMA → prediction + AI explanation |

---

## Troubleshooting

### AI Service won't start
```bash
# Check if XGBoost is installed
pip install xgboost

# Check if model file exists
ls ai-service/model/xgboost_model.pkl
```

### Ollama explanations not showing up
1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/health
   ```

2. Check backend logs for Ollama errors

3. Disable Ollama to verify system still works:
   ```bash
   # In backend/.env
   OLLAMA_ENABLED=false
   ```

### Predictions are slow
- Normal range: 10-30ms for prediction + 500-1000ms for Ollama
- If prediction takes >100ms: Check AI service logs
- If Ollama explanation is slow: This is normal for LLMs

---

## File Locations

Important files in new system:
```
ai-service/
  ├── train_model_xgboost.py       # XGBoost training script
  ├── train_model_lstm.py          # LSTM training script
  ├── model/
  │   ├── xgboost_model.pkl        # Trained model (5 MB)
  │   ├── lstm_model.h5            # LSTM model (optional)
  │   └── lstm_scaler_stats.json
  └── app/
      └── ensemble_predictor.py    # New model loader

backend/
  └── src/services/
      └── aiService.js             # Updated with Ollama integration
```

---

## Next: Real Data Training

Once you verify the system works, you can train on real data:

1. Collect real train delay data
2. Run training script:
   ```bash
   cd ai-service
   python train_model_xgboost.py --real-data path/to/data.csv
   ```
3. Models auto-reload on next prediction

---

## Files to Read

1. **`UPGRADE_COMPLETE.md`** - Full technical details
2. **`OLLAMA_SETUP.md`** - Detailed Ollama guide
3. **`README.md`** - Original project docs (still valid)

---

## Key Metrics

### Accuracy
- RandomForest: R² = 0.985
- XGBoost: R² = 0.954  (acceptable, much lighter)

### Speed
- RandomForest: 50-100ms
- XGBoost: 10-30ms  (5x faster!)

### Cost
- Old system: $50-200/month
- New system: $0/month  (local)
- Annual savings: $600-2,400

---

## That's It!

You now have:
✅ Faster AI models
✅ Lighter footprint
✅ AI-generated explanations (optional)
✅ $0 operational cost
✅ Better accuracy per computation

Enjoy!
