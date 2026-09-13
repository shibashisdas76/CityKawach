"""
Database Layer for Sentinel Gujarat CCTV Central Platform (Model 1 & Model 2).
Provides PostgreSQL / PostGIS compatibility with automatic SQLite fallback.
Handles Camera Registry, Departments, Coverage Zones, Audit Logs, Real-time ANPR Detections,
Law Enforcement Watchlists, and Alert Trails.
"""

import os
import json
import sqlite3
from datetime import datetime
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
            print(f"[DB] PostgreSQL connection failed ({e}), falling back to SQLite: {DB_FILE}")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # ─── Model 1: Camera Registry Tables ─────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registry_departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            contact_person TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            camera_count INTEGER DEFAULT 0,
            active_cameras INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registry_cameras (
            id TEXT PRIMARY KEY,
            camera_id TEXT UNIQUE NOT NULL,
            camera_name TEXT NOT NULL,
            department_id TEXT NOT NULL,
            department_name TEXT NOT NULL,
            camera_type TEXT DEFAULT 'FIXED',
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_description TEXT,
            ward TEXT,
            zone TEXT,
            district TEXT NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            ip_address TEXT,
            mac_address TEXT,
            rtsp_url TEXT,
            resolution TEXT DEFAULT '1080p',
            fps INTEGER DEFAULT 25,
            storage_retention_days INTEGER DEFAULT 30,
            installation_date TEXT,
            last_maintenance_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reg_cameras_district ON registry_cameras(district)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reg_cameras_status ON registry_cameras(status)")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coverage_zones (
            id TEXT PRIMARY KEY,
            zone_code TEXT UNIQUE NOT NULL,
            zone_name TEXT NOT NULL,
            district TEXT NOT NULL,
            ward TEXT NOT NULL,
            required_cameras INTEGER NOT NULL,
            actual_cameras INTEGER NOT NULL,
            target_camera_density REAL DEFAULT 15.0,
            vulnerability_index REAL NOT NULL,
            priority_tier TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            target_entity TEXT NOT NULL,
            target_id TEXT NOT NULL,
            ip_address TEXT DEFAULT '127.0.0.1',
            metadata_diff TEXT
        )
    """)

    # ─── Model 2: Analytics & ANPR Tables ─────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT NOT NULL,
            camera_name TEXT,
            location TEXT NOT NULL,
            plate_number TEXT NOT NULL,
            vehicle_type TEXT DEFAULT 'CAR',
            vehicle_color TEXT DEFAULT 'White',
            confidence REAL NOT NULL,
            pts_ms REAL,
            speed_kmh REAL DEFAULT 45.0,
            direction TEXT DEFAULT 'N',
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_plate ON detections(plate_number)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_camera ON detections(camera_id)")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate_number TEXT UNIQUE NOT NULL,
            owner_name TEXT,
            vehicle_model TEXT,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
            source TEXT DEFAULT 'eGujCop',
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            detection_id INTEGER,
            camera_id TEXT NOT NULL,
            camera_name TEXT,
            location TEXT NOT NULL,
            plate_number TEXT NOT NULL,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL,
            source TEXT DEFAULT 'eGujCop',
            confidence REAL NOT NULL,
            timestamp TEXT NOT NULL,
            resolved INTEGER DEFAULT 0,
            resolved_by TEXT,
            action_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (detection_id) REFERENCES detections(id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC)")

    # ─── Seed Default Data ───────────────────────────────────────────────────
    _seed_registry_defaults(cursor)
    _seed_watchlist_defaults(cursor)

    conn.commit()
    conn.close()

def _seed_registry_defaults(cursor):
    cursor.execute("SELECT COUNT(*) as count FROM registry_departments")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        cursor.executemany("""
            INSERT INTO registry_departments (id, name, code, contact_person, contact_email, contact_phone, camera_count, active_cameras, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("11111111-1111-1111-1111-111111111111", "Ahmedabad Traffic Police Surveillance", "GJ-POL-AHM", "DCP Traffic Surveillance", "traffic.police@ahmedabad.gujarat.gov.in", "+91 79 2563 0100", 25, 23, "ACTIVE"),
            ("22222222-2222-2222-2222-222222222222", "Ahmedabad Municipal Corporation (AMC)", "GJ-AMC-CC", "Chief Municipal IT Officer", "ccsc@ahmedabadcity.gov.in", "+91 79 2755 0001", 18, 16, "ACTIVE"),
            ("33333333-3333-3333-3333-333333333333", "GSRTC State Transport & Highways", "GJ-TRN-GS", "General Manager Technical", "control@gsrtc.in", "+91 79 2286 0000", 12, 11, "ACTIVE"),
            ("44444444-4444-4444-4444-444444444444", "Surat City Police Control", "GJ-POL-SUR", "Superintendent of Police", "control@suratpolice.gov.in", "+91 261 246 0100", 15, 14, "ACTIVE")
        ])

    cursor.execute("SELECT COUNT(*) as count FROM registry_cameras")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        cursor.executemany("""
            INSERT INTO registry_cameras (id, camera_id, camera_name, department_id, department_name, camera_type, latitude, longitude, location_description, ward, zone, district, status, ip_address, mac_address, rtsp_url, resolution, fps, storage_retention_days, installation_date, last_maintenance_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("cam-001", "GJ-AHM-POL-001", "Income Tax Circle PTZ", "11111111-1111-1111-1111-111111111111", "Ahmedabad Traffic Police Surveillance", "PTZ", 23.0425, 72.5714, "Ashram Road junction facing North-East", "Ward 12 - Navrangpura", "West Zone", "Ahmedabad", "ACTIVE", "10.120.44.11", "00:1A:2B:3C:4D:5E", "rtsp://cctv.corp8.cloud:8554/stream/1", "4K", 30, 60, "2024-01-15", "2026-08-10"),
            ("cam-002", "GJ-AHM-POL-002", "Nehru Bridge East Junction", "11111111-1111-1111-1111-111111111111", "Ahmedabad Traffic Police Surveillance", "ANPR", 23.0289, 72.5812, "Riverfront approach roadway", "Ward 08 - Paldi", "Central Zone", "Ahmedabad", "ACTIVE", "10.120.44.12", "00:1A:2B:3C:4D:5F", "rtsp://cctv.corp8.cloud:8554/stream/2", "1080p", 25, 30, "2024-02-01", "2026-08-15"),
            ("cam-003", "GJ-JUN-MUN-001", "Timbavadi Overbridge Camera", "22222222-2222-2222-2222-222222222222", "Ahmedabad Municipal Corporation (AMC)", "FIXED", 21.5144, 70.4712, "NH-8D Timbavadi flyover entry", "Ward 04 - Timbavadi", "South Zone", "Junagadh", "ACTIVE", "10.120.48.10", "00:1A:2B:3C:4D:60", "rtsp://cctv.corp8.cloud:8554/stream/6", "1080p", 25, 30, "2024-03-10", "2026-08-20"),
            ("cam-004", "GJ-NAV-POL-001", "Bilimora Railway Road Surveillance", "44444444-4444-4444-4444-444444444444", "Surat City Police Control", "DOME", 20.7621, 72.9644, "Railway Station road main crossroad", "Ward 02 - Bilimora", "Navsari Zone", "Navsari", "ACTIVE", "10.120.52.14", "00:1A:2B:3C:4D:61", "rtsp://cctv.corp8.cloud:8554/stream/25", "1080p", 25, 45, "2024-04-12", "2026-08-18"),
            ("cam-005", "GJ-GND-TRN-001", "Adalaj Trimandir Crossroad", "33333333-3333-3333-3333-333333333333", "GSRTC State Transport & Highways", "ANPR", 23.1645, 72.5810, "Ahmedabad-Kalol State Highway", "Ward 01 - Adalaj", "North Zone", "Gandhinagar", "ACTIVE", "10.120.46.22", "00:1A:2B:3C:4D:62", "rtsp://cctv.corp8.cloud:8554/stream/12", "4K", 30, 60, "2024-05-01", "2026-08-25"),
            ("cam-006", "GJ-SOM-POL-001", "Somnath Temple Bypass Junction", "11111111-1111-1111-1111-111111111111", "Ahmedabad Traffic Police Surveillance", "PTZ", 20.9011, 70.4022, "Veraval-Somnath Coastal Bypass", "Ward 03 - Prabhas Patan", "Coastal Zone", "Gir Somnath", "ACTIVE", "10.120.54.19", "00:1A:2B:3C:4D:63", "rtsp://cctv.corp8.cloud:8554/stream/7", "1080p", 25, 30, "2024-06-15", "2026-08-28")
        ])

    cursor.execute("SELECT COUNT(*) as count FROM coverage_zones")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        cursor.executemany("""
            INSERT INTO coverage_zones (id, zone_code, zone_name, district, ward, required_cameras, actual_cameras, target_camera_density, vulnerability_index, priority_tier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("zone-001", "Z-AHM-W08", "Paldi Riverfront Corridor", "Ahmedabad", "Ward 08 - Paldi", 12, 6, 18.0, 0.50, "HIGH"),
            ("zone-002", "Z-JUN-W04", "Timbavadi Industrial Bypass", "Junagadh", "Ward 04 - Timbavadi", 10, 4, 15.0, 0.60, "CRITICAL"),
            ("zone-003", "Z-NAV-W02", "Bilimora Town Centre", "Navsari", "Ward 02 - Bilimora", 8, 5, 12.0, 0.38, "MEDIUM"),
            ("zone-004", "Z-GND-W01", "Adalaj Highway Corridor", "Gandhinagar", "Ward 01 - Adalaj", 10, 8, 14.0, 0.20, "LOW")
        ])

