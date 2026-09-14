"""
Database Persistence & Mock/Live Storage Layer for Model 4: Consolidated Central VMS.
Manages:
- Video recording chunks & timeline bookmarks across Hot (NVMe), Warm (Ceph), and Cold (S3/Tape) tiers.
- Multi-task AI events: ANPR detections, Face Recognition biometrics, Crowd Density metrics, Anomaly threats.
- Authorised Government Database registries: VAHAN, SARTHI, eGujCop, AFIS/NAFIS, CCTNS.
- Disaster Recovery (DR) failover drill audit logs.
- Cryptographic video export ledger & security audit trail.
"""

import sqlite3
import os
import json
import uuid
import hashlib
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
            print(f"[Model4DB] PostgreSQL connection fallback to SQLite: {e}")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_model4_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Video Recordings & Hot/Warm/Cold Storage Chunks Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_recordings (
            id TEXT PRIMARY KEY,
            camera_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            location TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_sec INTEGER NOT NULL,
            size_mb REAL NOT NULL,
            storage_tier TEXT NOT NULL CHECK(storage_tier IN ('HOT', 'WARM', 'COLD')),
            storage_uri TEXT NOT NULL,
            codec TEXT DEFAULT 'h264',
            resolution TEXT DEFAULT '1920x1080',
            fps INTEGER DEFAULT 25,
            sha256_hash TEXT NOT NULL,
            encrypted INTEGER DEFAULT 1,
            bookmarks TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recordings_cam ON vms_recordings(camera_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recordings_tier ON vms_recordings(storage_tier)")

    # 2. Multi-Task AI - Face Recognition Detections Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_face_detections (
            id TEXT PRIMARY KEY,
            camera_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            pts_ms REAL NOT NULL,
            person_name TEXT,
            gender TEXT,
            estimated_age INTEGER,
            confidence REAL NOT NULL,
            nafis_id TEXT,
            criminal_record TEXT,
            alert_severity TEXT DEFAULT 'NONE',
            matched_watchlist INTEGER DEFAULT 0,
            face_bbox TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_face_timestamp ON vms_face_detections(timestamp DESC)")

    # 3. Multi-Task AI - Crowd Density & Traffic Heatmaps Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_crowd_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            pedestrian_count INTEGER NOT NULL,
            vehicle_count INTEGER NOT NULL,
            density_percent REAL NOT NULL,
            congestion_level TEXT NOT NULL,
            overcrowding_alert INTEGER DEFAULT 0,
            heatmap_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_crowd_cam ON vms_crowd_metrics(camera_id)")

    # 4. Multi-Task AI - Anomaly & Threat Detection Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_anomalies (
            id TEXT PRIMARY KEY,
            camera_id TEXT NOT NULL,
            camera_name TEXT NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            pts_ms REAL NOT NULL,
            anomaly_type TEXT NOT NULL CHECK(anomaly_type IN ('TRIPWIRE_BREACH', 'WRONG_WAY_DRIVING', 'UNATTENDED_BAGGAGE', 'OVERCROWDING', 'FIRE_SMOKE_HAZARD', 'CAMERA_TAMPERING')),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
            confidence REAL NOT NULL,
            status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
            resolved_by TEXT,
            resolution_notes TEXT,
            bounding_box TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_status ON vms_anomalies(status)")

    # 5. Government Database - VAHAN Vehicle Registry Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_vahan_records (
            plate_number TEXT PRIMARY KEY,
            owner_name TEXT NOT NULL,
            father_name TEXT,
            maker_model TEXT NOT NULL,
            vehicle_class TEXT NOT NULL,
            fuel_type TEXT NOT NULL,
            chassis_number TEXT NOT NULL,
            engine_number TEXT NOT NULL,
            registration_date TEXT NOT NULL,
            fitness_upto TEXT NOT NULL,
            insurance_valid_upto TEXT NOT NULL,
            rc_status TEXT NOT NULL,
            rto_location TEXT NOT NULL,
            blacklisted INTEGER DEFAULT 0,
            blacklist_reason TEXT
        )
    """)

    # 6. Government Database - SARTHI Driving License Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_sarthi_records (
            dl_number TEXT PRIMARY KEY,
            holder_name TEXT NOT NULL,
            father_name TEXT,
            date_of_birth TEXT NOT NULL,
            blood_group TEXT,
            license_status TEXT NOT NULL,
            valid_from TEXT NOT NULL,
            valid_upto TEXT NOT NULL,
            endorsements TEXT NOT NULL,
            issuing_rto TEXT NOT NULL,
            flagged INTEGER DEFAULT 0,
            flag_reason TEXT
        )
    """)

    # 7. Government Database - eGujCop Police FIR Registry Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_egujcop_records (
            fir_number TEXT PRIMARY KEY,
            police_station TEXT NOT NULL,
            district TEXT NOT NULL,
            crime_type TEXT NOT NULL,
            ipc_sections TEXT NOT NULL,
            stolen_vehicle_plate TEXT,
            accused_name TEXT,
            accused_nafis_id TEXT,
            fir_date TEXT NOT NULL,
            io_name TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    # 8. Government Database - AFIS/NAFIS Biometric Registry Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_nafis_records (
            nafis_id TEXT PRIMARY KEY,
            person_name TEXT NOT NULL,
            aliases TEXT,
            gender TEXT NOT NULL,
            age INTEGER,
            crime_category TEXT NOT NULL,
            wanted_by_state TEXT NOT NULL,
            red_corner_alert INTEGER DEFAULT 0,
            last_known_location TEXT,
            fingerprint_pattern TEXT,
            face_embedding_hash TEXT
        )
    """)

    # 9. Disaster Recovery (DR) Drill Log Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_dr_logs (
            id TEXT PRIMARY KEY,
            drill_name TEXT NOT NULL,
            primary_site TEXT NOT NULL,
            dr_site TEXT NOT NULL,
            trigger_type TEXT NOT NULL,
            start_time TEXT NOT NULL,
            failover_duration_sec REAL NOT NULL,
            rpo_achieved_ms REAL NOT NULL,
            rto_achieved_sec REAL NOT NULL,
            status TEXT NOT NULL,
            logs TEXT NOT NULL,
            executed_by TEXT NOT NULL
        )
    """)

    # 10. Evidentiary Video Export & Security Audit Trail Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vms_security_audit_trail (
            id TEXT PRIMARY KEY,
            action_type TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            resource_id TEXT,
            description TEXT NOT NULL,
            ip_address TEXT DEFAULT '127.0.0.1',
            sha256_checksum TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Commit baseline schemas
    conn.commit()

    # Seed Mock Data if tables are fresh
    _seed_initial_data(conn)

    conn.close()

