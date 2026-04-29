# 🛡️ Smart Tourist Safety Monitoring & Incident Response System

A full-stack intelligent safety system providing real-time tourist tracking, AI-based anomaly detection, SOS emergency handling, geo-fencing alerts, and an authority monitoring dashboard.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [AI Module](#ai-module)
- [Features](#features)
- [Demo Credentials](#demo-credentials)

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tourist PWA   │◄──►│  Node.js Backend │◄──►│    MongoDB      │
│   (React/Vite)  │    │  (Express + WS)  │    │  (Geospatial)   │
└─────────────────┘    └────────┬─────────┘    └─────────────────┘
                                │
                       ┌────────▼─────────┐
                       │  AI Microservice  │
                       │  (FastAPI/Python) │
                       └──────────────────┘
```

**3-Tier Architecture:**
1. **Frontend** — React PWA with Tailwind CSS, Framer Motion, Leaflet maps
2. **Backend** — Node.js + Express + Socket.IO + MongoDB
3. **AI Service** — Python FastAPI with Isolation Forest + Random Forest

---

## 🛠️ Tech Stack

| Layer       | Technology                                           |
|-------------|-----------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Framer Motion, Leaflet, Chart.js, Zustand, Socket.IO Client |
| Backend     | Node.js, Express, Socket.IO, Mongoose, JWT, Zod, Web Push, Winston |
| AI Service  | Python, FastAPI, scikit-learn (Isolation Forest + Random Forest), NumPy, Pandas |
| Database    | MongoDB with 2dsphere geospatial indexes             |
| DevOps      | Docker, Docker Compose, Nginx                        |

---

## 📁 Project Structure

```
smart-tourist-safety/
├── frontend/                    # React PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # Login, Register forms
│   │   │   ├── common/          # Sidebar, ThemeToggle, LoadingSpinner
│   │   │   ├── dashboard/       # LiveMap, StatsCards, IncidentPanel, Charts, Heatmap
│   │   │   └── tourist/         # SOSButton, TouristMap, AlertsList
│   │   ├── pages/               # All route pages
│   │   ├── hooks/               # useGeolocation, useSocket, useOfflineSync
│   │   ├── stores/              # Zustand stores (auth, theme)
│   │   ├── services/            # API client, Socket, Notifications
│   │   ├── i18n/                # Translations (en, es)
│   │   └── utils/               # Constants, helpers
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # Node.js API Server
│   ├── src/
│   │   ├── config/              # DB, Socket.IO, Logger
│   │   ├── models/              # User, Incident, LocationLog, GeoFence, Alert
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Auth, Validation, Rate Limiting
│   │   ├── services/            # Anomaly, Geofence, Notification, SMS
│   │   ├── validators/          # Zod schemas
│   │   └── seed/                # Database seeder
│   ├── server.js
│   └── package.json
│
├── ai-service/                  # Python AI Microservice
│   ├── app/
│   │   ├── models/              # AnomalyDetector (IF + RF + Rules)
│   │   ├── routes/              # Predict, Health endpoints
│   │   └── services/            # Data simulator, Model trainer
│   ├── train_model.py
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.10+
- **MongoDB** 7+ (local or cloud)
- **npm** or **yarn**

### Option A: Manual Setup

#### 1. Backend Setup
```bash
cd backend
cp .env.example .env    # Edit .env with your settings
npm install
npm run seed            # Seed demo data
npm run dev             # Start on port 5000
```

#### 2. AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py           # Train ML models
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Start on port 5173
```

### Option B: Docker Compose
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend: https://smart-tourist-safety-piu5.onrender.com
- AI Service: http://localhost:8000

---

## 🏃 Running the Project

| Service      | Command                          | URL                    |
|-------------|----------------------------------|------------------------|
| Backend     | `cd backend && npm run dev`      | https://smart-tourist-safety-piu5.onrender.com   |
| AI Service  | `cd ai-service && uvicorn app.main:app --reload --port 8000` | http://localhost:8000 |
| Frontend    | `cd frontend && npm run dev`     | http://localhost:5173   |
| MongoDB     | `mongod`                         | mongodb://localhost:27017 |

### Environment Variables (backend/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourist-safety
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint              | Description              | Auth   |
|--------|-----------------------|--------------------------|--------|
| POST   | `/api/auth/register`  | Register tourist/authority | No     |
| POST   | `/api/auth/login`     | Login                    | No     |
| GET    | `/api/auth/me`        | Get current user profile | JWT    |
| PUT    | `/api/auth/profile`   | Update profile           | JWT    |

#### Register Request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "tourist",
  "phone": "+1234567890",
  "nationality": "US",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+0987654321",
    "relation": "Spouse"
  }
}
```

#### Login Response
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "...", "dtid": "DTID-XXXX-YYYY", "role": "tourist" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Location Tracking
| Method | Endpoint                  | Description                | Auth       |
|--------|---------------------------|----------------------------|------------|
| POST   | `/api/locations/update`   | Send location update       | Tourist    |
| POST   | `/api/locations/sync`     | Sync offline locations     | Tourist    |
| GET    | `/api/locations/history/:userId` | Get location history | Authority  |
| GET    | `/api/locations/nearby`   | Find nearby tourists       | Authority  |

#### Location Update Request
```json
{
  "coordinates": [72.8777, 19.076],
  "accuracy": 10,
  "speed": 1.5,
  "heading": 180,
  "altitude": 15,
  "battery": 85
}
```

### Incidents
| Method | Endpoint             | Description              | Auth       |
|--------|----------------------|--------------------------|------------|
| POST   | `/api/incidents`     | Create incident          | JWT        |
| GET    | `/api/incidents`     | List incidents (filtered)| JWT        |
| GET    | `/api/incidents/:id` | Get incident detail      | JWT        |
| PUT    | `/api/incidents/:id` | Update status            | Authority  |
| POST   | `/api/incidents/sos` | Trigger SOS              | Tourist    |

#### SOS Request
```json
{
  "coordinates": [72.8777, 19.076],
  "description": "Need immediate help!"
}
```

### Geofences
| Method | Endpoint              | Description        | Auth       |
|--------|-----------------------|--------------------|------------|
| POST   | `/api/geofences`      | Create geofence    | Authority  |
| GET    | `/api/geofences`      | List geofences     | JWT        |
| PUT    | `/api/geofences/:id`  | Update geofence    | Authority  |
| DELETE | `/api/geofences/:id`  | Delete geofence    | Authority  |

### Analytics
| Method | Endpoint                      | Description             | Auth       |
|--------|-------------------------------|-------------------------|------------|
| GET    | `/api/analytics/dashboard`    | Dashboard stats         | Authority  |
| GET    | `/api/analytics/trends`       | Incident trends         | Authority  |
| GET    | `/api/analytics/heatmap`      | Heatmap data            | Authority  |
| GET    | `/api/analytics/response-times` | Response time analytics | Authority |

### AI Prediction
| Method | Endpoint              | Description           | Service    |
|--------|-----------------------|-----------------------|------------|
| POST   | `/api/predict`        | Single prediction     | AI Service |
| POST   | `/api/predict/batch`  | Batch prediction      | AI Service |
| GET    | `/api/health`         | Health check          | AI Service |

---

## 🤖 AI Module

### Models Used

1. **Isolation Forest** (Unsupervised)
   - Detects novel anomalies without labeled data
   - Contamination: 12%, Estimators: 200
   
2. **Random Forest Classifier** (Supervised)
   - Classifies known anomaly patterns
   - 200 estimators, balanced class weights

3. **Rule-Based Engine**
   - Inactivity detection (no movement >30 min)
   - High speed detection (>120 km/h)
   - Route deviation (impossible travel)
   - Night activity (1-5 AM with movement)

### Input Features
| Feature            | Description                              |
|-------------------|------------------------------------------|
| current_speed     | Current speed (m/s)                      |
| avg_speed         | Average speed over recent readings       |
| max_speed         | Max speed in recent readings             |
| speed_variance    | Variance of speed values                 |
| lat_variance      | Latitude variance                        |
| lng_variance      | Longitude variance                       |
| location_spread   | Max distance between recent points (m)   |
| hour_of_day       | Current hour (0-23)                      |
| data_points       | Number of recent data points             |
| time_span_minutes | Time span of recent data                 |

### Training
```bash
cd ai-service
python train_model.py
```
Generates simulated data (3000 normal + 500 anomalous) with 5 anomaly types.

### Prediction Response
```json
{
  "is_anomaly": true,
  "anomaly_score": 0.85,
  "severity": "high",
  "reason": "Abnormally high speed: 145.2 km/h",
  "confidence": 0.92,
  "details": {
    "isolation_forest": { "prediction": -1, "anomaly_score": 0.85 },
    "random_forest": { "prediction": 1, "probability": 0.92 }
  }
}
```

---

## ✨ Features

### Tourist App (PWA)
- ✅ JWT Authentication with Digital Tourist ID (DTID)
- ✅ Live GPS tracking with interval-based updates
- ✅ SOS Emergency button with confirmation
- ✅ Safety alerts and notifications
- ✅ Offline mode with location sync
- ✅ Multi-language support (English, Spanish)
- ✅ Profile management with emergency contacts
- ✅ Progressive Web App (installable)

### Authority Dashboard
- ✅ Real-time live map with tourist markers
- ✅ Incident management panel with filters
- ✅ Tourist search and profile viewer
- ✅ Geofence zone management (create/edit/delete)
- ✅ Heatmap of risky zones
- ✅ Analytics charts (trends, hourly, response times)
- ✅ Real-time WebSocket updates
- ✅ Incident status workflow (open → investigating → resolved)

### AI & Safety
- ✅ Isolation Forest anomaly detection
- ✅ Random Forest classification
- ✅ Rule-based detection (inactivity, speed, route deviation, night)  
- ✅ Polygon-based geofencing with breach detection
- ✅ Automatic incident creation
- ✅ Multi-channel alerts (push, SMS mock, WebSocket)

### UI/UX
- ✅ Dark/Light mode with glassmorphism
- ✅ Framer Motion animations
- ✅ Responsive design (mobile-first)
- ✅ Tailwind CSS modern design
- ✅ Premium SaaS-level dashboard

### Security
- ✅ JWT with role-based access (tourist/authority/admin)
- ✅ Input validation (Zod schemas)
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS configuration

---

## 🔑 Demo Credentials

After running `npm run seed` in the backend:

| Role      | Email              | Password    |
|-----------|--------------------|-------------|
| Authority | admin@safety.com   | admin123    |
| Tourist   | john@tourist.com   | tourist123  |
| Tourist   | maria@tourist.com  | tourist123  |
| Tourist   | akira@tourist.com  | tourist123  |
| Tourist   | sophie@tourist.com | tourist123  |
| Tourist   | raj@tourist.com    | tourist123  |

---

## 🔌 WebSocket Events

### Client → Server
| Event             | Data                 | Description          |
|-------------------|----------------------|----------------------|
| `location:update` | `{coordinates, speed}` | Send location      |
| `sos:trigger`     | `{coordinates}`      | Trigger SOS          |

### Server → Client
| Event              | Data                       | Description              |
|--------------------|----------------------------|--------------------------|
| `tourist:location` | `{userId, coordinates, ...}` | Tourist location update |
| `sos:alert`        | `{incident, tourist}`      | SOS emergency alert      |
| `incident:new`     | `{incident}`               | New incident created     |
| `incident:updated` | `{incident}`               | Incident status changed  |
| `alert:geofence`   | `{title, message}`         | Geofence breach alert    |
| `alert:anomaly`    | `{title, message}`         | Anomaly detected alert   |

---

## 📄 License

This project is created for educational purposes (Final Year Project).
