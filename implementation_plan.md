# Model 4 — Central VMS: Full Functional Prototype

## Overview

Building a fully functional **Central Video Management System (VMS)** integrated into the existing Model 1 React/Vite monorepo at `apps/registry-web`. Model 4 transforms the static registry into a **live, statewide surveillance operations platform** — consuming real camera streams from `live.corp8.cloud`, performing browser-side AI analytics, tracking vehicles across locations, and providing centralised multi-department monitoring.

The Sentinel sandbox provides **30 live cameras** (HLS/WebRTC/RTSP) from Gujarat locations. We integrate these directly.

---

## Key Deliverables

| # | Deliverable | Status |
|---|---|---|
| 1 | Live multi-feed video wall (up to 16 concurrent streams via HLS/WebRTC) | NEW |
| 2 | ANPR (Automatic Number Plate Recognition) — browser-side OCR simulation with real frame extraction | NEW |
| 3 | Multi-location vehicle tracking & route reconstruction | NEW |
| 4 | Crowd / vehicle counting analytics per feed | NEW |
| 5 | Anomaly & event detection engine | NEW |
| 6 | Tiered storage indicator (Hot/Warm/Cold) | NEW |
| 7 | Integration hub — VAHAN, SARTHI, eGujCop, AFIS, NAFIS stubs | NEW |
| 8 | RBAC-controlled access with operator roles | EXTEND |
| 9 | Disaster recovery status dashboard | NEW |
| 10 | Scalability report (simulated 80K camera load) | NEW |

---

## Architecture Decisions

- **Video Playback**: HLS via `<video>` elements + native HLS.js for broader browser support. WebRTC (WHEP) as fallback. RTSP consumed server-side (simulated here).
- **AI Analytics**: Browser-side canvas pixel analysis for motion detection, `@vladmandic/face-api` or pure heuristic detection for crowd counting — no GPU required in browser prototype. Simulated ANPR via OCR overlay on feed frames.
- **State Management**: Extend existing `apiService.ts` singleton with a new `vmsService.ts` for stream management.
- **New Routes**: Add `/vms`, `/vms/live`, `/vms/anpr`, `/vms/tracking`, `/vms/analytics`, `/vms/integrations`, `/vms/storage`, `/vms/security` under the existing `AppLayout`.

---

## Proposed Changes

### 1. New VMS Service Layer

#### [NEW] `src/services/vmsService.ts`
- Fetches live camera catalogue from `/api/ingest` on `live.corp8.cloud`
- Manages stream connections (open/close/reconnect with backoff)
- Simulated ANPR event engine (generates plate detections on feeds)
- Vehicle tracking state machine across multiple cameras
- Anomaly event log (crowd surge, intrusion, fire/smoke)

#### [NEW] `src/services/hlsService.ts`
- HLS.js integration helper
- Handles mixed H.264/H.265 streams
- PTS-based timing (not wall clock)
- Auto-reconnect with exponential backoff

---

### 2. New Pages

#### [NEW] `src/pages/vms/VmsLandingPage.tsx`
- Model 4 overview with KPIs: live stream count, active AI engines, ANPR hits today, vehicles tracked

#### [NEW] `src/pages/vms/LiveVideoWallPage.tsx`
- Grid layout (1x1, 2x2, 3x3, 4x4 configurable)
- Each cell: HLS `<video>` player with controls, camera metadata overlay
- AI overlay badges: ANPR active, crowd density bar, motion indicator
- Click to fullscreen any feed
- Camera selector from Sentinel catalogue

#### [NEW] `src/pages/vms/AnprEnginePage.tsx`
- Live plate detection feed (simulated engine scanning video frames)
- Watchlist match alerts (real-time)
- VAHAN/SARTHI lookup stub
- Detection history table with confidence, timestamp, camera

#### [NEW] `src/pages/vms/VehicleTrackingPage.tsx`
- Statewide route reconstruction map (Leaflet)
- Vehicle appears at multiple cameras with timestamps
- Timeline view of a vehicle's journey across Gujarat
- Route replay animation

#### [NEW] `src/pages/vms/AnalyticsEnginePage.tsx`
- Per-camera analytics dashboard
- Crowd density gauge (live)
- Vehicle count bar chart (per hour)
- Anomaly event timeline
- Heatmap concept overlay

#### [NEW] `src/pages/vms/IntegrationHubPage.tsx`
- Integration status cards: VAHAN ✓, SARTHI ✓, eGujCop ✓, AFIS ✓, NAFIS ✓
- Live lookup forms (plate → VAHAN result, face → AFIS/NAFIS result)
- API health indicators

#### [NEW] `src/pages/vms/StorageTierPage.tsx`
- Hot/Warm/Cold storage tiers with capacity gauges
- Retention policy matrix per department
- Storage usage simulation (80K cameras @ various bitrates)

#### [NEW] `src/pages/vms/SecurityArchitecturePage.tsx`
- RBAC matrix visualization
- Network segmentation diagram
- Encryption status indicators
- DR/redundancy status

---

### 3. Modified Files

#### [MODIFY] `src/routes/index.tsx`
- Add VMS routes nested under `/vms`

#### [MODIFY] `src/components/layout/AppLayout.tsx`
- Add "Central VMS" nav section with sub-items

#### [MODIFY] `src/services/apiService.ts`
- Add `getSentinelCameras()` method that fetches from live API

#### [MODIFY] `src/types/camera.types.ts`
- Add `SentinelCamera`, `AnprDetection`, `VehicleTrack`, `AiAnalyticsEvent` types

---

### 4. New Shared Components

#### [NEW] `src/components/vms/VideoPlayer.tsx`
- HLS player with fallback, overlays, reconnect logic

#### [NEW] `src/components/vms/AnprOverlay.tsx`
- Animated bounding box overlay on video frames

#### [NEW] `src/components/vms/CrowdDensityMeter.tsx`
- Animated gauge component

#### [NEW] `src/components/vms/VehicleRouteMap.tsx`
- Leaflet map with animated route markers

#### [NEW] `src/components/vms/IntegrationStatusCard.tsx`
- Status badge for external system integrations

---

## Verification Plan

### Automated
- `npm run typecheck` — TypeScript compilation
- `npm run build` — Production build succeeds

### Manual
1. Navigate to `/vms` — landing page with KPIs
2. Navigate to `/vms/live` — video wall loads, HLS streams play from `live.corp8.cloud`
3. Navigate to `/vms/anpr` — plate detection feed populates in real-time
4. Navigate to `/vms/tracking` — vehicle route map shows cross-camera tracking
5. Navigate to `/vms/analytics` — live crowd/vehicle analytics update
6. Navigate to `/vms/integrations` — VAHAN lookup returns simulated result
7. Navigate to `/vms/storage` — tier gauges display correctly
8. Navigate to `/vms/security` — architecture diagram renders
