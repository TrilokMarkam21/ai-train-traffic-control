# AI Train Traffic Control - Prediction Microservice

A production-ready FastAPI microservice for predicting train delays and congestion risk in railway systems.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Training the Model](#training-the-model)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing with cURL](#testing-with-curl)
- [Node.js Integration](#nodejs-integration)
- [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)

---

## Overview

This microservice provides real-time train delay predictions and congestion risk assessment using machine learning. It uses a RandomForestRegressor model trained on synthetic but realistic railway data.

### Key Features

- **FastAPI** framework for high-performance async API
- **RandomForestRegressor** for delay prediction
- **Input Validation** using Pydantic models
- **CORS Enabled** for cross-origin requests
- **Health Check** endpoint for monitoring
- **Structured Logging** for debugging
- **Docker Support** for containerized deployment

---

## Architecture

```
┌─────────────────┐      POST /v1/predict       ┌─────────────────┐
│  React Frontend │ ───────────────────────────► │  Node.js Backend│
│   (Port 3000)   │                              │  (Port 4000)    │
└─────────────────┘                              └────────┬────────┘
                                                          │
                                                          │ Forward
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  AI Microservice │
                                                 │   (Port 8000)    │
                                                 └─────────────────┘
```

---

## Project Structure

```
ai-service/
│
├── app/
│   ├── __init__.py      # Package marker
│   ├── main.py          # FastAPI application & endpoints
│   ├── schemas.py       # Pydantic models (input/output)
│   ├── predictor.py     # ML inference logic
│   ├── config.py        # Configuration management
│   └── logger.py        # Logging setup
│
├── model/
│   └── train_model.pkl  # Trained ML model
│
├── train_model.py       # Model training script
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker container image
└── README.md           # This file
```

---

## Prerequisites

- Python 3.10 - 3.13 (Python 3.14 is not supported yet)
- pip package manager
- (Optional) Docker for containerized deployment

---

## Installation

### 1. Create Virtual Environment (Recommended)

```bash
# Navigate to service directory
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Training the Model

Before running the service, you need to train and save the model:

```bash
python train_model.py
```

### Expected Output

```
2024-01-15 10:00:00 | INFO     | ==============================
2024-01-15 10:00:00 | INFO     | AI TRAIN TRAFFIC CONTROL - MODEL TRAINING
2024-01-15 10:00:00 | INFO     | ==============================
2024-01-15 10:00:01 | INFO     | Generating 10000 synthetic samples...
2024-01-15 10:00:02 | INFO     | Training set size: 8000, Test set size: 2000
2024-01-15 10:00:05 | INFO     | Training RandomForestRegressor...
2024-01-15 10:00:10 | INFO     | Model training complete!
2024-01-15 10:00:10 | INFO     | ==================================================
2024-01-15 10:00:10 | INFO     | MODEL PERFORMANCE METRICS
2024-01-15 10:00:10 | INFO     | ==================================================
2024-01-15 10:00:10 | INFO     | Training R2 Score:  0.9845
2024-01-15 10:00:10 | INFO     | Training MAE:       2.15 minutes
2024-01-15 10:00:10 | INFO     | Test R2 Score:      0.9234
2024-01-15 10:00:10 | INFO     | Test MAE:           4.32 minutes
2024-01-15 10:00:10 | INFO     | ==================================================
```

The model will be saved to `model/train_model.pkl`.

---

## Running the Service

### Option 1: Using Uvicorn Directly

```bash
# From ai-service directory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

On Windows, prefer an explicit compatible interpreter:

```bash
py -3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Run as Python Module

```bash
# From ai-service directory
python -m app.main
```

### Option 3: Using the Main Script

```bash
# From ai-service directory
python app/main.py
```

The service will start on `http://localhost:8000`

---

## API Documentation

Once running, visit the interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Root endpoint |
| POST | `/v1/predict` | Make prediction |

---

## Testing with cURL

### Health Check

```bash
curl -X GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### Make a Prediction

```bash
curl -X POST http://localhost:8000/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "traffic_density": 0.65,
    "weather_score": 0.8,
    "historical_delay": 15.5,
    "signal_status": 1
  }'
```

**Response:**
```json
{
  "predicted_delay_minutes": 18.5,
  "congestion_risk": "Medium",
  "confidence_score": 0.87
}
```

---

## Node.js Integration

### Axios Example

```javascript
// In your Node.js backend (Express)
const axios = require('axios');

async function predictDelay(data) {
  try {
    const response = await axios.post(
      'http://localhost:8000/v1/predict',
      {
        traffic_density: data.trafficDensity,
        weather_score: data.weatherScore,
        historical_delay: data.historicalDelay,
        signal_status: data.signalStatus
      }
    );
    
    return {
      predictedDelay: response.data.predicted_delay_minutes,
      congestionRisk: response.data.congestion_risk,
      confidence: response.data.confidence_score
    };
  } catch (error) {
    console.error('Prediction error:', error.message);
    throw error;
  }
}

// Usage
const result = await predictDelay({
  trafficDensity: 0.65,
  weatherScore: 0.8,
  historicalDelay: 15.5,
  signalStatus: 1
});

console.log(result);
```

### Full Integration in Express Route

```javascript
// backend/src/routes/ai.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/predict', async (req, res) => {
  try {
    const { traffic_density, weather_score, historical_delay, signal_status } = req.body;
    
    const response = await axios.post('http://localhost:8000/v1/predict', {
      traffic_density,
      weather_score,
      historical_delay,
      signal_status
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
});

module.exports = router;
```

---

## Docker Deployment

### Build the Image

```bash
cd ai-service
docker build -t ai-train-service .
```

### Run the Container

```bash
docker run -d \
  --name ai-train-service \
  -p 8000:8000 \
  -v $(pwd)/logs:/app/logs \
  ai-train-service
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    volumes:
      - ./ai-service/logs:/app/logs
    environment:
      - DEBUG=false
    healthcheck:
      test: ["CMD", "python", "-c", "import httpx; httpx.get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Configuration

### Environment Variables

Create a `.env` file in the `ai-service` directory:

```env
# Application
APP_NAME=AI Train Traffic Control Service
APP_VERSION=1.0.0
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# Model
MODEL_PATH=model/train_model.pkl

# CORS
CORS_ORIGINS=["*"]
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | AI Train Traffic Control Service | Service name |
| `APP_VERSION` | 1.0.0 | API version |
| `DEBUG` | false | Debug mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `MODEL_PATH` | model/train_model.pkl | Model file path |
| `CORS_ORIGINS` | ["*"] | Allowed CORS origins |

---

## Input/Output Schemas

### Prediction Request

```json
{
  "traffic_density": 0.65,
  "weather_score": 0.8,
  "historical_delay": 15.5,
  "signal_status": 1
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `traffic_density` | float | 0.0 - 1.0 | Traffic density |
| `weather_score` | float | 0.0 - 1.0 | Weather condition (1 = clear) |
| `historical_delay` | float | 0.0 - 120.0 | Historical delay (minutes) |
| `signal_status` | int | 0 - 2 | 0=green, 1=yellow, 2=red |

### Prediction Response

```json
{
  "predicted_delay_minutes": 18.5,
  "congestion_risk": "Medium",
  "confidence_score": 0.87
}
```

| Field | Type | Description |
|-------|------|-------------|
| `predicted_delay_minutes` | float | Predicted delay in minutes |
| `congestion_risk` | string | Low, Medium, or High |
| `confidence_score` | float | Model confidence (0.0 - 1.0) |

---

## Performance Metrics

The trained model typically achieves:

- **R² Score**: ~0.92 (test set)
- **MAE**: ~4.3 minutes
- **RMSE**: ~5.8 minutes

### Feature Importance

| Feature | Importance |
|---------|------------|
| traffic_density | ~35% |
| weather_score | ~25% |
| historical_delay | ~25% |
| signal_status | ~15% |

---

## License

MIT License - Created for AI Train Traffic Control System
