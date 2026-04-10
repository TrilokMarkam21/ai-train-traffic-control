# LOCAL TESTING GUIDE - Before Deployment

Run this before deploying to internet to make sure everything works!

---

## QUICK START (5 Minutes)

Open **3 Terminal Windows** side-by-side and run these commands:

### Terminal 1: AI Service (Python)
```bash
cd ai-train-traffic-control/ai-service
python -m uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ **AI Service running!**

---

### Terminal 2: Backend (Node.js)
```bash
cd ai-train-traffic-control/backend
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

✅ **Backend running!**

---

### Terminal 3: Frontend (React)
```bash
cd ai-train-traffic-control/frontend
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

✅ **Frontend running!**

---

## TEST IN BROWSER

Open browser: **http://localhost:5173**

You should see your app!

---

## TEST PREDICTIONS

### Option 1: Using the App UI
1. Click "Make Prediction" or similar button
2. Enter train info (trackStatus, currentDelay, etc.)
3. Click "Predict"
4. You should see:
   ```json
   {
     "predictedDelay": 19.3,
     "conflictRisk": "MEDIUM",
     "confidence": 0.92,
     "factors": [...]
   }
   ```

### Option 2: Using curl (command line test)

```bash
# Test prediction endpoint
curl -X POST http://localhost:5000/api/prediction \
  -H "Content-Type: application/json" \
  -d '{
    "trainNumber": "42",
    "trackStatus": "Congested",
    "currentDelay": 15,
    "priority": 1
  }'

# Should return
{
  "success": true,
  "data": {
    "predictedDelay": 19.3,
    "conflictRisk": "MEDIUM",
    "confidence": 0.92,
    "factors": ["High traffic density on section", "Train already delayed by 15 min"],
    "recommendation": "Monitor Train #42 closely...",
    "source": "ai_model"
  }
}
```

✅ **Prediction works!**

---

## VERIFY ALL 3 SERVICES

```bash
# In new terminal, check each service

# 1. AI Service health
curl http://localhost:8000/health
# Should return: { "status": "healthy" }

# 2. Backend health
curl http://localhost:5000/api/health
# Should return: { "status": "ok" }

# 3. Frontend loads
curl http://localhost:5173
# Should return HTML content
```

---

## TEST DIFFERENT SCENARIOS

Try these different inputs to make sure AI works:

### Test 1: Clear Track (Low Delay)
```bash
curl -X POST http://localhost:5000/api/prediction \
  -H "Content-Type: application/json" \
  -d '{
    "trainNumber": "1",
    "trackStatus": "Clear",
    "currentDelay": 0,
    "priority": 1
  }'

# Expected: predictedDelay ~5-10 min
```

### Test 2: Congested Track (Medium Delay)
```bash
curl -X POST http://localhost:5000/api/prediction \
  -H "Content-Type: application/json" \
  -d '{
    "trainNumber": "42",
    "trackStatus": "Congested",
    "currentDelay": 10,
    "priority": 2
  }'

# Expected: predictedDelay ~15-20 min
```

### Test 3: Blocked Track (High Delay)
```bash
curl -X POST http://localhost:5000/api/prediction \
  -H "Content-Type: application/json" \
  -d '{
    "trainNumber": "99",
    "trackStatus": "Blocked",
    "currentDelay": 20,
    "priority": 3
  }'

# Expected: predictedDelay ~25-35 min (HIGH risk)
```

---

## VERIFY NO OLLAMA DEPENDENCY

Check that system works WITHOUT Ollama (confirm it's disabled):

```bash
# 1. Check .env file
cat backend/.env | grep OLLAMA

# Should show:
# OLLAMA_ENABLED=false

# 2. Check backend logs for Ollama error
# You should NOT see any Ollama-related errors
# Open http://localhost:5173 and make prediction
# Check Terminal 2 (backend) logs:
# Should NOT mention Ollama or explain generation failures
```

✅ **System works without Ollama!**

---

## LOGS & DEBUGGING

### View Backend Logs
Watch Terminal 2 while making predictions. You should see:
```
[AI Service] Sending request for train 42: { traffic_density: 0.85, ... }
[AI Service] Success for train 42: delay=19.3min, risk=MEDIUM
```

### View AI Service Logs
Watch Terminal 1 while making predictions. You should see:
```
INFO: POST /v1/predict
INFO: XGBoost pred: 19.1 min (conf: 0.88)
INFO: LSTM pred: 19.5 min (conf: 0.85)
INFO: Ensemble: XGB=19.1, LSTM=19.5, Ensemble=19.3
```

### Check Database (MongoDB)
```bash
# Predictions should be saved to MongoDB
# Go to https://cloud.mongodb.com
# Collection: predictions
# You should see entries with trainNumber, predictedDelay, etc.
```

---

## PERFORMANCE TESTING

### Measure Response Time
```bash
# Time a single prediction
time curl -X POST http://localhost:5000/api/prediction \
  -H "Content-Type: application/json" \
  -d '{"trainNumber":"42","trackStatus":"Congested","currentDelay":15,"priority":1}'

# Should complete in < 500ms
# Expected: real 0.xxx s
```

### Test Multiple Concurrent Predictions
```bash
# Send 5 predictions at same time (test concurrency)
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/prediction \
    -H "Content-Type: application/json" \
    -d "{\"trainNumber\":\"$i\",\"trackStatus\":\"Occupied\",\"currentDelay\":5,\"priority\":1}" &
done
wait

# All should succeed without timeouts
```

---

## CHECKLIST BEFORE DEPLOYING

- [ ] Terminal 1: AI Service running ✅
- [ ] Terminal 2: Backend running ✅
- [ ] Terminal 3: Frontend running ✅
- [ ] Front end loads at http://localhost:5173 ✅
- [ ] Prediction works with different inputs ✅
- [ ] Response includes factors & recommendation ✅
- [ ] No Ollama errors in logs ✅
- [ ] Response time < 500ms ✅
- [ ] MongoDB saving predictions ✅
- [ ] .env has OLLAMA_ENABLED=false ✅

---

## STOP SERVICES

When done testing, stop all services:

```bash
# Terminal 1: Ctrl+C
# Terminal 2: Ctrl+C
# Terminal 3: Ctrl+C
```

---

## COMMON ISSUES

### "Module not found" error
```bash
# Install dependencies
cd backend && npm install
cd ../ai-service && pip install -r requirements.txt
```

### "Port already in use"
```bash
# Change port in command
# AI Service: --port 8001
# Backend: PORT=5001 npm start
# Frontend: npm run dev -- --port 5174
```

### "Cannot connect to MongoDB"
```bash
# Check connection string in .env
# Make sure MongoDB Atlas IP whitelist includes your machine
# Go to https://cloud.mongodb.com → Security → IP Whitelist → Add 0.0.0.0/0
```

### "Models not found" error
```bash
# Make sure model files exist
ls -la ai-service/model/
# Should show: xgboost_model.pkl, lstm_model.h5, lstm_scaler_stats.json
```

---

## READY FOR DEPLOYMENT!

If all checks pass ✅, your system is ready for production!

👉 **Next:** Read `DEPLOY_TO_INTERNET.md` for deployment steps

**Your app will work perfectly on the internet! 🚀**
