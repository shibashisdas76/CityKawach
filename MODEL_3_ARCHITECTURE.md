# 🌐 Sentinel Gujarat — Model 3: VMS Middleware & Multi-Vendor Federation Layer
### Architectural Specifications, Plugin SDK Standards, CEP Event Correlation & Sentinel Grid Ingestion Guide

---

## 1. 📌 Executive Overview

In large-scale statewide surveillance environments such as Gujarat, various departments (e.g. **Traffic Police**, **State Police HQ**, **Maritime & Port Authority**, **State Highway Authority**, and **Municipal Corporations**) have historically deployed heterogeneous Video Management Systems (VMS) from different vendors (e.g. **Milestone XProtect**, **Genetec Security Center**, **Hikvision HikCentral**, **Dahua DSS Pro**, and **Hanwha WAVE**).

**Model 3** establishes a centralized, high-performance **Middleware / Federation Layer** that bridges disparate departmental VMS platforms through standardized vendor adapters, asynchronous metadata exchange buses, and Complex Event Processing (CEP) correlation engines **without replacing existing departmental infrastructure**.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DOWNSTREAM OPERATIONAL COMMAND CENTER                                │
│        [Federated Video Wall]   [Unified Incident Hub]   [CEP Correlation Graph]   [Reports]     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                ▲
                                                │ REST / WebSockets (PTS Monotonic)
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   MODEL 3: VMS MIDDLEWARE & FEDERATION LAYER (CENTRAL GATEWAY)                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Extensible Connector SDK (IVmsAdapter Plugin Architecture)                                    │
│  • Distributed Metadata Exchange Bus (Kafka / RabbitMQ Pub-Sub Envelope Standard)                 │
│  • Complex Event Processing (CEP) Correlation Engine (Spatial-Temporal Cross-Agency Rules)        │
│  • Dynamic Catalogue Federation & Real-time Stream Proxy Bridge                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
            ▲                    ▲                    ▲                    ▲                    ▲
            │ MIP SDK            │ Web SDK            │ Artemis OpenAPI    │ DSS REST           │ WAVE API
┌───────────────────┐┌───────────────────┐┌───────────────────┐┌───────────────────┐┌───────────────────┐
│ Milestone XProtect││  Genetec Security ││ Hikvision HikCent ││   Dahua DSS Pro   ││   Hanwha WAVE     │
│  (Port Authority) ││   (State Police)  ││ (Traffic Police)  ││ (State Highways)  ││ (Municipal Corp)  │
└───────────────────┘└───────────────────┘└───────────────────┘└───────────────────┘└───────────────────┘
            ▲                    ▲                    ▲                    ▲                    ▲
            └────────────────────┴──────────┬─────────┴────────────────────┴────────────────────┘
                                            │ HLS / RTSP over TCP / WebRTC WHEP
                        ┌───────────────────────────────────────┐
                        │     SENTINEL STATEWIDE CAMERA GRID    │
                        │ 30 Live Feeds (cctv.corp8.cloud)      │
                        └───────────────────────────────────────┘
