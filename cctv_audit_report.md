# 🔍 Senior Software Audit Report
## Sentinel Gujarat CCTV Central Platform — All 4 Models
**Auditor:** Senior Software Review (15+ Years Experience)  
**Date:** 2026-09-05  
**Codebase:** `c:\Users\dassh\Project\Model-1`  
**Live Portal:** https://cctv.corp8.cloud  

---

## Executive Summary

The platform is a **unified React + FastAPI monolith** covering all four models in a single frontend app (`registry-web`) and a single Python backend (`analytics-service`). Overall, the implementation demonstrates **solid architectural intent and significant feature depth**, but has **critical production gaps** that prevent it from meeting stated deliverable standards in a live government deployment context.

| Model | Completeness | Functional? | Production-Ready? |
|---|---|---|---|
| Model 1 – Registry & GIS | ~75% | ✅ Mostly | ⚠️ Partially |
| Model 2 – Unified Viewer & ANPR | ~70% | ✅ Mostly | ❌ No |
| Model 3 – Federation Middleware | ~80% | ✅ Mostly | ⚠️ Partially |
| Model 4 – Central VMS | ~65% | ⚠️ Mixed | ❌ No |

---

## 🔴 CRITICAL FINDINGS (Blockers)

### 1. Authentication Is Bypassed in the Frontend
**File:** [`AuthContext.tsx`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/context/AuthContext.tsx)

The `AuthContext` **hardcodes a `SUPER_ADMIN` user** — there is zero login/session check or JWT validation in the React app. While the Sentinel portal at `cctv.corp8.cloud` shows a login screen, the main React app skips all authentication entirely.

```tsx
const DEFAULT_USER: UserProfile = {
  email: 'superadmin@gujarat.gov.in',
  role: 'SUPER_ADMIN',   // ALWAYS super admin, no real auth
  badgeNumber: 'GJ-SP-001'
};
```

> [!CAUTION]
> Any user who accesses the deployed React app has full SUPER_ADMIN access. RBAC is completely non-functional.

---

### 2. All Model 1 Data Is In-Memory Mock Data
**Files:** [`apiService.ts`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/services/apiService.ts), [`supabaseClient.ts`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/services/supabaseClient.ts)

Supabase uses placeholder credentials:
```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
```

All camera/department/coverage data is served from `MOCK_CAMERAS`, `MOCK_DEPARTMENTS`, `MOCK_COVERAGE_ZONES`. **No real PostgreSQL/PostGIS database is connected.** Supabase Realtime subscription silently fails at startup (placeholder auth, caught in try/catch).

> [!CAUTION]
> Camera data is lost on every page refresh. No persistent registry exists. PostGIS requirement is unmet.

---

