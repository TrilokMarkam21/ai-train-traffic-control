# AI Train Traffic Control System - Complete Project Documentation

## 📋 Project Overview

**AI Train Traffic Control** is a full-stack web application for managing and monitoring train traffic with AI-powered delay predictions. The system provides real-time tracking, scheduling, maintenance management, and intelligent predictions to optimize railway operations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│                     http://localhost:5173                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                │
│                      http://localhost:5000                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │   Auth   │ │  Trains  │ │ Traffic  │ │   AI Integration    │ │
│  │  Routes  │ │  Routes  │ │  Routes  │ │   (Predict Delay)   │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────┐    ┌──────────┐
       │ MongoDB  │   │  AI      │    │ WebSocket│
       │ Atlas    │   │ Service  │    │ Real-time│
       └──────────┘   └──────────┘    └──────────┘
                      :8000
```

---

## 🎯 Features

### 1. Dashboard
- **Real-time overview** of the entire train network
- **Statistics cards**: Active trains, AI predictions, conflicts, average delay
- **System status**: Signal network, AI engine, track sensors, communication hub
- **Recent activity feed**: Live updates on train movements

### 2. Train Management (`/api/trains`)
- **CRUD operations** for trains
- Track train details: number, name, status, speed, delay, priority
- **Real-time position** tracking with section occupancy
- **Status management**: On Time, Delayed, Stopped, Maintenance

### 3. Traffic Control (`/api/traffic`)
- **Section occupancy monitoring**: Which track sections are busy
- **Conflict detection**: Trains too close together (headway violations)
- **Schedule adherence tracking**: Compare actual vs scheduled positions
- **Delay impact analysis**: How delays propagate to connecting trains
- **Platform assignment suggestions**: Optimal platform recommendations
- **AI-powered recommendations**: Automatic suggestions for operators

### 4. Schedules (`/api/schedules`)
- Train schedules with arrival/departure times
- Station stops management
- Day-of-week scheduling
- Distance tracking from origin

### 5. Maintenance (`/api/maintenance`)
- Track maintenance records
- Start/complete maintenance tasks
- Maintenance history and status tracking

### 6. Analytics (`/api/analytics`)
- Delay distribution analysis
- Performance metrics
- Traffic trends
- Historical data visualization

### 7. AI Predictions (`/api/ai`)
- **Delay prediction** using ML model
- **Congestion risk assessment**
- **Confidence scoring**
- Takes inputs: traffic density, weather score, historical delay, signal status

### 8. Authentication (`/api/auth`)
- User registration and login
- JWT-based authentication
- Protected routes

### 9. Real-time Updates (WebSocket)
- Live train position updates
- Real-time dashboard refresh
- Simulated train movement

---

## 📁 Project Structure

```
ai-train-traffic-control/
│
├── backend/                    # Node.js Express Backend
│   ├── src/
│   │   ├── app.js             # Express app setup & routes
│   │   ├── server.js          # Server entry point
│   │   ├── config/
│   │   │   └── db.js          # MongoDB connection
│   │   ├── models/            # Mongoose models
│   │   │   ├── Train.js
│   │   │   ├── Schedule.js
│   │   │   ├── Maintenance.js
│   │   │   ├── Section.js
│   │   │   ├── TSR.js
│   │   │   ├── User.js
│   │   │   └── ...
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js
│   │   │   ├── trains.js
│   │   │   ├── trafficControl.js
│   │   │   ├── schedules.js
│   │   │   ├── maintenance.js
│   │   │   ├── analytics.js
│   │   │   └── ai.js
│   │   ├── services/          # Business logic
│   │   │   ├── trafficControlService.js
│   │   │   ├── aiService.js
│   │   │   └── simulator.js
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication
│   │   └── controllers/
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                  # React + Vite Frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TrainsPage.tsx
│   │   │   ├── TrafficControlPage.tsx
│   │   │   ├── SchedulesPage.tsx
│   │   │   ├── MaintenancePage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── TrackingPage.tsx
│   │   │   ├── AIControlPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── components/        # Reusable components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── TopNavbar.tsx
│   │   │   └── ui/            # UI components (shadcn)
│   │   ├── services/          # API services
│   │   ├── api/               # Axios API calls
│   │   ├── context/           # React context
│   │   └── socket/            # WebSocket client
│   └── package.json
│
├── ai-service/                # Python AI Microservice
│   ├── app/
│   │   ├── main.py            # FastAPI app
│   │   ├── predictor.py       # ML inference
│   │   ├── schemas.py         # Pydantic models
│   │   ├── config.py          # Configuration
│   │   └── logger.py          # Logging
│   ├── model/
│   │   └── train_model.pkl    # Trained ML model
│   ├── train_model.py          # Model training script
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile
│
└── README.md
```

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account

### Step 1: Start MongoDB
Ensure your MongoDB Atlas cluster is running (connection string in `backend/.env`)

### Step 2: Start Backend
```bash
cd backend
npm install
node server.js
```
- Runs on: **http://localhost:5000**

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
- Runs on: **http://localhost:5173**

### Step 4: Start AI Service (Optional)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Runs on: **http://localhost:8000**
- API docs: **http://localhost:8000/docs**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/trains` | Get all trains |
| POST | `/api/trains` | Create new train |
| GET | `/api/traffic/dashboard` | Traffic overview |
| GET | `/api/traffic/occupancy` | Section occupancy |
| GET | `/api/traffic/conflicts` | Conflict detection |
| GET | `/api/schedules` | Get schedules |
| GET | `/api/maintenance` | Get maintenance records |
| POST | `/api/ai/predict` | AI delay prediction |
| GET | `/api/analytics` | Analytics data |

