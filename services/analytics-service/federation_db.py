"""
Database Layer for Model 3: VMS Federation & Middleware Platform.
Stores registered departmental VMS platforms, normalized federated event streams,
cross-system correlated incidents, CEP correlation rules, and immutable audit logs.
"""

import sqlite3
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "sentinel_analytics.db")
DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if DATABASE_URL and DATABASE_URL.startswith("postgres"):
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        except Exception as e:
            print(f"[FederationDB] PostgreSQL connection fallback to SQLite: {e}")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_federation_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Registered VMS Platforms
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_platforms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            vendor TEXT NOT NULL,
            vendor_name TEXT NOT NULL,
            department_id TEXT NOT NULL,
            department_name TEXT NOT NULL,
            district TEXT NOT NULL,
            status TEXT DEFAULT 'CONNECTED',
            protocol TEXT NOT NULL,
            api_version TEXT DEFAULT 'v2.4',
            api_base_url TEXT NOT NULL,
            synced_cameras_count INTEGER DEFAULT 0,
            total_alarms_24h INTEGER DEFAULT 0,
            latency_ms REAL DEFAULT 42.0,
            packet_loss_percent REAL DEFAULT 0.05,
            uptime_percentage REAL DEFAULT 99.98,
            capabilities_json TEXT NOT NULL,
            color_theme TEXT DEFAULT '#2563EB',
            last_heartbeat TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Normalized Federated Events Log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS federated_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT UNIQUE NOT NULL,
            source_vms_id TEXT NOT NULL,
            source_vms_name TEXT NOT NULL,
            source_vms_vendor TEXT NOT NULL,
            department_name TEXT NOT NULL,
            district TEXT NOT NULL,
            camera_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            location TEXT NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            confidence REAL NOT NULL,
            pts_ms REAL,
            payload_json TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fed_events_time ON federated_events(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fed_events_vms ON federated_events(source_vms_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fed_events_type ON federated_events(event_type)")

    # 3. Correlated Incidents (Complex Event Processing Results)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS correlated_incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_code TEXT UNIQUE NOT NULL,
            rule_id TEXT NOT NULL,
            rule_code TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT DEFAULT 'OPEN',
            lead_department TEXT NOT NULL,
            involved_vms_ids_json TEXT NOT NULL,
            involved_vendors_json TEXT NOT NULL,
            involved_cameras_json TEXT NOT NULL,
            trigger_events_json TEXT NOT NULL,
            correlation_score REAL NOT NULL,
            time_window_seconds INTEGER DEFAULT 600,
            first_event_timestamp TEXT NOT NULL,
            last_event_timestamp TEXT NOT NULL,
            estimated_eta_minutes REAL,
            recommended_action TEXT NOT NULL,
            resolved_by TEXT,
            action_notes TEXT,
            dispatched_units_json TEXT,
            graph_data_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_corr_inc_status ON correlated_incidents(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_corr_inc_time ON correlated_incidents(created_at DESC)")

    # 4. Correlation Rules Matrix
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS correlation_rules (
            id TEXT PRIMARY KEY,
            rule_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            primary_trigger_type TEXT NOT NULL,
            secondary_trigger_types_json TEXT NOT NULL,
            max_time_window_seconds INTEGER NOT NULL,
            max_spatial_distance_km REAL NOT NULL,
            min_confidence REAL NOT NULL,
            severity TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            trigger_count_24h INTEGER DEFAULT 0
        )
    """)

    # 5. VMS Federation Audit Trail
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_audit_trail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            target_vms_id TEXT,
            details_json TEXT,
            timestamp TEXT NOT NULL
        )
    """)

    # Seed Default VMS Platforms if empty
    cursor.execute("SELECT COUNT(*) as count FROM vms_platforms")
    if cursor.fetchone()["count"] == 0:
        default_platforms = [
            (
                "vms-traffic-hikcentral",
                "Gujarat Traffic Command VMS",
                "HIKVISION_HIKCENTRAL",
                "Hikvision HikCentral Enterprise",
                "dept-traffic-police",
                "Traffic Police Department",
                "Ahmedabad & Gandhinagar",
                "CONNECTED",
                "Artemis OpenAPI + ISAPI v2.8",
                "v2.8.1",
                "https://traffic-vms.gujarat.gov.in/artemis",
                8,
                142,
                38.5,
                0.02,
                99.99,
                json.dumps({
                    "ptzControl": True,
                    "liveStreaming": True,
                    "playbackStreaming": True,
                    "edgeAnalyticsPassthrough": True,
                    "alarmTriggering": True,
                    "twoWayAudio": False,
                    "bookmarking": True
                }),
                "#E11D48",
                datetime.utcnow().isoformat()
            ),
            (
                "vms-police-genetec",
                "State Police Crime & Security VMS",
                "GENETEC_SECURITY_CENTER",
                "Genetec Security Center 5.12",
                "dept-state-police",
                "Gujarat State Police HQ",
                "Statewide Corridor",
                "CONNECTED",
                "Web SDK v5.12 + Media Gateway",
                "v5.12.0",
                "https://police-vms.gujarat.gov.in/sdk",
                7,
                98,
                44.2,
                0.04,
                99.98,
                json.dumps({
                    "ptzControl": True,
                    "liveStreaming": True,
                    "playbackStreaming": True,
                    "edgeAnalyticsPassthrough": True,
                    "alarmTriggering": True,
                    "twoWayAudio": True,
                    "bookmarking": True
                }),
                "#059669",
                datetime.utcnow().isoformat()
            ),
            (
                "vms-port-milestone",
                "Kutch & Coastal Ports Security VMS",
                "MILESTONE_XPROTECT",
                "Milestone XProtect Corporate",
                "dept-port-authority",
                "Gujarat Maritime & Port Authority",
                "Kutch & Gulf of Khambhat",
                "CONNECTED",
                "MIP SDK REST + ONVIF Bridge",
                "v2024.R2",
                "https://ports-vms.gujarat.gov.in/mip",
                5,
                64,
                52.1,
                0.06,
                99.95,
                json.dumps({
                    "ptzControl": True,
                    "liveStreaming": True,
                    "playbackStreaming": True,
                    "edgeAnalyticsPassthrough": True,
                    "alarmTriggering": True,
                    "twoWayAudio": False,
                    "bookmarking": True
                }),
                "#2563EB",
                datetime.utcnow().isoformat()
            ),
            (
                "vms-highways-dahua",
                "Expressway & State Highway VMS",
                "DAHUA_DSS",
                "Dahua DSS Pro VMS",
                "dept-state-highways",
                "State Highway Authority",
                "Junagadh & Saurashtra Corridors",
                "CONNECTED",
                "DSS REST API + DPS Gateway",
                "v8.4.2",
                "https://highways-vms.gujarat.gov.in/dss",
                6,
                82,
                46.8,
                0.03,
                99.97,
                json.dumps({
                    "ptzControl": True,
                    "liveStreaming": True,
                    "playbackStreaming": True,
                    "edgeAnalyticsPassthrough": True,
                    "alarmTriggering": True,
                    "twoWayAudio": False,
                    "bookmarking": True
                }),
                "#D97706",
                datetime.utcnow().isoformat()
            ),
            (
                "vms-municipal-hanwha",
                "Smart City Urban Surveillance VMS",
                "HANWHA_WAVE",
                "Hanwha WAVE VMS (Nx Witness)",
                "dept-municipal-corp",
                "Municipal Corporation & Urban Dev",
                "Navsari & South Gujarat",
                "CONNECTED",
                "Server REST API + WebSockets",
                "v5.1.4",
                "https://municipal-vms.gujarat.gov.in/api",
                4,
                53,
                41.0,
                0.01,
                99.99,
                json.dumps({
                    "ptzControl": True,
                    "liveStreaming": True,
                    "playbackStreaming": True,
                    "edgeAnalyticsPassthrough": True,
                    "alarmTriggering": True,
                    "twoWayAudio": True,
                    "bookmarking": True
                }),
                "#7C3AED",
                datetime.utcnow().isoformat()
            )
        ]
        cursor.executemany("""
            INSERT INTO vms_platforms (
                id, name, vendor, vendor_name, department_id, department_name, district,
                status, protocol, api_version, api_base_url, synced_cameras_count,
                total_alarms_24h, latency_ms, packet_loss_percent, uptime_percentage,
                capabilities_json, color_theme, last_heartbeat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_platforms)

    # Seed Default Correlation Rules if empty
    cursor.execute("SELECT COUNT(*) as count FROM correlation_rules")
    if cursor.fetchone()["count"] == 0:
        default_rules = [
            (
                "rule-01-interception",
                "RULE-01",
                "Cross-Jurisdiction Speeding & Interception Route",
                "Correlates high-speed corridor violations in Traffic VMS with downstream checkpoint sightings in Highway / Port VMS to compute interception intercept points.",
                "TRAFFIC",
                "VEHICLE_SPEEDING",
                json.dumps(["ANPR_SIGHTING", "CROSS_JURISDICTION_BOLO"]),
                900,  # 15 minutes
                35.0,  # 35 km
                0.88,
                "HIGH",
                1,
                14
            ),
            (
                "rule-02-emergency-corridor",
                "RULE-02",
                "Multi-Sensor Emergency Hazard & Gridlock Fusion",
                "Correlates municipal thermal/fire alerts with adjacent traffic VMS congestion surges to trigger automated emergency corridor green-lights.",
                "DISASTER",
                "FIRE_SMOKE_HAZARD",
                json.dumps(["CROWD_SURGE", "VEHICLE_SPEEDING"]),
                600,  # 10 minutes
                1.5,  # 1.5 km
                0.92,
                "CRITICAL",
                1,
                6
            ),
            (
                "rule-03-perimeter-escape",
                "RULE-03",
                "Perimeter Breach & Vehicle Escape Vector",
                "Correlates secure facility perimeter intrusion alarms (Port/Highway) with subsequent vehicle sightings in City Police VMS within escape radius.",
                "SECURITY",
                "PERIMETER_INTRUSION",
                json.dumps(["ANPR_SIGHTING", "WRONG_WAY_ENTRY"]),
                1200,  # 20 minutes
                25.0,  # 25 km
                0.90,
                "CRITICAL",
                1,
                9
            ),
            (
                "rule-04-bolo-convergence",
                "RULE-04",
                "Statewide BOLO Multi-System Convergence",
                "Correlates watchlist vehicle hits flagged simultaneously or sequentially across two or more distinct departmental VMS vendors.",
                "SECURITY",
                "CROSS_JURISDICTION_BOLO",
                json.dumps(["ANPR_SIGHTING"]),
                1800,  # 30 minutes
                150.0,
                0.95,
                "CRITICAL",
                1,
                18
            )
        ]
        cursor.executemany("""
            INSERT INTO correlation_rules (
                id, rule_code, name, description, category, primary_trigger_type,
                secondary_trigger_types_json, max_time_window_seconds, max_spatial_distance_km,
                min_confidence, severity, is_active, trigger_count_24h
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_rules)

    # Seed Sample Correlated Incidents if empty
    cursor.execute("SELECT COUNT(*) as count FROM correlated_incidents")
    if cursor.fetchone()["count"] == 0:
        now = datetime.utcnow()
        now_iso = now.isoformat()
        earlier_5m = (now - timedelta(minutes=5)).isoformat()
        earlier_12m = (now - timedelta(minutes=12)).isoformat()
        earlier_25m = (now - timedelta(minutes=25)).isoformat()

        sample_incidents = [
            (
                "CORR-2026-881",
                "rule-01-interception",
                "RULE-01",
                "Cross-Jurisdiction Speeding & Interception Route",
                "Target GJ01AB1234 (Scorpio) Speeding on Chimanbhai Bridge -> Tracked to Tri Mandir Toll",
                "Vehicle clocked at 104 km/h in Traffic Police VMS (HikCentral - Cam 01) then sighted 8 mins later passing Adalaj Toll Plaza (Dahua VMS - Cam 12). Direction vector indicates Gandhinagar corridor escape.",
                "CRITICAL",
                "OPEN",
                "Traffic Police Department",
                json.dumps(["vms-traffic-hikcentral", "vms-highways-dahua"]),
                json.dumps(["HIKVISION_HIKCENTRAL", "DAHUA_DSS"]),
                json.dumps(["cam01", "cam12"]),
                json.dumps([
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
                        "timestamp": earlier_12m,
                        "payload": {"plateNumber": "GJ01AB1234", "speedKmh": 104.5, "speedLimit": 50, "vehicleType": "CAR"}
                    },
                    {
                        "eventId": "evt-fed-102",
                        "sourceVmsId": "vms-highways-dahua",
                        "sourceVmsName": "Expressway & State Highway VMS",
                        "sourceVmsVendor": "DAHUA_DSS",
                        "departmentName": "State Highway Authority",
                        "district": "Gandhinagar",
                        "cameraId": "cam12",
                        "cameraName": "12 Tri Mandir Adalaj Tollnaka",
                        "location": "Tri Mandir Toll Plaza, Adalaj",
                        "eventType": "ANPR_SIGHTING",
                        "severity": "CRITICAL",
                        "confidence": 0.98,
                        "ptsMs": 149820.0,
                        "timestamp": earlier_5m,
                        "payload": {"plateNumber": "GJ01AB1234", "watchlistHit": True, "speedKmh": 78.0, "vehicleType": "CAR"}
                    }
                ]),
                0.96,
                720,
                earlier_12m,
                earlier_5m,
                6.5,
                "Deploy Interceptor Unit 4 to Gandhinagar CH-0 Circle Checkpost. Coordinate between Traffic Control & State Highway Patrol.",
                None,
                None,
                json.dumps(["Interceptor-04 (Gandhinagar)", "PCR-12 (Adalaj)"]),
                json.dumps({
                    "nodes": [
                        {"id": "node-1", "type": "EVENT", "label": "Speeding (104 km/h)", "vmsVendor": "HIKVISION_HIKCENTRAL", "department": "Traffic Police", "timestamp": earlier_12m},
                        {"id": "node-2", "type": "CAMERA", "label": "Cam 01 - Chimanbhai Bridge", "vmsVendor": "HIKVISION_HIKCENTRAL", "department": "Traffic Police"},
                        {"id": "node-3", "type": "TARGET", "label": "GJ01AB1234 (Scorpio)", "details": {"reason": "Stolen Vehicle (eGujCop FIR #2026/881)", "severity": "CRITICAL"}},
                        {"id": "node-4", "type": "CAMERA", "label": "Cam 12 - Tri Mandir Toll", "vmsVendor": "DAHUA_DSS", "department": "State Highways"},
                        {"id": "node-5", "type": "EVENT", "label": "Toll Checkpoint Sighting", "vmsVendor": "DAHUA_DSS", "department": "State Highways", "timestamp": earlier_5m}
                    ],
                    "edges": [
                        {"id": "edge-1", "source": "node-2", "target": "node-1", "label": "Triggered Ingest", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.96, "timeDeltaSeconds": 0},
                        {"id": "edge-2", "source": "node-1", "target": "node-3", "label": "Target Plate Match", "relationType": "IDENTITY_MATCH", "confidence": 0.94, "timeDeltaSeconds": 0},
                        {"id": "edge-3", "source": "node-3", "target": "node-5", "label": "Sequential Path (14.2 km)", "relationType": "TEMPORAL_SEQUENCE", "confidence": 0.97, "timeDeltaSeconds": 420},
                        {"id": "edge-4", "source": "node-4", "target": "node-5", "label": "Toll Lane Capture", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.98, "timeDeltaSeconds": 0}
                    ]
                }),
                earlier_5m
            ),
            (
                "CORR-2026-882",
                "rule-03-perimeter-escape",
                "RULE-03",
                "Perimeter Breach & Vehicle Escape Vector",
                "Port Perimeter Barrier Breach -> Sighted at Bilimora Junction VMS",
                "Milestone XProtect (Gandhidham Port - Cam 30) logged unauthorized security zone breach. Correlated with Hanwha WAVE (Bilimora - Cam 36) registering suspicious escape vehicle within 20 min window.",
                "HIGH",
                "INVESTIGATING",
                "Gujarat Maritime & Port Authority",
                json.dumps(["vms-port-milestone", "vms-municipal-hanwha"]),
                json.dumps(["MILESTONE_XPROTECT", "HANWHA_WAVE"]),
                json.dumps(["cam30", "cam36"]),
                json.dumps([
                    {
                        "eventId": "evt-fed-201",
                        "sourceVmsId": "vms-port-milestone",
                        "sourceVmsName": "Kutch & Coastal Ports Security VMS",
                        "sourceVmsVendor": "MILESTONE_XPROTECT",
                        "departmentName": "Gujarat Maritime & Port Authority",
                        "district": "Kutch",
                        "cameraId": "cam30",
                        "cameraName": "30 Gandhidham Rambaugh p2",
                        "location": "Rambaugh P2, Gandhidham Port",
                        "eventType": "PERIMETER_INTRUSION",
                        "severity": "CRITICAL",
                        "confidence": 0.96,
                        "ptsMs": 130100.0,
                        "timestamp": earlier_25m,
                        "payload": {"zoneName": "Restricted Quay Zone C", "rawAlarmCode": "MIP_ALARM_0x44B"}
                    },
                    {
                        "eventId": "evt-fed-202",
                        "sourceVmsId": "vms-municipal-hanwha",
                        "sourceVmsName": "Smart City Urban Surveillance VMS",
                        "sourceVmsVendor": "HANWHA_WAVE",
                        "departmentName": "Municipal Corporation & Urban Dev",
                        "district": "Navsari",
                        "cameraId": "cam36",
                        "cameraName": "36 Bilimora City Core",
                        "location": "Bilimora City Core, Navsari",
                        "eventType": "WRONG_WAY_ENTRY",
                        "severity": "HIGH",
                        "confidence": 0.89,
                        "ptsMs": 131300.0,
                        "timestamp": earlier_12m,
                        "payload": {"plateNumber": "GJ05CD5678", "speedKmh": 62.0}
                    }
                ]),
                0.91,
                1200,
                earlier_25m,
                earlier_12m,
                11.0,
                "Dispatch Port CISF Response & Alert Navsari District Police Station for roadblock establishment.",
                None,
                None,
                json.dumps(["CISF Quick Reaction Team 2", "Navsari City Mobile Patrol"]),
                json.dumps({
                    "nodes": [
                        {"id": "node-10", "type": "EVENT", "label": "Perimeter Breach (Quay C)", "vmsVendor": "MILESTONE_XPROTECT", "department": "Port Authority", "timestamp": earlier_25m},
                        {"id": "node-11", "type": "CAMERA", "label": "Cam 30 - Gandhidham Port", "vmsVendor": "MILESTONE_XPROTECT", "department": "Port Authority"},
                        {"id": "node-12", "type": "TARGET", "label": "GJ05CD5678 (Fortuner)", "details": {"reason": "Wanted in Inter-State Smuggling", "severity": "CRITICAL"}},
                        {"id": "node-13", "type": "CAMERA", "label": "Cam 36 - Bilimora Core", "vmsVendor": "HANWHA_WAVE", "department": "Municipal Corp"},
                        {"id": "node-14", "type": "EVENT", "label": "Wrong-Way Corridor Escape", "vmsVendor": "HANWHA_WAVE", "department": "Municipal Corp", "timestamp": earlier_12m}
                    ],
                    "edges": [
                        {"id": "edge-10", "source": "node-11", "target": "node-10", "label": "Intrusion Trigger", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.96, "timeDeltaSeconds": 0},
                        {"id": "edge-11", "source": "node-10", "target": "node-12", "label": "Visual Target Match", "relationType": "IDENTITY_MATCH", "confidence": 0.91, "timeDeltaSeconds": 180},
                        {"id": "edge-12", "source": "node-12", "target": "node-14", "label": "Corridor Transit", "relationType": "TEMPORAL_SEQUENCE", "confidence": 0.90, "timeDeltaSeconds": 780},
                        {"id": "edge-13", "source": "node-13", "target": "node-14", "label": "Optical Sighting", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.89, "timeDeltaSeconds": 0}
                    ]
                }),
                earlier_12m
            )
        ]

        cursor.executemany("""
            INSERT INTO correlated_incidents (
                incident_code, rule_id, rule_code, rule_name, title, description,
                severity, status, lead_department, involved_vms_ids_json, involved_vendors_json,
                involved_cameras_json, trigger_events_json, correlation_score, time_window_seconds,
                first_event_timestamp, last_event_timestamp, estimated_eta_minutes,
                recommended_action, resolved_by, action_notes, dispatched_units_json,
                graph_data_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_incidents)

    conn.commit()
    conn.close()

# ─── CRUD Operations for VMS Platforms ────────────────────────────────────

def get_all_vms_platforms() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vms_platforms ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["capabilities"] = json.loads(d["capabilities_json"])
        del d["capabilities_json"]
        result.append(d)
    return result

def get_vms_platform_by_id(vms_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vms_platforms WHERE id = ?", (vms_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["capabilities"] = json.loads(d["capabilities_json"])
    del d["capabilities_json"]
    return d

def register_vms_platform(
    vms_id: str,
    name: str,
    vendor: str,
    vendor_name: str,
    department_id: str,
    department_name: str,
    district: str,
    protocol: str,
    api_base_url: str,
    capabilities: Dict[str, bool],
    color_theme: str = "#3B82F6"
) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat()
    try:
        cursor.execute("""
            INSERT INTO vms_platforms (
                id, name, vendor, vendor_name, department_id, department_name, district,
                status, protocol, api_version, api_base_url, synced_cameras_count,
                total_alarms_24h, latency_ms, packet_loss_percent, uptime_percentage,
                capabilities_json, color_theme, last_heartbeat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONNECTED', ?, 'v1.0', ?, 0, 0, 45.0, 0.01, 100.0, ?, ?, ?)
        """, (
            vms_id, name, vendor, vendor_name, department_id, department_name, district,
            protocol, api_base_url, json.dumps(capabilities), color_theme, now_iso
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.close()
        return False

def update_vms_telemetry(vms_id: str, latency_ms: float, synced_cams: int, status: str = "CONNECTED"):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE vms_platforms
        SET latency_ms = ?, synced_cameras_count = ?, status = ?, last_heartbeat = ?
        WHERE id = ?
    """, (latency_ms, synced_cams, status, now_iso, vms_id))
    conn.commit()
    conn.close()

# ─── Event Ingestion & Bus Storage ────────────────────────────────────────

def record_federated_event(event: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO federated_events (
            event_id, source_vms_id, source_vms_name, source_vms_vendor,
            department_name, district, camera_id, camera_name, location,
            event_type, severity, confidence, pts_ms, payload_json, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event["eventId"],
        event["sourceVmsId"],
        event["sourceVmsName"],
        event["sourceVmsVendor"],
        event["departmentName"],
        event["district"],
        event["cameraId"],
        event["cameraName"],
        event["location"],
        event["eventType"],
        event["severity"],
        event["confidence"],
        event.get("ptsMs", 0.0),
        json.dumps(event.get("payload", {})),
        event["timestamp"]
    ))
    event_row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return event_row_id

def get_recent_federated_events(limit: int = 50, vms_id: Optional[str] = None, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM federated_events WHERE 1=1"
    params = []
    if vms_id:
        query += " AND source_vms_id = ?"
        params.append(vms_id)
    if event_type:
        query += " AND event_type = ?"
        params.append(event_type)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["payload"] = json.loads(d["payload_json"])
        del d["payload_json"]
        result.append(d)
    return result

# ─── Correlated Incidents ─────────────────────────────────────────────────

def get_all_correlated_incidents(limit: int = 30, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM correlated_incidents WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["involvedVmsIds"] = json.loads(d["involved_vms_ids_json"])
        d["involvedVendors"] = json.loads(d["involved_vendors_json"])
        d["involvedCameras"] = json.loads(d["involved_cameras_json"])
        d["triggerEvents"] = json.loads(d["trigger_events_json"])
        d["graphData"] = json.loads(d["graph_data_json"])
        d["dispatchedUnits"] = json.loads(d["dispatched_units_json"]) if d["dispatched_units_json"] else []
        del d["involved_vms_ids_json"]
        del d["involved_vendors_json"]
        del d["involved_cameras_json"]
        del d["trigger_events_json"]
        del d["graph_data_json"]
        del d["dispatched_units_json"]
        result.append(d)
    return result

def get_correlated_incident_by_id(incident_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM correlated_incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["involvedVmsIds"] = json.loads(d["involved_vms_ids_json"])
    d["involvedVendors"] = json.loads(d["involved_vendors_json"])
    d["involvedCameras"] = json.loads(d["involved_cameras_json"])
    d["triggerEvents"] = json.loads(d["trigger_events_json"])
    d["graphData"] = json.loads(d["graph_data_json"])
    d["dispatchedUnits"] = json.loads(d["dispatched_units_json"]) if d["dispatched_units_json"] else []
    del d["involved_vms_ids_json"]
    del d["involved_vendors_json"]
    del d["involved_cameras_json"]
    del d["trigger_events_json"]
    del d["graph_data_json"]
    del d["dispatched_units_json"]
    return d

def resolve_correlated_incident(incident_id: int, resolved_by: str, action_notes: str, status: str = "RESOLVED") -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE correlated_incidents
        SET status = ?, resolved_by = ?, action_notes = ?, resolved_at = ?
        WHERE id = ?
    """, (status, resolved_by, action_notes, now_iso, incident_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def insert_correlated_incident(incident: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO correlated_incidents (
            incident_code, rule_id, rule_code, rule_name, title, description,
            severity, status, lead_department, involved_vms_ids_json, involved_vendors_json,
            involved_cameras_json, trigger_events_json, correlation_score, time_window_seconds,
            first_event_timestamp, last_event_timestamp, estimated_eta_minutes,
            recommended_action, resolved_by, action_notes, dispatched_units_json,
            graph_data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        incident["incidentCode"],
        incident["ruleId"],
        incident["ruleCode"],
        incident["ruleName"],
        incident["title"],
        incident["description"],
        incident["severity"],
        incident.get("status", "OPEN"),
        incident["leadDepartment"],
        json.dumps(incident.get("involvedVmsIds", [])),
        json.dumps(incident.get("involvedVendors", [])),
        json.dumps(incident.get("involvedCameras", [])),
        json.dumps(incident.get("triggerEvents", [])),
        incident["correlationScore"],
        incident.get("timeWindowSeconds", 600),
        incident["firstEventTimestamp"],
        incident["lastEventTimestamp"],
        incident.get("estimatedEtaMinutes", 5.0),
        incident["recommendedAction"],
        incident.get("resolvedBy"),
        incident.get("actionNotes"),
        json.dumps(incident.get("dispatchedUnits", [])),
        json.dumps(incident.get("graphData", {"nodes": [], "edges": []})),
        incident.get("createdAt", datetime.utcnow().isoformat())
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

# ─── Correlation Rules ────────────────────────────────────────────────────

def get_all_correlation_rules() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM correlation_rules ORDER BY rule_code ASC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        rule_dict = {
            "id": d["id"],
            "ruleCode": d["rule_code"],
            "name": d["name"],
            "description": d["description"],
            "category": d["category"],
            "primaryTriggerType": d["primary_trigger_type"],
            "secondaryTriggerTypes": json.loads(d["secondary_trigger_types_json"]),
            "maxTimeWindowSeconds": d["max_time_window_seconds"],
            "maxSpatialDistanceKm": d["max_spatial_distance_km"],
            "minConfidence": d["min_confidence"],
            "severity": d["severity"],
            "isActive": bool(d["is_active"]),
            "triggerCount24h": d["trigger_count_24h"]
        }
        result.append(rule_dict)
    return result

def toggle_correlation_rule(rule_id: str, is_active: bool) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE correlation_rules SET is_active = ? WHERE id = ?", (1 if is_active else 0, rule_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# ─── Federation Analytics Aggregator ──────────────────────────────────────

def get_federation_overview_kpis() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_vms FROM vms_platforms")
    total_vms = cursor.fetchone()["total_vms"]

    cursor.execute("SELECT SUM(synced_cameras_count) as total_cameras FROM vms_platforms")
    cam_row = cursor.fetchone()
    total_cameras = cam_row["total_cameras"] if cam_row and cam_row["total_cameras"] else 30

    cursor.execute("SELECT COUNT(*) as total_events FROM federated_events")
    total_events = cursor.fetchone()["total_events"]

    cursor.execute("SELECT COUNT(*) as total_correlations FROM correlated_incidents")
    total_correlations = cursor.fetchone()["total_correlations"]

    cursor.execute("SELECT COUNT(*) as active_correlations FROM correlated_incidents WHERE status IN ('OPEN', 'INVESTIGATING', 'DISPATCHED')")
    active_correlations = cursor.fetchone()["active_correlations"]

    cursor.execute("SELECT AVG(latency_ms) as avg_latency FROM vms_platforms WHERE status = 'CONNECTED'")
    avg_latency_row = cursor.fetchone()
    avg_latency = round(avg_latency_row["avg_latency"], 1) if avg_latency_row and avg_latency_row["avg_latency"] else 44.5

    conn.close()
    return {
        "totalVmsPlatforms": total_vms,
        "totalFederatedCameras": total_cameras,
        "totalEventsProcessed": total_events + 24800,  # Simulated baseline + live
        "totalCorrelations": total_correlations,
        "activeCorrelations": active_correlations,
        "averageLatencyMs": avg_latency,
        "systemAvailabilitySla": 99.98,
        "messageBusThroughputEventsSec": 340.5
    }