### 3. Backend Not Deployed — All AI/ML Features Fall Back to Simulation
**File:** [`vmsService.ts`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/services/vmsService.ts#L20)

```ts
const API_BASE_URL = 'http://127.0.0.1:8000';  // localhost only!
```

The frontend is deployed at `cctv.corp8.cloud` but the FastAPI backend is only designed to run on `localhost:8000`. All ANPR, vehicle tracking, Model 3 federation, and Model 4 VMS features silently fall back to mock/simulated data when the backend is unreachable.

> [!CAUTION]
> In the live demo environment, no real AI processing is occurring. All "live" data is synthetic.

---

### 4. ANPR Engine Has No Real OCR — Plates Are Deterministic Lookups
**File:** [`anpr_engine.py`](file:///c:/Users/dassh/Project/Model-1/services/analytics-service/anpr_engine.py#L162)

```python
def _resolve_plate(self, district: str, pts_ms: float, seed_offset: int = 0) -> str:
    pool = REGIONAL_PLATES.get(district, REGIONAL_PLATES["Default"])
    index = (int(pts_ms) // 1500 + seed_offset) % len(pool)
    return pool[index]  # Returns hardcoded plate strings!
```

YOLOv8 correctly detects vehicle bounding boxes, but **no OCR library** (EasyOCR, Tesseract, PaddleOCR, etc.) is integrated. The "detected" plate number is simply a rotation through a pre-hardcoded list. Zero actual character recognition happens.

> [!CAUTION]
> All "detected" license plates are synthetic. The ANPR deliverable is not met.

---

### 5. VAHAN/SARTHI/eGujCop/NAFIS Integrations Are Randomly Generated
**File:** [`vmsService.ts`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/services/vmsService.ts#L419)

```ts
public generateVahanRecord(plate: string, blacklisted: boolean): VahanRecord {
  const names = ['Amit Patel', 'Suresh Shah', ...]; // Random names
  return { ownerName: names[Math.floor(Math.random() * names.length)], ... };
}
```

The Integration Hub shows green "CONNECTED" for VAHAN 4.0, eGujCop, NAFIS, SARTHI, CCTNS — but **no real API calls** are made to any government database. All lookup results are random.

---

### 6. GIS Map: Live Camera Coordinates Are Approximated Arithmetically
**File:** [`GisMapPage.tsx`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/pages/gis/GisMapPage.tsx#L203)

```tsx
const latBase = 23.03 + (i % 6) * 0.03 - (i % 3) * 0.02;
const lngBase = 72.58 + (i % 5) * 0.04 - (i % 2) * 0.03;
```

All 30 live Sentinel cameras (including ones in Junagadh, Navsari, Bilimora) are plotted using **arithmetic position approximations** clustered around central Ahmedabad. The real coordinates from `LOCATION_ENRICHMENT` in `vmsService.ts` are available but not used here.

---

## ✅ What Is Working Well

### Model 1 – Central Registry & GIS

| Feature | Status | Notes |
|---|---|---|
| Camera list / inventory | ✅ Working | Functional CRUD with mock data |
| Manual camera onboarding | ✅ Working | Full form with Zod validation |
| Bulk CSV import (PapaParse) | ✅ Working | Schema validation, sample template download |
| GIS map (Leaflet / OpenStreetMap) | ✅ Working | Color-coded status markers |
| Department & status filters | ✅ Working | Real-time filter on map and list |
| Gap zone polygon overlay | ⚠️ Partial | One hardcoded polygon only |
| VDI Gap Analysis (formula) | ✅ Working | Correctly implements VDI = Clamp(1 - actual/required) |
| Camera health & maintenance logs | ✅ Working | Per-camera telemetry view |
| Audit log trail | ✅ Working | Auto-generated on every CRUD action |
| Export functionality | ⚠️ Partial | UI present in Reports page |
| PostGIS spatial database | ❌ Missing | Supabase placeholder, in-memory only |
| Real RBAC enforcement | ❌ Missing | Frontend role switcher only |

**Standout:** The Gap Analysis page's VDI calculation and recalculate-on-demand is one of the strongest implementations in the entire project.

---

### Model 2 – Unified Multi-Feed Viewer & ANPR

| Feature | Status | Notes |
|---|---|---|
| Unified video wall (1×1, 2×2, 3×3, 4×4 grids) | ✅ Working | Full grid layout switcher |
| Live HLS stream playback | ✅ Working | Proxied via FastAPI + AES-128 decrypt |
| RTSP over TCP enforcement | ✅ Working | `OPENCV_FFMPEG_CAPTURE_OPTIONS=rtsp_transport;tcp` |
| PTS-driven timing (not wall-clock) | ✅ Working | `CAP_PROP_POS_MSEC` used, not `time.time()` |
| Exponential backoff reconnect (2s→30s) | ✅ Working | Implemented correctly in `VideoPlayer.tsx` |
| Camera selector ribbon | ✅ Working | Toggle per camera |
| District filter + text search | ✅ Working | Real-time filtering |
| Fullscreen single-camera view | ✅ Working | Modal overlay |
| ANPR detection feed (live poll) | ⚠️ Partial | YOLO detects vehicles; OCR is fake |
| Vehicle trajectory / route reconstruction | ⚠️ Partial | UI works; data is simulated |
| Watchlist hit alerts | ✅ Working | Hardcoded set compared; UI alerts trigger |
| VAHAN lookup | ⚠️ Partial | UI works; returns random records |
| WebRTC/WHEP | ⚠️ Present | URLs generated; no WHEP client in browser |

**Standout:** `VideoPlayer.tsx` is production-quality code. It follows every Sentinel integration guideline: TCP RTSP, HLS.js with backoff, non-fatal decoder warnings handled, no frame-rate dependency.

---

### Model 3 – Federation Middleware

| Feature | Status | Notes |
|---|---|---|
| VMS platform onboarding (form + API) | ✅ Working | POST to `/api/federation/vms-systems/onboard` |
| Multi-vendor adapters | ✅ Working | Hikvision, Genetec, Dahua, Milestone, Hanwha |
| CEP sliding window correlation engine | ✅ Working | Rule evaluation, incident generation |
| Metadata Exchange Bus (in-memory pub/sub) | ✅ Working | Topic routing across VMS platforms |
| Federated camera catalogue | ✅ Working | Normalizes from Sentinel |
| Cross-VMS video wall | ✅ Working | Reuses LiveVideoWallPage |
| Unified incident hub (resolve/ack) | ✅ Working | Full workflow |
| Correlation rule toggle | ✅ Working | Enable/disable per rule |
| Plugin SDK docs + JSON schema | ✅ Working | Full lifecycle hook spec |
| Plugin schema validation endpoint | ✅ Working | POST validates JSON config |
| Federated analytics report | ✅ Working | Per-dept, per-vendor breakdown |
| Kafka / RabbitMQ | ❌ Missing | In-memory bus used instead |
| Kong / NGINX API Gateway | ❌ Missing | FastAPI router serves directly |

**Standout:** Model 3 is the most architecturally complete model. The CEP engine with a sliding window is genuinely functional.

---

### Model 4 – Consolidated Central VMS

| Feature | Status | Notes |
|---|---|---|
| Central VMS KPI landing page | ✅ Working | Pulls from Sentinel catalogue |
| Live feed ingestion overview | ✅ Working | 30 real Sentinel cameras |
| Timeline playback | ⚠️ Partial | UI and segment fetch exist; scrubber is simulated |
| AI Analytics Suite (crowd, anomaly) | ✅ Working | Real simulated events + resolve workflow |
| ANPR sighting feed + VAHAN lookup | ✅ Working | UI complete; data is simulated |
| Multi-location vehicle tracking (Leaflet) | ✅ Working | Route timeline per plate |
| Alerts hub (priority sort, acknowledge) | ✅ Working | Full alert lifecycle |
| Integration hub (gov databases) | ⚠️ Partial | Shows CONNECTED; all data is mocked |
| Tiered storage calculator (HOT/WARM/COLD) | ✅ Working | Tech specs + capacity math |
| Scalability load lab (80k model) | ✅ Working | Synthetic load test runner |
| Disaster recovery (3-node failover) | ✅ Working | SDC → DRS → Edge drill simulation |
| Security architecture (Zero-Trust, RBAC) | ✅ Working | Architecture docs displayed |
| Kubernetes / Ceph orchestration | ❌ Missing | Documented, not implemented |
| GPU-based inference pipeline | ⚠️ Partial | YOLOv8 CPU-only in worker |
| Kafka stream ingestion | ❌ Missing | Not implemented |
| PostgreSQL / TimescaleDB backend | ❌ Missing | SQLite used (`sentinel_analytics.db`) |

---

## ⚠️ Architecture & Design Issues

### Issue A — SQLite Instead of PostgreSQL
**File:** [`database.py`](file:///c:/Users/dassh/Project/Model-1/services/analytics-service/database.py)

`sentinel_analytics.db` is SQLite. The requirement specifies **PostgreSQL + PostGIS**. SQLite cannot handle concurrent writes at surveillance scale, has no spatial query support, and is not suitable for production government infrastructure.

---

### Issue B — Single-Threaded Serial Camera Worker
**File:** [`worker.py`](file:///c:/Users/dassh/Project/Model-1/services/analytics-service/worker.py)

The ingestion worker sweeps serially across all cameras with a `0.05s` sleep between each. For 80,000 cameras, one sweep cycle would take **66+ minutes**. The spec requires Kafka + GPU-based parallel analytics. No parallelism is implemented.

---

### Issue C — AES-128 Decryption Uses Hardcoded Zero IV (Bug)
**File:** [`worker.py`](file:///c:/Users/dassh/Project/Model-1/services/analytics-service/worker.py#L63)

```python
iv = b'\x00' * 16  # Zero IV — WRONG for HLS AES-128-CBC!
cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
```

Per RFC 8216, AES-128-CBC HLS encryption uses the **segment sequence number** (big-endian 16-byte) as the IV, not a zero IV. This will produce **corrupt decryption** for every segment with a non-zero sequence number.

> [!WARNING]
> This bug silently produces garbled frame data, causing YOLO to detect nothing and the fallback simulation path to activate — masking the bug entirely.

---

### Issue D — No Route Guards in Frontend
**File:** [`routes/index.tsx`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/routes/index.tsx)

The `/login` page exists but **no `<PrivateRoute>` component or auth check** wraps any protected route. Navigating directly to `/vms`, `/cameras`, etc. works without any authentication.

---

### Issue E — CORS Wildcard + Credentials in Production (Spec Violation)
**File:** [`main.py`](file:///c:/Users/dassh/Project/Model-1/services/analytics-service/main.py#L40)

```python
allow_origins=["*"],
allow_credentials=True,
```

Browsers **reject** `Access-Control-Allow-Credentials: true` when combined with `Access-Control-Allow-Origin: *` (CORS spec). This combination is also a government security violation.

---

### Issue F — Supabase Real-Time Silently Fails
**File:** [`apiService.ts`](file:///c:/Users/dassh/Project/Model-1/apps/registry-web/src/services/apiService.ts#L54)

The Realtime subscription fires at startup with placeholder credentials. It fails at the WebSocket level, the `catch` block logs a warning, and the app continues with stale in-memory data — no fallback polling mechanism replaces it.

---

## 📋 Deliverables Checklist

### Model 1
| Deliverable | Status |
|---|---|
| Working registry portal with GIS map | ✅ Done |
| Bulk and manual camera onboarding demo | ✅ Done |
| Sample onboarded camera-metadata dataset | ✅ Done (mock) |
| Registry API documentation | ❌ Missing — no Swagger docs for registry endpoints |
| Sample gap-analysis report | ⚠️ Partial — interactive UI only, no exportable PDF report |

### Model 2
| Deliverable | Status |
|---|---|
| Unified viewer connected to 2+ different systems | ✅ Done |
| ANPR demonstration on live / recorded feeds | ⚠️ Partial — YOLO detection yes, plate OCR no |
| Searchable metadata dashboard | ✅ Done |
| Architecture note showing departmental systems unaffected | ✅ Done |

### Model 3
| Deliverable | Status |
|---|---|
| Working middleware demo federating 2+ systems | ✅ Done |
| Unified event-correlation dashboard | ✅ Done |
| Adapter / plugin architecture documentation | ✅ Done |
| Sample federated analytics report | ✅ Done |

### Model 4
| Deliverable | Status |
|---|---|
| Working centralised VMS prototype | ✅ Done |
| ANPR and multi-location vehicle-tracking demo | ⚠️ Partial — routes work, plates are fake |
| Scalability and load-test report for ~80k cameras | ✅ Done (synthetic) |
| Disaster-recovery and redundancy design | ✅ Done |
| Security architecture document | ✅ Done |

---

## 🛠️ Prioritized Recommendations

### P0 — Critical (Fix Before Any Demo/Submission)
1. **Enforce authentication** — Add `<PrivateRoute>` guards in React, connect to real Supabase Auth, remove the hardcoded `SUPER_ADMIN` default user.
2. **Fix CORS** — Replace `allow_origins=["*"]` with `allow_origins=["https://cctv.corp8.cloud"]`.
3. **Fix AES-128 IV bug** — Extract the segment sequence number from the `#EXT-X-KEY` tag and use it as the IV in `worker.py`.
4. **Deploy backend** — Host FastAPI on a public server; update `API_BASE_URL` in both `vmsService.ts` and `federationService.ts`.

### P1 — High Priority
5. **Connect real database** — Provision Supabase project, set env vars, migrate mock data to real PostgreSQL tables.
6. **Real ANPR OCR** — Crop the detected bounding box, pass to EasyOCR or PaddleOCR for actual plate text extraction.
7. **Fix GIS coordinates** — Use the `LOCATION_ENRICHMENT` lat/lng (already in `vmsService.ts`) to plot Sentinel cameras accurately on the GIS map.

### P2 — Medium Priority
8. **PostgreSQL migration** — Switch `database.py` and `federation_db.py` to PostgreSQL with asyncpg.
9. **Gap Analysis PDF export** — Integrate jsPDF to generate a downloadable gap-analysis report.
10. **Registry API docs** — Add FastAPI route tags and OpenAPI descriptions for Model 1 `/api/cameras` endpoints.

### P3 — Enhancements
11. **Kafka bus** — Replace in-memory `metadata_bus.py` with a real Kafka producer/consumer.
12. **WebRTC WHEP client** — Implement a browser-side WHEP fetch → RTCPeerConnection in `VideoPlayer.tsx`.
13. **Async camera worker** — Refactor `worker.py` to use `asyncio.gather()` with thread pool for parallel camera processing.
14. **Real VAHAN API** — Wire up MoRTH VAHAN 4.0 REST calls when API credentials are available.

---

## 📊 Overall Scoring

| Dimension | Score | Verdict |
|---|---|---|
| Feature Coverage | 7.5 / 10 | All key features present, some are shallow |
| Code Quality | 7.0 / 10 | Well-structured, good TypeScript typing |
| Security | 3.0 / 10 | No auth enforcement, CORS wildcard, hardcoded creds |
| Data Integrity | 4.0 / 10 | All data in-memory, no real DB connected |
| AI / ML Accuracy | 4.0 / 10 | YOLO detection works; OCR and gov-DB lookups are fake |
| Architecture | 6.0 / 10 | Good design intent, not fully realized |
| Production Readiness | 3.0 / 10 | Backend not deployed, auth bypassed, SQLite |
| UI / UX Quality | 8.0 / 10 | Professional, responsive, well-animated |
| **Overall** | **5.3 / 10** | **Promising demo-grade prototype — not production-ready** |

---

*Audit based on full static codebase analysis of `c:\Users\dassh\Project\Model-1` and live HTTP inspection of `https://cctv.corp8.cloud`*
