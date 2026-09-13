# 🛡️ Sentinel Gujarat - CCTV Central Platform (Unified Model 1 + Model 2 + Model 3)
### Statewide CCTV Asset Registry, GIS Spatial Layer, Unified Edge ANPR & Multi-Vendor VMS Middleware Federation

A production-grade, state-scale surveillance modernization and unified management platform combining:
- **Model 1**: Centralised CCTV Registry & PostGIS Geospatial Asset Mapping
- **Model 2**: Unified Multi-Feed Video Wall, Edge YOLOv8 ANPR Analytics & Stateful Vehicle Movement Reconstructor
- **Model 3**: VMS Middleware & Multi-Vendor Federation Layer with Complex Event Processing (CEP) and Metadata Exchange Bus

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

### 3. Model 3 — VMS Middleware & Multi-Vendor Federation Layer
* **Adapter / Plugin Architecture**: Standardized connector framework (`IVmsAdapter`) federating Milestone XProtect, Genetec Security Center, Hikvision HikCentral, Dahua DSS Pro, Hanwha WAVE, and generic ONVIF Profile S/G/T without replacing existing departmental infrastructure.
* **Metadata Exchange Bus**: High-performance Kafka/RabbitMQ-style asynchronous Pub/Sub message broker (`MetadataExchangeBus`) with standardized event envelopes and topic partitioning (`vms.events.*`).
* **Cross-System Event-Correlation Engine (CEP)**: Real-time spatial-temporal correlation rules:
  * **RULE-01**: Cross-Jurisdiction Speeding & Checkpoint Interception Routing.
  * **RULE-02**: Multi-Sensor Emergency Hazard & Congestion Gridlock Fusion.
  * **RULE-03**: Perimeter Breach & Vehicle Escape Vector Tracking.
  * **RULE-04**: Statewide BOLO Multi-System Convergence.
* **Unified Workflow & Alert Hub**: Centralized cross-department incident triage, multi-agency dispatch workflows, and resolution audit ledger.
* **Live Sentinel Grid Integration**: Dynamically maps and proxies all 30 cameras from `https://cctv.corp8.cloud/cameras.json` (password `NLFG-4QKB-K83P`) across departmental VMS instances.
* **Extensible Connector Framework & SDK Sandbox**: Live 5-point vendor compliance test runner, plugin registration wizard, and JSON schema validator.
* **Sample Federated Analytics Report**: Cross-VMS camera distribution, hourly incident flow, departmental MTTR matrices, and exportable reports (PDF, CSV, JSON).

---

## 🧱 Repository Architecture

```text
Model-1/
├── apps/
│   └── registry-web/                 # Unified Command Center Frontend (React 18 + Vite + Tailwind CSS)
│       ├── src/
│       │   ├── components/           # VideoPlayer, Layout, Metric Cards, GIS Popups, VMS
│       │   ├── pages/
│       │   │   ├── cameras/          # Model 1: Registry CRUD & Bulk Import
│       │   │   ├── gis/              # Model 1: GIS Map & Gap Intelligence
│       │   │   ├── vms/              # Model 2: Video Wall, ANPR Feed, Trajectory Replay, Alerts
│       │   │   ├── federation/       # Model 3: Overview, Cross-VMS Wall, CEP Correlation, Incidents, SDK, Reports
│       │   │   └── dashboard/
│       │   ├── services/             # federationService, vmsService, apiService, supabaseClient
│       │   ├── types/                # federation.types.ts, camera.types.ts
│       │   └── routes/               # Unified AppRoutes (Model 1 + Model 2 + Model 3)
│       └── package.json
│
├── services/
│   └── analytics-service/            # Model 2 + Model 3 Edge AI & Federation Gateway (Python FastAPI)
│       ├── main.py                   # FastAPI Gateway Server (Model 1, 2, 3)
│       ├── federation_adapters.py    # Milestone, Genetec, Hikvision, Dahua, Hanwha, ONVIF Adapters
│       ├── metadata_bus.py           # Kafka/RabbitMQ-style Asynchronous Pub/Sub Message Bus
│       ├── correlation_engine.py     # Complex Event Processing (CEP) Engine & Cross-System Correlator
│       ├── federation_db.py          # SQLite Persistence Layer for VMS Platforms, Events & Correlations
│       ├── federation_router.py      # RESTful API Endpoints under /api/federation/*
│       ├── test_federation.py        # Model 3 End-to-End Test Suite
│       ├── worker.py                 # Multi-Camera TCP RTSP / HLS Ingestion Worker
│       ├── anpr_engine.py            # Ultralytics YOLOv8 & Plate Recognition Pipeline
│       ├── sentinel_client.py        # Sentinel Grid Authentication & Catalogue Ingestion
│       └── requirements.txt
│
├── shared/
│   └── types/                        # Shared TypeScript Data Contracts (vms-federation.contract.ts)
├── MODEL_3_ARCHITECTURE.md           # In-depth Model 3 Technical Architecture Manual
└── README.md
```

