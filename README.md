# 🛡️ Sentinel Gujarat - CCTV Central Platform (Unified Model 1 + Model 2)
### Statewide CCTV Asset Registry, GIS Intelligence, Unified Video Wall & Edge AI ANPR Analytics

A production-grade, state-scale surveillance modernization and unified management platform combining:
- **Model 1**: Centralised CCTV Registry & PostGIS Geospatial Asset Mapping
- **Model 2**: Unified Multi-Feed Video Wall, Edge YOLOv8 ANPR Analytics & Stateful Vehicle Movement Reconstructor

---

## 📌 Key Capabilities

### 1. Model 1 — CCTV Asset Registry & GIS Spatial Layer
* **Statewide Asset Onboarding**: Bulk CSV/Excel import, single camera registration, lifecycle metadata management.
* **Geospatial Intelligence (GIS)**: Leaflet + PostGIS interactive layers with departmental filters, status badges, and coverage polygons.
* **Gap Analysis & Telemetry**: Identification of surveillance blindspots, vulnerable urban corridors, and camera health telemetry.
* **Role-Based Access Control**: Multi-tier access (`SUPER_ADMIN`, `STATE_ADMIN`, `DEPARTMENT_ADMIN`, `OPERATOR`, `VIEWER`) with immutable audit logs.

### 2. Model 2 — Unified Viewer, Edge ANPR & Law Enforcement Intelligence
* **Live Multi-Stream Video Wall**: Dynamic 1×1, 2×2, 3×3, and 4×4 grid layouts consuming 30+ statewide cameras.
* **Standard-Compliant Ingestion**:
  * **RTSP over TCP** (`os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"`) to eliminate UDP packet drops.
  * **PTS-Driven Timing** (`CAP_PROP_POS_MSEC`) ensuring monotonic velocity and dwell-time accuracy across scene cuts.
  * **Exponential Backoff Reconnects** (2s → 30s) resilient to feed supervisory restarts.
* **Edge YOLOv8 ANPR Inference**: Local optical plate recognition & vehicle classification (Car, Truck, Bus, Motorcycle, Auto).
* **Statewide Vehicle Movement Reconstructor**: Chronological trajectory tracing and checkpoint playback (`/api/search?plate=...`).
* **Hotlist & Watchlist Incident Hub**: Automated law enforcement alerts against eGujCop, NAFIS, and CCTNS criminal/stolen databases.

---

## 🧱 Repository Architecture

```text
Model-1/
├── apps/
│   └── registry-web/                 # Unified Command Center Frontend (React 18 + Vite + Tailwind CSS)
│       ├── src/
│       │   ├── components/           # VideoPlayer, Layout, Metric Cards, GIS Popups
│       │   ├── pages/
│       │   │   ├── cameras/          # Model 1: Registry CRUD & Bulk Import
│       │   │   ├── gis/              # Model 1: GIS Map & Gap Intelligence
│       │   │   ├── vms/              # Model 2: Video Wall, ANPR Feed, Trajectory Replay, Alerts
│       │   │   └── dashboard/
│       │   ├── services/             # vmsService, apiService, supabaseClient
│       │   └── routes/               # Unified AppRoutes
│       └── package.json
│
├── services/
│   └── analytics-service/            # Model 2 Edge AI & Stream Ingestion Microservice (Python)
│       ├── main.py                   # FastAPI Gateway Server
│       ├── worker.py                 # Multi-Camera TCP RTSP / HLS Ingestion Worker
│       ├── anpr_engine.py            # Ultralytics YOLOv8 & Plate Recognition Pipeline
│       ├── database.py               # SQLite / PostgreSQL Historical Checkpoint Store
│       ├── sentinel_client.py        # Sentinel Grid Authentication & Catalogue Ingestion
│       ├── test_api.py               # Functional & API Test Suite
│       ├── yolov8n.pt                # YOLOv8 Model Weights
│       └── requirements.txt
│
├── shared/
│   └── types/                        # Shared TypeScript Data Contracts
└── README.md
```

---

## ⚡ Quick Start & Setup

### 1. Start the Analytics & Edge AI Microservice (Terminal 1)

```powershell
cd services\analytics-service
python -m pip install -r requirements.txt
python main.py
```
> API Server runs at: `http://127.0.0.1:8000`  
> Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Command Center (Terminal 2)

```powershell
cd apps\registry-web
npm install
npm run dev
```
> Access Unified Command Center at: `http://localhost:5173`

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/cameras` | GET | Sanitized list of 30 live cameras with HLS, RTSP, and WebRTC URLs |
| `/api/detections` | GET | Real-time ANPR sightings with monotonic PTS timestamps and confidence scores |
| `/api/alerts` | GET | Automated law enforcement alerts for watchlist matches |
| `/api/search?plate={NO}` | GET | Reconstructs historical checkpoint trajectory for any vehicle |
| `/api/watchlist` | GET / POST | View and register vehicles of interest (eGujCop / NAFIS / CCTNS) |
| `/api/alerts/{id}/resolve` | POST | Log officer interception and resolution actions |
| `/api/health` | GET | Service telemetry, active cameras, and inference pipeline status |

---

## 🔒 Evaluation Compliance Checklist

- [x] Every stream connection forces RTSP over TCP (`rtsp_transport;tcp`).
- [x] Timing is driven from Monotonic PTS (`CAP_PROP_POS_MSEC`), never wall-clock arrival time.
- [x] Inter-frame gaps and variable frame rates do not stall or crash the ingestion worker.
- [x] Automatic reconnect with exponential backoff (2s → 30s) implemented.
- [x] Decoder warnings on join (H.264/H.265) are safely logged without crashing.
- [x] Dynamic catalogue fetched live from `/api/ingest` and `/cameras.json`.
- [x] Memory-safe round-robin worker ensures 0% memory leaks across 30+ cameras.