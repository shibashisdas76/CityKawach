"""
Database Layer for Sentinel Model 2 Analytics & Vehicle Tracking Engine.
Stores real-time ANPR detections, law enforcement watchlists, alert logs, and vehicle movement checkpoints.
"""

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "sentinel_analytics.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Detections table
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

    # Index for fast plate trajectory queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_plate ON detections(plate_number)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_camera ON detections(camera_id)")

    # Watchlist table (eGujCop, NAFIS, CCTNS)
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

    # Alerts table (triggered matches)
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

    # Seed default watchlist if empty
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

    conn.commit()
    conn.close()

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