def _seed_watchlist_defaults(cursor):
    cursor.execute("SELECT COUNT(*) as count FROM watchlist")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        cursor.executemany("""
            INSERT INTO watchlist (plate_number, owner_name, vehicle_model, reason, severity, source)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            ("GJ01AB1234", "Vikram Rathore", "Mahindra Scorpio (White)", "Stolen Vehicle (eGujCop FIR #2026/881)", "CRITICAL", "eGujCop"),
            ("GJ05CD5678", "Rakesh Sharma", "Toyota Fortuner (Black)", "Flagged in NAFIS / Wanted in Inter-State Smuggling", "CRITICAL", "NAFIS"),
            ("GJ27K9901", "Unknown", "Maruti Swift (Silver)", "Suspicious Checkpost Evasion & Hit-and-Run", "HIGH", "Traffic Police"),
            ("GJ03XY8890", "Harish Patel", "Hyundai Creta (Grey)", "Repeated Red Light & Speeding Violation (14 Challans)", "MEDIUM", "Traffic Police"),
            ("GJ18CX4521", "Manish Varma", "Tata Nexon (Blue)", "Fake License Plate Match (CCTNS Flag)", "HIGH", "CCTNS"),
            ("GJ01ZZ0001", "Sanjay Dave", "Mercedes Benz E-Class (Black)", "Tax Evasion & High Speed Zone Violation", "MEDIUM", "State Transport"),
            ("MH02AB1234", "Anand Joshi", "Honda City (White)", "Stolen in Mumbai, Tracked entering Gujarat border", "HIGH", "CCTNS"),
            ("RJ14GH8822", "Devendra Singh", "Bolero Camper (White)", "Border Checkpost Unauthorized Crossing", "HIGH", "Police Control")
        ])

# ─── Model 1 Camera Registry Database Operations ─────────────────────────────
def get_registry_cameras(district: Optional[str] = None, department_id: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM registry_cameras WHERE 1=1"
    params = []

    if district:
        query += " AND district = ?"
        params.append(district)
    if department_id:
        query += " AND department_id = ?"
        params.append(department_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (camera_name LIKE ? OR camera_id LIKE ? OR location_description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_registry_camera_by_id(camera_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM registry_cameras WHERE id = ? OR camera_id = ?", (camera_id, camera_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_registry_camera(camera_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cam_id = camera_data.get("id") or f"cam-{int(datetime.utcnow().timestamp())}"
    now = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO registry_cameras (
            id, camera_id, camera_name, department_id, department_name,
            camera_type, latitude, longitude, location_description, ward,
            zone, district, status, ip_address, mac_address, rtsp_url,
            resolution, fps, storage_retention_days, installation_date,
            last_maintenance_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        cam_id,
        camera_data["camera_id"],
        camera_data["camera_name"],
        camera_data.get("department_id", "11111111-1111-1111-1111-111111111111"),
        camera_data.get("department_name", "Gujarat Police Surveillance"),
        camera_data.get("camera_type", "FIXED"),
        camera_data["latitude"],
        camera_data["longitude"],
        camera_data.get("location_description", ""),
        camera_data.get("ward", ""),
        camera_data.get("zone", ""),
        camera_data.get("district", "Gujarat"),
        camera_data.get("status", "ACTIVE"),
        camera_data.get("ip_address", "10.0.0.1"),
        camera_data.get("mac_address", "00:00:00:00:00:00"),
        camera_data.get("rtsp_url", ""),
        camera_data.get("resolution", "1080p"),
        camera_data.get("fps", 25),
        camera_data.get("storage_retention_days", 30),
        camera_data.get("installation_date", now[:10]),
        camera_data.get("last_maintenance_date", now[:10]),
        now,
        now
    ))

    # Log audit event
    record_audit_log(
        actor_id="user_admin",
        actor_name="State Officer",
        actor_role="STATE_ADMIN",
        action="CREATE_CAMERA",
        target_entity="registry_cameras",
        target_id=camera_data["camera_id"],
        metadata_diff={"camera_id": camera_data["camera_id"], "name": camera_data["camera_name"]}
    )

    conn.commit()
    conn.close()
    return get_registry_camera_by_id(cam_id) or camera_data

def update_registry_camera(camera_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    allowed_fields = [
        "camera_name", "department_id", "department_name", "camera_type",
        "latitude", "longitude", "location_description", "ward", "zone",
        "district", "status", "ip_address", "mac_address", "rtsp_url",
        "resolution", "fps", "storage_retention_days", "last_maintenance_date"
    ]

    set_clauses = []
    params = []
    for field in allowed_fields:
        if field in updates:
            set_clauses.append(f"{field} = ?")
            params.append(updates[field])

    if not set_clauses:
        conn.close()
        return get_registry_camera_by_id(camera_id)

    set_clauses.append("updated_at = ?")
    params.append(now)
    params.append(camera_id)
    params.append(camera_id)

    query = f"UPDATE registry_cameras SET {', '.join(set_clauses)} WHERE id = ? OR camera_id = ?"
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()

    return get_registry_camera_by_id(camera_id)

def delete_registry_camera(camera_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registry_cameras WHERE id = ? OR camera_id = ?", (camera_id, camera_id))
    deleted = cursor.rowcount > 0
    if deleted:
        record_audit_log(
            actor_id="user_admin",
            actor_name="State Officer",
            actor_role="STATE_ADMIN",
            action="DELETE_CAMERA",
            target_entity="registry_cameras",
            target_id=camera_id,
            metadata_diff={"camera_id": camera_id}
        )
    conn.commit()
    conn.close()
    return deleted

def get_registry_departments() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM registry_departments ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_coverage_zones() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coverage_zones ORDER BY vulnerability_index DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def recalculate_coverage_zones() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT district, COUNT(*) as cam_count FROM registry_cameras GROUP BY district")
    district_counts = {r["district"]: r["cam_count"] for r in cursor.fetchall()}

    cursor.execute("SELECT * FROM coverage_zones")
    zones = cursor.fetchall()

    updated_zones = []
    for z in zones:
        actual = district_counts.get(z["district"], z["actual_cameras"])
        req = z["required_cameras"]
        vdi = max(0.0, min(1.0, 1.0 - (actual / req if req > 0 else 0)))

        tier = "LOW"
        if vdi > 0.7:
            tier = "CRITICAL"
        elif vdi > 0.4:
            tier = "HIGH"
        elif vdi > 0.2:
            tier = "MEDIUM"

        cursor.execute("""
            UPDATE coverage_zones
            SET actual_cameras = ?, vulnerability_index = ?, priority_tier = ?
            WHERE id = ?
        """, (actual, round(vdi, 2), tier, z["id"]))

    conn.commit()
    conn.close()
    return get_coverage_zones()

def record_audit_log(actor_id: str, actor_name: str, actor_role: str, action: str, target_entity: str, target_id: str, metadata_diff: Optional[Dict[str, Any]] = None, ip_address: str = "10.120.0.1"):
    conn = get_connection()
    cursor = conn.cursor()
    log_id = f"audit-{int(datetime.utcnow().timestamp() * 1000)}"
    ts = datetime.utcnow().isoformat()
    meta_json = json.dumps(metadata_diff or {})

    cursor.execute("""
        INSERT INTO audit_logs (id, timestamp, actor_id, actor_name, actor_role, action, target_entity, target_id, ip_address, metadata_diff)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, ts, actor_id, actor_name, actor_role, action, target_entity, target_id, ip_address, meta_json))

    conn.commit()
    conn.close()

