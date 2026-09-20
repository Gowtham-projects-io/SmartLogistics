# SmartLogistics 🚛

> AI-powered shared truck capacity and route-matching platform.
> Match unused truck capacity with shipments along existing routes — cutting costs by up to 75%.

---

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

> **Offline mode**: The frontend works without the backend — it falls back to local mock data automatically.

---

## Environment Setup

```bash
cp .env.example .env
# Edit .env with your Firebase credentials (optional)
```

The app runs fully without any environment variables using in-memory mock data.

---

## Firebase Setup (Optional)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore in Native mode
3. Download the service account key → save as `backend/firebase-credentials.json`
4. Set `FIREBASE_PROJECT_ID` and `FIREBASE_CREDENTIALS` in `.env`
5. Add frontend config values `VITE_FIREBASE_*` to `.env`

**Collections used:**
- `routes` — truck route documents
- `requests` — shipment request documents
- `matches` — match result documents

---

## Running the Full Demo

1. Start both servers (frontend + backend)
2. Open http://localhost:5173
3. Click **"Start Demo"** in the top navigation
4. Watch the 7-step automated demo flow

Or navigate manually:
- **Smart Match** page → Enter Chennai → Erode, 2,000 kg, Textiles → Click "Find Matching Trucks"
- **Pricing** page → See animated ₹2,300 price vs ₹9,500 dedicated truck

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/health` | Health check |
| GET    | `/routes` | All active truck routes |
| GET    | `/routes/{truck_id}` | Single truck route |
| POST   | `/requests` | Create shipment request |
| GET    | `/requests` | All shipment requests |
| POST   | `/matches/find` | Find matching trucks |
| GET    | `/matches` | All saved matches |
| POST   | `/pricing/calculate` | Calculate shared price |
| POST   | `/cargo/check` | Check cargo compatibility |
| POST   | `/ai/query` | Query AI assistant |
| GET    | `/analytics` | Dashboard analytics |

### Example: Find Matches

```bash
curl -X POST http://localhost:8000/matches/find \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"lat": 13.0827, "lng": 80.2707},
    "pickupName": "Chennai",
    "drop": {"lat": 11.3410, "lng": 77.7172},
    "dropName": "Erode",
    "weightKg": 2000,
    "cargoType": "textiles"
  }'
```

---

## Route Matching Algorithm

**File:** `backend/algorithms/route_matching.py`

A shipment matches a truck route when:
1. Pickup is within **5 km** of the truck's polyline
2. Drop is within **5 km** of the truck's polyline
3. Pickup appears **before** the drop along the route (sequence check)
4. Available truck capacity ≥ shipment weight

**Match Score** (weighted):

| Factor | Weight |
|--------|--------|
| Route Compatibility | 40% |
| Available Capacity | 25% |
| Detour Distance | 20% |
| Cargo Compatibility | 10% |
| Departure Time | 5% |

**Key functions:**
- `haversine(lat1, lng1, lat2, lng2)` — Great-circle distance in km
- `min_distance_to_polyline(lat, lng, polyline)` — Perpendicular distance to route
- `find_matching_trucks(trucks, pickup, drop, weight, cargo)` — Main matching function

---

## Pricing Algorithm

**File:** `backend/algorithms/pricing.py`

```
volumeShare  = baseTripCost × (shipmentWeightKg / truckCapacityKg)
detourCost   = detourDistanceKm × fuelCostPerKm (default ₹35/km)
finalPrice   = volumeShare + detourCost + platformFee (default ₹100)

