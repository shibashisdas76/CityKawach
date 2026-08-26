-- Migration: 20260301000001_init_postgis_schema.sql
-- Description: Initialize PostGIS extensions, enums, core tables, spatial columns, triggers, and GiST indexes.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'STATE_ADMIN', 'DEPARTMENT_ADMIN', 'OPERATOR', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_status AS ENUM ('ONLINE', 'OFFLINE', 'WARNING', 'MAINTENANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_type_enum AS ENUM ('PTZ', 'FIXED', 'DOME', 'THERMAL', 'ANPR', 'MULTI_SENSOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    district VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL DEFAULT 'Gujarat',
    contact_email VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    badge_number VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    type camera_type_enum NOT NULL DEFAULT 'FIXED',
    status camera_status NOT NULL DEFAULT 'ONLINE',
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION DEFAULT 0.0,
    address TEXT,
    city VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL DEFAULT 'Gujarat',
    pincode VARCHAR(16),
    ip_address VARCHAR(64) NOT NULL,
    mac_address VARCHAR(32) NOT NULL,
    rtsp_url_template TEXT NOT NULL,
    resolution VARCHAR(32) DEFAULT '1080p',
    frame_rate INTEGER DEFAULT 30,
    codec VARCHAR(16) DEFAULT 'H.264',
    field_of_view_degrees INTEGER DEFAULT 90,
    night_vision_distance_meters INTEGER DEFAULT 30,
    ptz_support BOOLEAN DEFAULT FALSE,
    uptime_percentage DOUBLE PRECISION DEFAULT 99.5,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    installed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    last_health_check_at TIMESTAMPTZ DEFAULT NOW(),
    -- Spatial Column (Geography Point WGS84)
    location_geom GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Camera Health Table
CREATE TABLE IF NOT EXISTS camera_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status camera_status NOT NULL,
    latency_ms INTEGER NOT NULL DEFAULT 15,
    packet_loss_rate DOUBLE PRECISION DEFAULT 0.0,
    cpu_usage_percent DOUBLE PRECISION DEFAULT 25.0,
    memory_usage_percent DOUBLE PRECISION DEFAULT 40.0,
    storage_usage_percent DOUBLE PRECISION DEFAULT 60.0,
    temperature_celsius DOUBLE PRECISION DEFAULT 42.0,
    error_message TEXT
);

-- 7. Coverage Zones Table
CREATE TABLE IF NOT EXISTS coverage_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    district VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL DEFAULT 'Gujarat',
    target_camera_density DOUBLE PRECISION NOT NULL DEFAULT 5.0, -- per sq km
    area_sq_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    -- Spatial Column (Geometry Polygon WGS84)
    boundary_geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Gap Analysis Table
CREATE TABLE IF NOT EXISTS gap_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID UNIQUE NOT NULL REFERENCES coverage_zones(id) ON DELETE CASCADE,
    required_cameras INTEGER NOT NULL,
    installed_cameras INTEGER NOT NULL DEFAULT 0,
    online_cameras INTEGER NOT NULL DEFAULT 0,
    vulnerability_deficit_index DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- 0.0 to 1.0
    tier VARCHAR(32) NOT NULL DEFAULT 'LOW_DEFICIT', -- LOW_DEFICIT, MEDIUM_DEFICIT, HIGH_DEFICIT
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs Table (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID NOT NULL,
    actor_name VARCHAR(128) NOT NULL,
    actor_role user_role NOT NULL,
    actor_department_id UUID,
    action VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64) DEFAULT '127.0.0.1',
    metadata_diff JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 10. Spatial Synchronization Trigger for Cameras
CREATE OR REPLACE FUNCTION fn_sync_camera_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cameras_sync_geom ON cameras;
CREATE TRIGGER trg_cameras_sync_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON cameras
FOR EACH ROW
EXECUTE FUNCTION fn_sync_camera_location_geom();

-- 11. GiST Spatial Indices
CREATE INDEX IF NOT EXISTS idx_cameras_location_geom ON cameras USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_boundary_geom ON coverage_zones USING GIST (boundary_geom);
CREATE INDEX IF NOT EXISTS idx_cameras_department_id ON cameras (department_id);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras (status);
CREATE INDEX IF NOT EXISTS idx_camera_health_camera_id_ts ON camera_health (camera_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
