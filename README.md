# 🩸 BloodTrack India Ultra — Backend

Intelligent blood management decision engine built with **Node.js**, **Express**, **MongoDB**, and **Socket.io**.

## Architecture

```
routes → services → algorithms
```

- **Routes**: HTTP interface only. No business logic.
- **Services**: All decision logic. Call algorithms; emit WebSocket events.
- **Algorithms**: Pure functions for matching, scoring, ranking.

## Project Structure

```
/src
  /routes           bloodRequest.js · inventory.js · donor.js · admin.js
  /services         matchingService · routingService · donorService · alertService
  /models           BloodUnit · Donor · Request
  /algorithms       matchingAlgorithm.js (stubs — implement real logic here)
  /sockets          socketManager.js
  /middleware       validate.js · errorHandler.js
  server.js
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env — set MONGODB_URI if needed

# 3. Start MongoDB (requires mongod running locally)
mongod

# 4. Run dev server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/request-blood` | Create blood request (core decision engine) |
| `POST` | `/api/add-blood` | Add a blood unit to inventory |
| `POST` | `/api/register-donor` | Register a new donor |
| `GET`  | `/api/inventory` | List available units (sorted by expiry) |
| `GET`  | `/api/alerts` | Active low-stock + near-expiry alerts |
| `GET`  | `/api/admin/stats` | Request statistics by status and blood type |
| `GET`  | `/api/admin/donors` | All donors with eligibility |
| `GET`  | `/api/predict-demand` | Demand prediction stub |
| `GET`  | `/health` | Health check |

## WebSocket Events

Connect to `ws://localhost:5000` with a Socket.io client.

| Event | Trigger |
|-------|---------|
| `NEW_REQUEST` | A blood request was created |
| `MATCH_FOUND` | Blood unit matched to a request |
| `DONOR_ALERT` | No units available; donors notified |
| `LOW_STOCK` | Blood type inventory below 5 units |
| `EXPIRY_WARNING` | Units expiring within 3 days |

## Decision Logic

```
POST /api/request-blood
  ├─ matchingService.findBestUnit()
  │     ├─ FOUND  → routingService.getRoute()
  │     │          → emit MATCH_FOUND
  │     │          → return { status: "FOUND", bestUnit, route, estimatedTime }
  │     │
  │     └─ NOT FOUND → donorService.findDonors()
  │                   → alertService.triggerEmergencyAlert()
  │                   → emit DONOR_ALERT
  │                   → return { status: "DONOR_ALERT", donors }
```

## Implement Real Algorithms

Edit `src/algorithms/matchingAlgorithm.js` to replace stubs:
- `isCompatible(unitType, requestType)` — blood type compatibility
- `calculateScore(unit, request)` — distance + expiry + quantity scoring
- `rankUnits(units, request)` — sort by score

Service layer imports these without modification.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/bloodtrack` | MongoDB connection string |
| `NODE_ENV` | `development` | Environment |
| `GOOGLE_MAPS_API_KEY` | _(optional)_ | Enable real routing in routingService |
| `REDIS_URL` | _(optional)_ | Enable Redis caching |