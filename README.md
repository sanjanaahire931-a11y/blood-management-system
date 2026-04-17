# 🩸 BloodTrack India Ultra

> **Intelligent Blood Management & Decision Engine** — Built for life-critical speed, designed for Indian healthcare infrastructure.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

---

## 📌 What Is This?

**BloodTrack India Ultra** is a real-time backend system that intelligently matches blood requests to available inventory across hospitals and donors. It combines:

- 🎯 **Smart matching algorithms** — blood type compatibility, expiry scoring, distance ranking
- 🏥 **Hospital blood bank integration** — powered by a live CSV ledger of Indian hospitals
- 📡 **Real-time WebSocket events** — instant alerts for matches, shortages, and emergencies
- 📊 **Demand prediction & alert engine** — proactive low-stock and expiry warnings
- 🚨 **Emergency donor fallback** — automatically finds and alerts nearby registered donors

---

## 🗂 Project Structure

```
blood-management-system/
├── src/
│   ├── algorithms/
│   │   └── matchingAlgorithm.js     # Blood type compatibility + scoring + ranking
│   ├── models/
│   │   ├── BloodUnit.js             # Blood unit inventory schema
│   │   ├── Donor.js                 # Donor profile & eligibility
│   │   ├── Hospital.js              # Hospital + blood bank schema
│   │   └── Request.js               # Blood request schema
│   ├── routes/
│   │   ├── bloodRequest.js          # Request creation & decision flow
│   │   ├── inventory.js             # Blood unit management
│   │   ├── donor.js                 # Donor registration
│   │   ├── hospitals.js             # Hospital search & stock update
│   │   └── admin.js                 # Stats & admin dashboard
│   ├── services/
│   │   ├── matchingService.js       # Orchestrate unit matching
│   │   ├── routingService.js        # Distance & ETA calculation
│   │   ├── donorService.js          # Nearest donor lookup
│   │   └── alertService.js          # Emergency alert dispatch
│   ├── sockets/
│   │   └── socketManager.js         # WebSocket event hub
│   ├── middleware/
│   │   ├── validate.js              # Joi request validation
│   │   └── errorHandler.js          # Global error handler
│   ├── seeders/
│   │   └── seedHospitals.js         # Seed hospitals from CSV
│   └── server.js                    # App entry point
├── data/
│   └── hospitals.csv                # Hospital blood bank ledger (India-wide)
├── blood_matching_engine.js         # Core compatibility & scoring engine
├── logistics_engine.js              # Routing & distance logic
├── alert_decision_engine.py         # Python-based alert prediction
├── demand_prediction_engine.py      # ML demand forecasting stub
├── .env.example                     # Environment variable template
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (or a MongoDB Atlas URI)
- **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/blood-management-system.git
cd blood-management-system

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and optional API keys

# 4. (Optional) Seed hospital data from CSV
npm run seed

# 5. Start the development server
npm run dev
```

Server starts at **`http://localhost:5000`**

---

## 🔌 API Reference

### 🩸 Blood Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/request-blood` | Submit a blood request — triggers full decision engine |
| `GET`  | `/api/alerts` | Active low-stock & near-expiry alerts |

**POST `/api/request-blood` — Example Payload:**
```json
{
  "patientName": "Ravi Kumar",
  "bloodType": "O+",
  "hospitalId": "HOSP-42",
  "urgency": "critical",
  "unitsNeeded": 2
}
```

---

### 🏥 Hospital & Blood Banks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/hospitals` | List all hospitals with blood stock |
| `GET`  | `/api/hospitals/search?name=&bloodType=` | Search by name or blood type |
| `GET`  | `/api/hospitals/:id` | Get single hospital details |
| `POST` | `/api/hospitals/add-unit` | Add blood units to a hospital (live CSV update) |

**GET `/api/hospitals/search` — Query Params:**
| Param | Type | Example |
|-------|------|---------|
| `name` | string | `?name=aiims` |
| `bloodType` | string | `?bloodType=B%2B` |

---

### 🧪 Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/add-blood` | Add a blood unit to inventory |
| `GET`  | `/api/inventory` | List all units sorted by expiry date |

---

### 👤 Donors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register-donor` | Register a new donor |