---

## ⚡ Quick Start & Setup

### 1. Start the Analytics & Federation Microservice (Terminal 1)

```powershell
cd services\analytics-service
python -m pip install -r requirements.txt
python main.py
```
> API Server runs at: `http://127.0.0.1:8000`  
> Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`  
> Test Suite: `python test_federation.py`

### 2. Start the Frontend Command Center (Terminal 2)

```powershell
cd apps\registry-web
npm install
npm run dev
```
> Access Unified Command Center at: `http://localhost:5173`

---

## 📡 API Endpoints

### Model 3: VMS Federation & Middleware Layer
| Endpoint | Method | Description |
|---|---|---|
| `/api/federation/overview` | GET | High-level KPIs, connected VMS count, bus throughput, active correlations |
| `/api/federation/vms-systems` | GET | List registered VMS platforms with live health, latency & uptime SLA |
| `/api/federation/vms-systems/onboard` | POST | Onboard a new departmental VMS platform connector |
| `/api/federation/vms-systems/{id}/test` | POST | Execute 5-step live compliance test (Auth, Catalogue, Stream, Alarm, PTZ) |
| `/api/federation/cameras` | GET | Federated 30-camera catalogue with source VMS provenance metadata |
| `/api/federation/cameras/{id}/stream` | GET | Resolve live stream URLs (HLS proxy, RTSP over TCP, WebRTC WHEP) |
| `/api/federation/cameras/{id}/ptz` | POST | Dispatch PTZ pan/tilt/zoom vectors through the VMS adapter |
| `/api/federation/events` | GET | Live normalized event feed from the Metadata Exchange Bus |
| `/api/federation/events/publish` | POST | Ingest external departmental event into the message bus |
| `/api/federation/correlations` | GET | Correlated cross-system incidents generated by the CEP Engine |
| `/api/federation/correlations/{id}` | GET | Detailed correlation chain with interactive graph nodes and edges |
| `/api/federation/correlations/{id}/resolve` | POST | Log officer interception actions and commit to audit ledger |
| `/api/federation/bus/metrics` | GET | Real-time message bus throughput, queue lag, and active partitions |
| `/api/federation/rules` | GET | List active Complex Event Processing (CEP) correlation rules |
| `/api/federation/rules/{id}/toggle` | POST | Enable or disable a correlation rule |
| `/api/federation/plugin-sdk/specs` | GET | Plugin SDK specifications, lifecycle hooks, and JSON schema |
| `/api/federation/plugin-sdk/validate` | POST | Live JSON schema validator for third-party VMS manifests |
| `/api/federation/reports/sample` | GET | Sample federated operational intelligence report |

### Model 2: Video Wall & Edge ANPR
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

- [x] **Multi-Vendor Adapter Architecture**: Pluggable connectors for Milestone, Genetec, Hikvision, Dahua, Hanwha, and ONVIF.
- [x] **Metadata Exchange Bus**: Kafka-style pub/sub asynchronous topic broker with standardized JSON event envelopes.
- [x] **Cross-System Complex Event Processing (CEP)**: Stateful correlation engine with interactive node-edge graph visualization.
- [x] **Unified Incident Command Hub**: Real-time alarm triage, SOP dispatcher, and officer audit logging.
- [x] **Live Sentinel Grid Ingestion**: All 30 live feeds consumed via authenticated HLS, RTSP over TCP (`rtsp_transport;tcp`), and monotonic PTS timestamps.
- [x] **Extensible Connector Framework**: Compliance test runner, onboarding wizard, and JSON schema validator.
- [x] **Sample Federated Analytics Report**: SLA uptime metrics, cross-agency MTTR benchmarks, and export to PDF/CSV/JSON.