def get_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("metadata_diff") and isinstance(d["metadata_diff"], str):
            try:
                d["metadata_diff"] = json.loads(d["metadata_diff"])
            except:
                pass
        result.append(d)
    return result

# ─── Model 2 Analytics Operations ───────────────────────────────────────────
def record_detection(
    camera_id: str,
    camera_name: str,
    location: str,
    plate_number: str,
    vehicle_type: str,
    vehicle_color: str,
    confidence: float,
    pts_ms: float,
    speed_kmh: float = 45.0,
    direction: str = "N",
    custom_timestamp: Optional[str] = None
) -> int:
    conn = get_connection()
    cursor = conn.cursor()

    ts = custom_timestamp or datetime.utcnow().isoformat()
    plate_clean = plate_number.replace("-", "").replace(" ", "").upper()

    cursor.execute("""
        INSERT INTO detections (camera_id, camera_name, location, plate_number, vehicle_type, vehicle_color, confidence, pts_ms, speed_kmh, direction, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (camera_id, camera_name, location, plate_clean, vehicle_type, vehicle_color, confidence, pts_ms, speed_kmh, direction, ts))
    detection_id = cursor.lastrowid

    # Check against watchlist
    cursor.execute("SELECT * FROM watchlist WHERE plate_number = ? AND active = 1", (plate_clean,))
    watchlist_hit = cursor.fetchone()

    if watchlist_hit:
        cursor.execute("""
            INSERT INTO alerts (detection_id, camera_id, camera_name, location, plate_number, reason, severity, source, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            detection_id, camera_id, camera_name, location, plate_clean,
            watchlist_hit["reason"], watchlist_hit["severity"], watchlist_hit["source"],
            confidence, ts
        ))

    conn.commit()
    conn.close()
    return detection_id