---

### 🛠 Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/admin/stats` | Request stats by status & blood type |
| `GET`  | `/api/admin/donors` | All donors with eligibility status |
| `GET`  | `/api/predict-demand` | Demand prediction (stub) |
| `GET`  | `/health` | Health check ping |

---

## 📡 Real-Time WebSocket Events

Connect to `ws://localhost:5000` using a **Socket.io** client.

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

socket.on("MATCH_FOUND",   (data) => console.log("Unit matched:", data));
socket.on("DONOR_ALERT",   (data) => console.log("Donors notified:", data));
socket.on("LOW_STOCK",     (data) => console.log("Low stock alert:", data));
socket.on("EXPIRY_WARNING",(data) => console.log("Expiry warning:", data));
socket.on("INVENTORY_UPDATE",(data)=> console.log("Stock updated:", data));
```

| Event | Triggered When |
|-------|----------------|
| `NEW_REQUEST` | A blood request is created |
| `MATCH_FOUND` | A blood unit is matched to a request |
| `DONOR_ALERT` | No units available; nearest donors alerted |
| `LOW_STOCK` | A blood type inventory drops below 5 units |
| `EXPIRY_WARNING` | Units expiring within 3 days detected |
| `INVENTORY_UPDATE` | Hospital stock updated via `/add-unit` |

---

## 🧠 Decision Engine Flow

```
POST /api/request-blood
  │
  ├─ matchingService.findBestUnit(request)
  │     │
  │     ├─ ✅ FOUND
  │     │     ├─ routingService.getRoute(unit, hospital)
  │     │     ├─ emit → MATCH_FOUND
  │     │     └─ Response: { status: "FOUND", bestUnit, route, estimatedTime }
  │     │
  │     └─ ❌ NOT FOUND
  │           ├─ donorService.findDonors(bloodType, location)
  │           ├─ alertService.triggerEmergencyAlert(donors)
  │           ├─ emit → DONOR_ALERT
  │           └─ Response: { status: "DONOR_ALERT", donors }
  │
  └─ Background: alertService checks LOW_STOCK + EXPIRY_WARNING (via node-cron)
```

### Matching Algorithm

The core matching engine (`blood_matching_engine.js`) uses three functions:

| Function | Purpose |
|----------|---------|
| `isCompatible(unitType, requestType)` | ABO + Rh blood group compatibility check |
| `calculateScore(unit, request)` | Weighted score: expiry proximity + distance + quantity |
| `rankUnits(units, request)` | Sort all compatible units by score (best first) |

---

## 🏥 Hospital Database

Hospitals are sourced from `data/hospitals.csv` — a curated ledger of Indian hospitals and blood banks containing:

- State, District, Name, Address
- GPS coordinates (Latitude / Longitude)
- Type (Teaching / District / Private)
- Public/Private classification
- Per blood-type stock quantities (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`)

The hospital routes parse and serve this CSV directly, with live write-back when stock is updated via the API. This ensures cross-user syncing without a full database round-trip.

**Seed to MongoDB:**
```bash
npm run seed
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `5000` | ✅ | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/bloodtrack` | ✅ | MongoDB connection string |
| `NODE_ENV` | `development` | ✅ | Environment mode |
| `GOOGLE_MAPS_API_KEY` | — | Optional | Real routing & ETA via Google Maps |
| `REDIS_URL` | — | Optional | Redis caching for inventory queries |
| `TWILIO_ACCOUNT_SID` | — | Optional | SMS alerts via Twilio |
| `TWILIO_AUTH_TOKEN` | — | Optional | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | Optional | Sender phone number for SMS |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Web Framework | Express.js 4.x |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io 4.x |
| Validation | Joi |
| Scheduling | node-cron |
| Dev Server | Nodemon |
| Prediction Engine | Python 3 (demand_prediction_engine.py) |
| Alert Engine | Python 3 (alert_decision_engine.py) |

---

## 📦 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm start` | Start production server |
| `dev` | `npm run dev` | Start dev server with hot-reload |
| `seed` | `npm run seed` | Seed hospital data from CSV to MongoDB |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

<div align="center">
  <b>BloodTrack India Ultra</b> — Because every second counts. 🩸
</div>