def _seed_initial_data(conn):
    cursor = conn.cursor()

    # Seed Recordings
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_recordings")
    if cursor.fetchone()["cnt"] == 0:
        now = datetime.utcnow()
        sample_recordings = []
        for i in range(1, 16):
            cam_id = f"cam{i:02d}"
            rec_id = f"REC-GJ-{2026000 + i}"
            start = (now - timedelta(hours=i*2)).isoformat()
            end = (now - timedelta(hours=i*2 - 1)).isoformat()
            tier = "HOT" if i <= 4 else ("WARM" if i <= 10 else "COLD")
            sha = hashlib.sha256(f"{rec_id}-{cam_id}".encode()).hexdigest()
            uri = f"s3://gujarat-vms-{tier.lower()}/{cam_id}/{rec_id}.mp4"
            bookmarks = json.dumps([
                {"pts_ms": 12000, "label": "Vehicle Ingestion Start", "type": "INFO"},
                {"pts_ms": 45000, "label": "ANPR Flag Checkpoint", "type": "ALARM"}
            ])
            sample_recordings.append((
                rec_id, cam_id, f"Camera {i:02d}", f"Ahmedabad / Sector {i}",
                start, end, 3600, 450.5, tier, uri, "h264", "1920x1080", 25, sha, 1, bookmarks
            ))

        cursor.executemany("""
            INSERT INTO vms_recordings (
                id, camera_id, camera_name, location, start_time, end_time,
                duration_sec, size_mb, storage_tier, storage_uri, codec,
                resolution, fps, sha256_hash, encrypted, bookmarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_recordings)

    # Seed Face Detections (AFIS/NAFIS Linked)
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_face_detections")
    if cursor.fetchone()["cnt"] == 0:
        now = datetime.utcnow()
        sample_faces = [
            (
                str(uuid.uuid4()), "cam01", "01 Chiman bhai Bridge", "Chimanbhai Bridge, Ahmedabad",
                (now - timedelta(minutes=15)).isoformat(), 18450.0, "Rakesh Sharma", "MALE", 38, 0.94,
                "NAFIS-GJ-2024-9912", "Flagged in Inter-State Smuggling & Forgery (CCTNS #8841)", "CRITICAL", 1,
                json.dumps({"x": 420, "y": 180, "w": 110, "h": 140})
            ),
            (
                str(uuid.uuid4()), "cam03", "03 O.N.G.C", "ONGC Office Circle, Ahmedabad",
                (now - timedelta(minutes=45)).isoformat(), 42100.0, "Vikram Rathore", "MALE", 42, 0.91,
                "NAFIS-MH-2023-4102", "Wanted in Stolen Luxury Vehicle Interception (FIR #2026/881)", "CRITICAL", 1,
                json.dumps({"x": 510, "y": 210, "w": 95, "h": 125})
            ),
            (
                str(uuid.uuid4()), "cam05", "05 Visat", "Visat Teen Rasta, Sabarmati",
                (now - timedelta(minutes=80)).isoformat(), 95300.0, "Pedestrian Subject", "FEMALE", 29, 0.88,
                None, "No Prior Criminal Record (Civilian Clearance)", "NONE", 0,
                json.dumps({"x": 300, "y": 150, "w": 85, "h": 110})
            )
        ]
        cursor.executemany("""
            INSERT INTO vms_face_detections (
                id, camera_id, camera_name, location, timestamp, pts_ms,
                person_name, gender, estimated_age, confidence, nafis_id,
                criminal_record, alert_severity, matched_watchlist, face_bbox
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_faces)

    # Seed Crowd Metrics
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_crowd_metrics")
    if cursor.fetchone()["cnt"] == 0:
        now = datetime.utcnow()
        sample_crowd = []
        for i in range(1, 11):
            cam_id = f"cam{i:02d}"
            ped = 45 + (i * 12) % 120
            veh = 30 + (i * 8) % 80
            density = round(ped * 0.45 + veh * 0.55, 1)
            cong = "HIGH" if density > 70 else ("MODERATE" if density > 40 else "LOW")
            alert = 1 if density > 80 else 0
            heatmap = json.dumps([
                {"x": 200, "y": 300, "weight": 0.8},
                {"x": 450, "y": 350, "weight": 0.9},
                {"x": 600, "y": 400, "weight": 0.6}
            ])
            sample_crowd.append((
                cam_id, f"Camera {i:02d}", f"Ahmedabad Corridor {i}",
                (now - timedelta(minutes=i*10)).isoformat(),
                ped, veh, density, cong, alert, heatmap
            ))
        cursor.executemany("""
            INSERT INTO vms_crowd_metrics (
                camera_id, camera_name, location, timestamp, pedestrian_count,
                vehicle_count, density_percent, congestion_level, overcrowding_alert, heatmap_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_crowd)

    # Seed Anomalies
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_anomalies")
    if cursor.fetchone()["cnt"] == 0:
        now = datetime.utcnow()
        sample_anomalies = [
            (
                str(uuid.uuid4()), "cam04", "04 Paldi", "Paldi Cross Road, Ahmedabad",
                (now - timedelta(minutes=10)).isoformat(), 34200.0, "WRONG_WAY_DRIVING",
                "High-Speed Vehicle Going Contra-Flow", "Vehicle GJ01AB1234 reversed into one-way bus rapid transit lane",
                "CRITICAL", 0.96, "ACTIVE", None, None,
                json.dumps({"x": 380, "y": 420, "w": 180, "h": 120})
            ),
            (
                str(uuid.uuid4()), "cam08", "08 Majewadi", "Majewadi Gate, Junagadh",
                (now - timedelta(minutes=35)).isoformat(), 112000.0, "UNATTENDED_BAGGAGE",
                "Abandoned Object Detected > 10 Minutes", "Unclaimed dark duffle bag positioned near municipal sub-station",
                "HIGH", 0.89, "INVESTIGATING", "Officer Patil", "Sub-inspector dispatched to inspect perimeter",
                json.dumps({"x": 550, "y": 610, "w": 60, "h": 50})
            ),
            (
                str(uuid.uuid4()), "cam12", "12 Adalaj", "Tri Mandir Toll Plaza, Adalaj",
                (now - timedelta(minutes=65)).isoformat(), 78000.0, "TRIPWIRE_BREACH",
                "Restricted Toll Plaza Bypass Breach", "Heavy commercial carrier breached restricted automated barrier line",
                "HIGH", 0.92, "RESOLVED", "Traffic HQ", "Barrier reset and toll evasion challan issued",
                json.dumps({"x": 120, "y": 250, "w": 300, "h": 150})
            )
        ]
        cursor.executemany("""
            INSERT INTO vms_anomalies (
                id, camera_id, camera_name, location, timestamp, pts_ms,
                anomaly_type, title, description, severity, confidence, status,
                resolved_by, resolution_notes, bounding_box
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_anomalies)

    # Seed VAHAN Database
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_vahan_records")
    if cursor.fetchone()["cnt"] == 0:
        cursor.executemany("""
            INSERT INTO vms_vahan_records (
                plate_number, owner_name, father_name, maker_model, vehicle_class,
                fuel_type, chassis_number, engine_number, registration_date,
                fitness_upto, insurance_valid_upto, rc_status, rto_location,
                blacklisted, blacklist_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("GJ01AB1234", "Vikram Rathore", "Suraj Rathore", "Mahindra Scorpio S11 (White)", "LMV / SUV", "DIESEL", "MA1TA2BK8M128491", "D22DT89124", "2023-04-12", "2038-04-11", "2027-04-12", "ACTIVE (STOLEN FLAG)", "GJ-01 Ahmedabad RTO", 1, "eGujCop Stolen Vehicle FIR #2026/881"),
            ("GJ05CD5678", "Rakesh Sharma", "Mohan Sharma", "Toyota Fortuner 4x4 (Black)", "LMV / SUV", "DIESEL", "MBJ11FE29L984210", "1GD8832104", "2022-08-19", "2037-08-18", "2026-09-30", "ACTIVE (WANTED FLAG)", "GJ-05 Surat RTO", 1, "NAFIS / Inter-State Smuggling Warrant"),
            ("GJ27K9901", "Kiranbhai Patel", "Dineshbhai Patel", "Maruti Suzuki Swift VXI (Silver)", "LMV / Hatchback", "PETROL", "MA3EKB21S0091244", "K12M773190", "2021-11-05", "2036-11-04", "2027-01-15", "ACTIVE", "GJ-27 Ahmedabad Rural RTO", 0, None),
            ("GJ03XY8890", "Harish Patel", "Karsanbhai Patel", "Hyundai Creta SX (Grey)", "LMV / SUV", "PETROL", "MALC381CMM189421", "G4FL882194", "2024-01-10", "2039-01-09", "2027-01-10", "ACTIVE", "GJ-03 Rajkot RTO", 0, None),
            ("GJ18CX4521", "Manish Varma", "Suresh Varma", "Tata Nexon EV Max (Blue)", "LMV / EV", "ELECTRIC", "MAT612984N189210", "3PT8912048", "2023-09-22", "2038-09-21", "2026-11-20", "FLAGGED", "GJ-18 Gandhinagar RTO", 1, "Fake Number Plate Cloning Suspect (CCTNS)")
        ])

    # Seed SARTHI Database
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_sarthi_records")
    if cursor.fetchone()["cnt"] == 0:
        cursor.executemany("""
            INSERT INTO vms_sarthi_records (
                dl_number, holder_name, father_name, date_of_birth, blood_group,
                license_status, valid_from, valid_upto, endorsements, issuing_rto,
                flagged, flag_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("GJ01-20150019284", "Vikram Rathore", "Suraj Rathore", "1988-06-14", "B+ve", "SUSPENDED", "2015-02-10", "2035-02-09", "MCWG, LMV", "GJ-01 Ahmedabad", 1, "Suspended on Court Order / Police Request"),
            ("GJ05-20180094120", "Rakesh Sharma", "Mohan Sharma", "1986-11-29", "O+ve", "ACTIVE", "2018-05-18", "2038-05-17", "MCWG, LMV, TRANS", "GJ-05 Surat", 1, "Under Investigation (Crime Branch)"),
            ("GJ27-20200038192", "Kiranbhai Patel", "Dineshbhai Patel", "1994-03-08", "A+ve", "ACTIVE", "2020-08-12", "2040-08-11", "MCWG, LMV", "GJ-27 Ahmedabad Rural", 0, None),
            ("GJ18-20220044198", "Manish Varma", "Suresh Varma", "1991-12-05", "B-ve", "ACTIVE", "2022-01-15", "2042-01-14", "MCWG, LMV", "GJ-18 Gandhinagar", 0, None)
        ])

    # Seed eGujCop Database
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_egujcop_records")
    if cursor.fetchone()["cnt"] == 0:
        cursor.executemany("""
            INSERT INTO vms_egujcop_records (
                fir_number, police_station, district, crime_type, ipc_sections,
                stolen_vehicle_plate, accused_name, accused_nafis_id, fir_date,
                io_name, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("FIR/2026/AHM/0881", "Navrangpura Police Station", "Ahmedabad", "Motor Vehicle Theft", "IPC 379, 411", "GJ01AB1234", "Vikram Rathore", "NAFIS-MH-2023-4102", "2026-02-14", "PI K.M. Jadeja", "INVESTIGATION_UNDERWAY"),
            ("FIR/2025/SRT/1204", "Varachha Police Station", "Surat", "Inter-State Smuggling & Tax Evasion", "IPC 420, 467, 468, 471", "GJ05CD5678", "Rakesh Sharma", "NAFIS-GJ-2024-9912", "2025-11-20", "ACP V.R. Solanki", "NON_BAILABLE_WARRANT_ISSUED"),
            ("FIR/2026/GNR/0341", "Sector 7 Police Station", "Gandhinagar", "Counterfeit Number Plate", "IPC 465, 471", "GJ18CX4521", "Manish Varma", None, "2026-01-08", "PSI D.P. Barot", "CHARGE_SHEET_FILED")
        ])

    # Seed NAFIS Database
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_nafis_records")
    if cursor.fetchone()["cnt"] == 0:
        cursor.executemany("""
            INSERT INTO vms_nafis_records (
                nafis_id, person_name, aliases, gender, age, crime_category,
                wanted_by_state, red_corner_alert, last_known_location,
                fingerprint_pattern, face_embedding_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("NAFIS-GJ-2024-9912", "Rakesh Sharma", "Rocky, Lala", "MALE", 38, "Organized Smuggling / Arms Act", "Gujarat / Maharashtra", 1, "Surat / Navsari Border", "Whorl-Loop-Complex-99A", "f7a8b9c1d2e3"),
            ("NAFIS-MH-2023-4102", "Vikram Rathore", "Vicky Bhai", "MALE", 42, "Auto Theft Syndicate / Robbery", "Gujarat / Rajasthan", 1, "Ahmedabad City Core", "Double-Loop-Arch-41M", "a1b2c3d4e5f6"),
            ("NAFIS-RJ-2022-1109", "Devendra Singh", "Deva", "MALE", 45, "Border Infiltration / Narcotics", "Rajasthan / Gujarat", 1, "Banaskantha Border", "Central-Pocket-Loop-11R", "c8d9e0f1a2b3")
        ])

    # Seed Disaster Recovery Log
    cursor.execute("SELECT COUNT(*) as cnt FROM vms_dr_logs")
    if cursor.fetchone()["cnt"] == 0:
        cursor.execute("""
            INSERT INTO vms_dr_logs (
                id, drill_name, primary_site, dr_site, trigger_type, start_time,
                failover_duration_sec, rpo_achieved_ms, rto_achieved_sec, status,
                logs, executed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), "Quarterly Statewide SDC-to-DRS Failover Drill",
            "State Data Center (SDC) Gandhinagar", "Disaster Recovery Site (DRS) Ahmedabad",
            "SCHEDULED_SIMULATION", (datetime.utcnow() - timedelta(days=7)).isoformat(),
            22.4, 420.0, 18.5, "PASSED_SLA_COMPLIANT",
            json.dumps([
                "Initiated GSLB DNS Traffic Diversion to DRS Node",
                "Ceph Block Mirror Synchronized: 0 lag frames",
                "Kubernetes Ingestion Pods scaled on DRS: 80 nodes online in 14.2s",
                "Stream Integrity Verified on all 30 Sentinel Cameras",
                "Failover Completed in 18.5s (Target RTO < 30s Met)"
            ]),
            "Super Admin / State CISO"
        ))

    conn.commit()

# ─── Query Helpers ────────────────────────────────────────────────────────
def get_vms_recordings(tier: Optional[str] = None, camera_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_recordings WHERE 1=1"
    params = []
    if tier:
        query += " AND storage_tier = ?"
        params.append(tier.upper())
    if camera_id:
        query += " AND camera_id = ?"
        params.append(camera_id)
    query += " ORDER BY start_time DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_face_detections(limit: int = 30, watchlist_only: bool = False) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_face_detections WHERE 1=1"
    params = []
    if watchlist_only:
        query += " AND matched_watchlist = 1"
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_crowd_metrics(camera_id: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_crowd_metrics WHERE 1=1"
    params = []
    if camera_id:
        query += " AND camera_id = ?"
        params.append(camera_id)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_anomalies(status: Optional[str] = None, severity: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_anomalies WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status.upper())
    if severity:
        query += " AND severity = ?"
        params.append(severity.upper())
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def resolve_anomaly(anomaly_id: str, resolved_by: str, notes: str, status: str = "RESOLVED") -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE vms_anomalies
        SET status = ?, resolved_by = ?, resolution_notes = ?
        WHERE id = ?
    """, (status, resolved_by, notes, anomaly_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def lookup_vahan(plate: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    clean = plate.replace("-", "").replace(" ", "").upper()
    cursor.execute("SELECT * FROM vms_vahan_records WHERE REPLACE(REPLACE(plate_number, '-', ''), ' ', '') = ?", (clean,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def lookup_sarthi(dl_number: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    clean = dl_number.replace("-", "").replace(" ", "").upper()
    cursor.execute("SELECT * FROM vms_sarthi_records WHERE REPLACE(REPLACE(dl_number, '-', ''), ' ', '') = ?", (clean,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def lookup_egujcop(plate: Optional[str] = None, fir_no: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_egujcop_records WHERE 1=1"
    params = []
    if plate:
        clean = plate.replace("-", "").replace(" ", "").upper()
        query += " AND (REPLACE(REPLACE(stolen_vehicle_plate, '-', ''), ' ', '') = ? OR stolen_vehicle_plate IS NULL)"
        params.append(clean)
    if fir_no:
        query += " AND fir_number LIKE ?"
        params.append(f"%{fir_no}%")
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def lookup_nafis(nafis_id: Optional[str] = None, name: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vms_nafis_records WHERE 1=1"
    params = []
    if nafis_id:
        query += " AND nafis_id = ?"
        params.append(nafis_id)
    if name:
        query += " AND (person_name LIKE ? OR aliases LIKE ?)"
        params.extend([f"%{name}%", f"%{name}%"])
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def log_dr_drill(drill_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    drill_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO vms_dr_logs (
            id, drill_name, primary_site, dr_site, trigger_type, start_time,
            failover_duration_sec, rpo_achieved_ms, rto_achieved_sec, status, logs, executed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        drill_id, drill_data["drill_name"], drill_data["primary_site"],
        drill_data["dr_site"], drill_data.get("trigger_type", "SIMULATION"),
        drill_data.get("start_time", datetime.utcnow().isoformat()),
        drill_data.get("failover_duration_sec", 15.2),
        drill_data.get("rpo_achieved_ms", 350.0),
        drill_data.get("rto_achieved_sec", 16.4),
        drill_data.get("status", "SUCCESS"),
        json.dumps(drill_data.get("logs", [])),
        drill_data.get("executed_by", "State CISO")
    ))
    conn.commit()
    conn.close()
    return drill_id

def get_dr_logs(limit: int = 15) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vms_dr_logs ORDER BY start_time DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def log_audit_action(action_type: str, actor_name: str, actor_role: str, description: str, resource_id: Optional[str] = None, checksum: Optional[str] = None) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    audit_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO vms_security_audit_trail (
            id, action_type, actor_id, actor_name, actor_role, resource_id, description, sha256_checksum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (audit_id, action_type, f"USR-{abs(hash(actor_name))%10000:04d}", actor_name, actor_role, resource_id, description, checksum))
    conn.commit()
    conn.close()
    return audit_id

def get_audit_trail(limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vms_security_audit_trail ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# ─── Live Worker Event Ingestion Helpers ─────────────────────────────────────
def record_face_detection(event: Dict[str, Any]) -> str:
    """Inserts a real-time face recognition sighting from the edge worker."""
    conn = get_connection()
    cursor = conn.cursor()
    doc_id = event.get("id") or str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO vms_face_detections (
            id, camera_id, camera_name, location, timestamp, pts_ms,
            person_name, gender, estimated_age, confidence, nafis_id,
            criminal_record, alert_severity, matched_watchlist, face_bbox
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_id, event["camera_id"], event["camera_name"], event["location"],
        event.get("timestamp", datetime.utcnow().isoformat()),
        event.get("pts_ms", 0.0), event.get("person_name", "Citizen"),
        event.get("gender", "MALE"), event.get("estimated_age", 30),
        event.get("confidence", 0.90), event.get("nafis_id"),
        event.get("criminal_record"), event.get("alert_severity", "NONE"),
        event.get("matched_watchlist", 0), event.get("face_bbox", "{}")
    ))
    conn.commit()
    conn.close()
    return doc_id

def record_crowd_metrics(metrics: Dict[str, Any]) -> int:
    """Inserts real-time crowd density, footfall, and heatmap data from the edge worker."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vms_crowd_metrics (
            camera_id, camera_name, location, timestamp, pedestrian_count,
            vehicle_count, density_percent, congestion_level, overcrowding_alert, heatmap_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        metrics["camera_id"], metrics["camera_name"], metrics["location"],
        metrics.get("timestamp", datetime.utcnow().isoformat()),
        metrics.get("pedestrian_count", 0), metrics.get("vehicle_count", 0),
        metrics.get("density_percent", 0.0), metrics.get("congestion_level", "LOW"),
        metrics.get("overcrowding_alert", 0), metrics.get("heatmap_data", "[]")
    ))
    inserted_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return inserted_id

def record_anomaly(anomaly: Dict[str, Any]) -> str:
    """Inserts a real-time spatial-temporal anomaly threat from the edge worker."""
    conn = get_connection()
    cursor = conn.cursor()
    doc_id = anomaly.get("id") or str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO vms_anomalies (
            id, camera_id, camera_name, location, timestamp, pts_ms,
            anomaly_type, title, description, severity, confidence, status,
            resolved_by, resolution_notes, bounding_box
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_id, anomaly["camera_id"], anomaly["camera_name"], anomaly["location"],
        anomaly.get("timestamp", datetime.utcnow().isoformat()),
        anomaly.get("pts_ms", 0.0), anomaly["anomaly_type"], anomaly["title"],
        anomaly["description"], anomaly["severity"], anomaly.get("confidence", 0.92),
        anomaly.get("status", "ACTIVE"), anomaly.get("resolved_by"),
        anomaly.get("resolution_notes"), anomaly.get("bounding_box", "{}")
    ))
    conn.commit()
    conn.close()
    return doc_id