dedicatedTruckCost = baseTripCost
estimatedSavings   = dedicatedTruckCost − finalPrice
```

**Safeguards:**
- `finalPrice >= ₹500` (minimum price floor)
- `finalPrice <= baseTripCost × 0.90` (never charge more than 90% of dedicated cost)

**Demo example:**
```
baseTripCost      = ₹9,500
shipmentWeight    = 2,000 kg / 10,000 kg = 20%
volumeShare       = ₹9,500 × 0.20 = ₹1,900
detourCost        = 8.2 km × ₹35 = ₹287
platformFee       = ₹100
finalPrice        = ₹2,287 ≈ ₹2,300
estimatedSavings  = ₹9,500 − ₹2,300 = ₹7,200 (75.8%)
```

---

## Cargo Compatibility

**File:** `backend/algorithms/cargo_compatibility.py`

Rule-based matrix — no ML. Examples:

| Truck Cargo | Shipment Cargo | Result |
|-------------|----------------|--------|
| General | Textiles | ✅ Compatible |
| Textiles | Electronics | ✅ Compatible |
| Food | Chemicals | ❌ Rejected |
| Fragile | Heavy Machinery | ❌ Rejected |
| Hazardous | Any | ❌ Rejected |

---

## Project Structure

```
smart-logistics/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       — Dark nav sidebar
│   │   │   ├── TopNav.jsx        — Header with Start Demo
│   │   │   ├── StatCard.jsx      — Animated KPI card
│   │   │   ├── MapView.jsx       — Leaflet map with route highlight
│   │   │   ├── PricingCard.jsx   — Animated pricing breakdown
│   │   │   ├── AIAssistant.jsx   — Chat panel
│   │   │   └── DemoModal.jsx     — 7-step guided demo
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     — KPI + charts
│   │   │   ├── RouteMatching.jsx — Scene 1: map + match
│   │   │   ├── Pricing.jsx       — Scene 2: animated price
│   │   │   ├── LiveRoutes.jsx    — All routes on map
│   │   │   ├── ShipmentRequests.jsx
│   │   │   ├── SmartMatches.jsx
│   │   │   └── Analytics.jsx
│   │   ├── services/
│   │   │   ├── api.js            — Axios + mock fallback
│   │   │   └── firebase.js       — Lazy Firebase client
│   │   ├── utils/
│   │   │   ├── routeMatching.js  — Client-side matching
│   │   │   ├── pricing.js        — Client-side pricing
│   │   │   └── cargoCompatibility.js
│   │   └── data/
│   │       └── mockData.js       — Local fallback data
│   └── package.json
├── backend/
│   ├── main.py                   — FastAPI app
│   ├── demo_data.py              — 4 Tamil Nadu routes
│   ├── requirements.txt
│   ├── models/schemas.py         — Pydantic models
│   ├── algorithms/
│   │   ├── distance.py           — Haversine + polyline math
│   │   ├── route_matching.py     — Corridor match algorithm
│   │   ├── pricing.py            — Shared price formula
│   │   ├── cargo_compatibility.py— Rules engine
│   │   └── ai_assistant.py       — Mock AI (LLM-ready)
│   └── services/firebase_service.py — Firestore + in-memory fallback
├── .env.example
└── README.md
```

---

## Future Improvements

1. **Real OSRM routing** — Replace fixed polylines with OSRM API calls for turn-by-turn accuracy
2. **Live GPS tracking** — WebSocket updates for real truck positions
3. **Firebase Auth** — Multi-tenant with shipper + driver roles
4. **LLM Integration** — Replace mock AI with Gemini/GPT for natural language queries
5. **Driver app** — Mobile app for drivers to accept/reject matches
6. **Dynamic pricing** — Surge pricing based on demand and available capacity
7. **Multi-city network** — Expand beyond Tamil Nadu
8. **CO₂ tracking** — Real emissions savings calculator
9. **Payment integration** — UPI/Razorpay for seamless transactions
10. **SMS/WhatsApp alerts** — Twilio integration for match notifications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Maps | Leaflet + react-leaflet + OpenStreetMap/CARTO |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python 3.13, FastAPI |
| Database | Firebase Firestore (with in-memory fallback) |
| HTTP Client | Axios |

---

*Built for a 24–48 hour hackathon. 🏆*