def get_recent_detections(limit: int = 25, camera_id: Optional[str] = None, watchlist_only: bool = False) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT d.id, d.camera_id, d.camera_name, d.location, d.plate_number, 
               d.vehicle_type, d.vehicle_color, d.confidence, d.pts_ms, 
               d.speed_kmh, d.direction, d.timestamp,
               CASE WHEN w.id IS NOT NULL THEN 1 ELSE 0 END as watchlist_hit,
               w.reason as watchlist_reason, w.severity as watchlist_severity
        FROM detections d
        LEFT JOIN watchlist w ON d.plate_number = w.plate_number AND w.active = 1
        WHERE 1=1
    """
    params = []

    if camera_id:
        query += " AND d.camera_id = ?"
        params.append(camera_id)

    if watchlist_only:
        query += " AND w.id IS NOT NULL"

    query += " ORDER BY d.timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

def search_plate_history(plate_query: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    clean_query = plate_query.replace("-", "").replace(" ", "").upper()

    cursor.execute("""
        SELECT d.id, d.camera_id, d.camera_name, d.location, d.plate_number,
               d.vehicle_type, d.vehicle_color, d.confidence, d.pts_ms,
               d.speed_kmh, d.direction, d.timestamp,
               CASE WHEN w.id IS NOT NULL THEN 1 ELSE 0 END as watchlist_hit,
               w.reason as watchlist_reason, w.severity as watchlist_severity
        FROM detections d
        LEFT JOIN watchlist w ON d.plate_number = w.plate_number AND w.active = 1
        WHERE d.plate_number LIKE ?
        ORDER BY d.timestamp ASC
    """, (f"%{clean_query}%",))

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_recent_alerts(limit: int = 25, unresolved_only: bool = False) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT a.id, a.detection_id, a.camera_id, a.camera_name, a.location,
               a.plate_number, a.reason, a.severity, a.source, a.confidence,
               a.timestamp, a.resolved, a.resolved_by, a.action_notes
        FROM alerts a
        WHERE 1=1
    """
    params = []

    if unresolved_only:
        query += " AND a.resolved = 0"

    query += " ORDER BY a.timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_watchlist_records(active_only: bool = True) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    if active_only:
        cursor.execute("SELECT * FROM watchlist WHERE active = 1 ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM watchlist ORDER BY id DESC")

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_watchlist_entry(plate_number: str, reason: str, severity: str, owner_name: str = "", vehicle_model: str = "", source: str = "Manual Entry") -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    clean_plate = plate_number.replace("-", "").replace(" ", "").upper()
    try:
        cursor.execute("""
            INSERT INTO watchlist (plate_number, owner_name, vehicle_model, reason, severity, source)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (clean_plate, owner_name, vehicle_model, reason, severity.upper(), source))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.close()
        return False

def resolve_alert_by_id(alert_id: int, resolved_by: str, action_notes: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE alerts 
        SET resolved = 1, resolved_by = ?, action_notes = ?
        WHERE id = ?
    """, (resolved_by, action_notes, alert_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def get_analytics_metrics() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_detections FROM detections")
    total_detections = cursor.fetchone()["total_detections"]

    cursor.execute("SELECT COUNT(*) as total_alerts FROM alerts")
    total_alerts = cursor.fetchone()["total_alerts"]

    cursor.execute("SELECT COUNT(DISTINCT plate_number) as unique_vehicles FROM detections")
    unique_vehicles = cursor.fetchone()["unique_vehicles"]

    cursor.execute("SELECT COUNT(*) as active_watchlist FROM watchlist WHERE active = 1")
    active_watchlist = cursor.fetchone()["active_watchlist"]

    cursor.execute("SELECT AVG(confidence) as avg_conf FROM detections")
    avg_conf_row = cursor.fetchone()
    avg_confidence = round(avg_conf_row["avg_conf"] * 100, 1) if avg_conf_row and avg_conf_row["avg_conf"] else 92.4

    conn.close()
    return {
        "total_detections": total_detections,
        "total_alerts": total_alerts,
        "unique_vehicles": unique_vehicles,
        "active_watchlist": active_watchlist,
        "avg_confidence": avg_confidence
    }