---

## 🤖 AI Service

### Input Schema
```json
{
  "traffic_density": 0.65,
  "weather_score": 0.8,
  "historical_delay": 15.5,
  "signal_status": 1
}
```

### Output Schema
```json
{
  "predicted_delay_minutes": 18.5,
  "congestion_risk": "Medium",
  "confidence_score": 0.87
}
```

### Model Performance
- **R² Score**: ~0.92 (test set)
- **MAE**: ~4.3 minutes
- **RMSE**: ~5.8 minutes

---

## 🔧 Key Services Explained

### TrafficControlService
The core service for managing train traffic:
1. **getSectionOccupancy()** - Shows which track sections are busy
2. **detectConflicts()** - Finds trains too close together
3. **getScheduleAdherence()** - Compares actual vs scheduled positions
4. **analyzeDelayImpact()** - Shows how delays affect connecting trains
5. **suggestPlatformAssignment()** - Recommends optimal platforms
6. **getTrafficDashboard()** - Comprehensive traffic overview

### Simulator Service
- Generates simulated train movements
- Updates train positions in real-time
- Uses WebSocket for live updates

---

## 💻 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Express, MongoDB, Mongoose |
| AI Service | Python, FastAPI, scikit-learn |
| Real-time | WebSocket (Socket.io) |
| Authentication | JWT |
| Database | MongoDB Atlas |

---

## 📊 Database Models

### Train
- trainNumber, trainName, status
- speedKmph, delay, priority
- currentSection, origin, destination

### Schedule
- trainNumber, stationName, stationCode
- arrivalTime, departureTime
- dayOfWeek, distanceFromOrigin

### Section
- sectionId, name
- startStation, endStation
- lengthMeters, maxSpeedKmph

### Maintenance
- trainNumber, type, description
- startTime, endTime, status

---

## 🔐 Environment Variables

### backend/.env
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:8000
```

### ai-service/.env (optional)
```
DEBUG=false
PORT=8000
MODEL_PATH=model/train_model.pkl
```

---

## 📝 Summary

This project is a complete AI-powered train traffic control system that:

1. **Manages trains** - CRUD operations for train fleet
2. **Monitors traffic** - Real-time section occupancy and conflict detection
3. **Schedules** - Train schedules with station stops
4. **Tracks maintenance** - Maintenance records and history
5. **Predicts delays** - ML-based delay predictions
6. **Analyzes performance** - Analytics and insights
7. **Provides real-time updates** - WebSocket live tracking

The system is designed to help railway operators make informed decisions, optimize throughput, and minimize delays through AI-powered predictions and automated recommendations.