```

---

## 2. 🧱 Key Functional Components

### A. Multi-Vendor Adapter / Plugin Framework (`IVmsAdapter`)
The connector framework defines a lifecycle standard that any departmental VMS or third-party manufacturer can implement:
1. **`authenticate()`**: Performs token acquisition or WS-Security digest handshake.
2. **`fetch_camera_catalogue()`**: Discovers camera identifiers, video codecs (`H.264`, `HEVC`), resolutions, and field-of-view metadata.
3. **`get_stream_info(camera_id)`**: Resolves live HLS playlist proxy, RTSP over TCP URI (`rtsp_transport;tcp`), and WebRTC WHEP endpoints.
4. **`send_ptz_command(camera_id, pan, tilt, zoom)`**: Dispatches absolute or continuous PTZ vectors to the edge camera.
5. **`subscribe_alarms()`**: Hooks into native vendor alarm channels (ISAPI event streams, Milestone MIP subscriptions, Genetec Media Gateway webhooks).
6. **`get_health_telemetry()`**: Returns round-trip ping latency, packet loss percentage, FPS, bitrate, and uptime SLA metrics.

### Supported Vendor Connectors
| Connector Plugin | Vendor Target | Protocol Bridge | Default Jurisdiction |
|---|---|---|---|
| `MilestoneXProtectAdapter` | Milestone XProtect Corporate | MIP SDK REST + ONVIF Bridge | Gujarat Maritime & Port Authority |
| `GenetecSecurityCenterAdapter` | Genetec Security Center 5.12 | Web SDK v5.12 + Media Gateway | Gujarat State Police HQ |
| `HikvisionHikCentralAdapter` | Hikvision HikCentral Enterprise | Artemis OpenAPI + ISAPI v2.8 | Traffic Police Department |
| `DahuaDssAdapter` | Dahua DSS Pro VMS | DSS REST API + DPS Media Gateway | State Highway Authority |
| `HanwhaWaveAdapter` | Hanwha WAVE (Nx Witness) | Server REST API + WebSockets | Municipal Corporation & Urban Dev |
| `GenericOnvifAdapter` | Standards-based ONVIF Profile S/G/T | SOAP WS-Security + RTSP | General Infrastructure & Border Posts |

---

### B. Metadata Exchange Bus (`MetadataExchangeBus`)
Normalized event payloads are published across asynchronous Kafka/RabbitMQ-style topic partitions:
- **`vms.events.all`**: Master firehose for all incoming statewide video events.
- **`vms.events.anpr`**: License plate detections with confidence scores and vehicle classification.
- **`vms.events.speeding`**: Automated corridor speed violations.
- **`vms.events.perimeter`**: Facility barrier and restricted zone intrusions.
- **`vms.events.hazard`**: Fire, thermal anomaly, and smoke alerts.
- **`vms.events.crowd`**: Dense crowd surges and abnormal movement velocity.
- **`vms.correlations.alerts`**: High-priority multi-system alerts raised by the CEP engine.

#### Standardized Event Envelope Schema (`VmsEventEnvelope`)
```json
{
  "eventId": "evt-fed-101",
  "sourceVmsId": "vms-traffic-hikcentral",
  "sourceVmsName": "Gujarat Traffic Command VMS",
  "sourceVmsVendor": "HIKVISION_HIKCENTRAL",
  "departmentName": "Traffic Police Department",
  "district": "Ahmedabad",
  "cameraId": "cam01",
  "cameraName": "01 Chiman bhai Bridge",
  "location": "Chimanbhai Bridge, Ahmedabad",
  "eventType": "VEHICLE_SPEEDING",
  "severity": "HIGH",
  "confidence": 0.94,
  "ptsMs": 145020.0,
  "timestamp": "2026-09-03T02:48:00Z",
  "payload": {
    "plateNumber": "GJ01AB1234",
    "speedKmh": 104.5,
    "speedLimit": 50,
    "vehicleType": "CAR",
    "watchlistHit": true
  }
}
```

---

### C. Complex Event Processing (CEP) Correlation Engine
The stateful CEP engine maintains a temporal sliding window across all disparate VMS instances, detecting coordinated or sequential threat vectors:

#### 1. `RULE-01`: Cross-Jurisdiction Speeding & Interception Route
- **Condition**: Vehicle exceeds speed limit in **Traffic Police VMS (Hikvision)** + Sighted within 15 minutes at downstream toll checkpoint in **State Highway VMS (Dahua)**.
- **Outcome**: Calculates trajectory velocity, estimated checkpoint ETA (e.g. 6.5 mins), and dispatches Interceptor units.

#### 2. `RULE-02`: Multi-Sensor Emergency Hazard & Gridlock Fusion
- **Condition**: Fire / smoke alarm in **Municipal VMS (Hanwha)** + Concurrent traffic congestion surge in adjacent **Traffic VMS (Hikvision)** within a 1.5 km radius.
- **Outcome**: Automatically creates emergency corridor dispatch and flags green-light wave routing.

#### 3. `RULE-03`: Perimeter Breach & Vehicle Escape Vector
- **Condition**: Security zone breach in **Port Authority VMS (Milestone)** + Subsequent wrong-way entry in **Municipal City VMS (Hanwha)** within 20 minutes.
- **Outcome**: Initiates joint CISF and City Mobile Patrol roadblock protocols.

#### 4. `RULE-04`: Statewide BOLO Multi-System Convergence
- **Condition**: Sighting of an eGujCop / NAFIS / CCTNS wanted license plate across 2 or more distinct departmental VMS vendors.
- **Outcome**: Centralized high-priority alert with unified multi-agency tracking timeline.

---

## 3. 📡 Live Sentinel CCTV Grid Integration

All 30 live cameras from the Sentinel Camera Grid (`https://cctv.corp8.cloud/cameras.json`, password `NLFG-4QKB-K83P`) are dynamically partitioned and proxied through the federation layer:
1. **HLS Streams**: Served via authenticated proxy (`/api/stream/<id>/index.m3u8`) with AES-128 key resolution (`/api/stream/enc.key`).
2. **RTSP over TCP**: Enforced via `os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"` at `rtsp://103.250.160.189:8554/stream/<id>`.
3. **PTS Clock Monotonicity**: Frame timestamps are extracted from `CAP_PROP_POS_MSEC` to maintain exact chronological order across camera feed loop cuts.
4. **Exponential Reconnect Backoff**: Reconnection intervals scale from 2s up to 30s to handle stream supervisor restarts cleanly.

---

## 4. 🚀 REST API Reference (`/api/federation/*`)

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
