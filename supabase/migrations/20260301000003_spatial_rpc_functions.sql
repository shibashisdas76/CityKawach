-- Migration: 20260301000003_spatial_rpc_functions.sql
-- Description: PostGIS Spatial RPC Stored Procedures for Bounding Box, Proximity, and Gap Calculations.

--------------------------------------------------------------------------------
-- 1. Get Cameras in Viewport Bounding Box
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_get_cameras_in_bbox(
    min_lng DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    target_dept UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    name VARCHAR,
    type camera_type_enum,
    status camera_status,
    department_id UUID,
    department_name VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    city VARCHAR,
    district VARCHAR,
    ip_address VARCHAR,
    uptime_percentage DOUBLE PRECISION,
    last_health_check_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.name,
        c.type,
        c.status,
        c.department_id,
        d.name AS department_name,
        c.latitude,
        c.longitude,
        c.address,
        c.city,
        c.district,
        c.ip_address,
        c.uptime_percentage,
        c.last_health_check_at
    FROM cameras c
    JOIN departments d ON d.id = c.department_id
    WHERE c.location_geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    AND (target_dept IS NULL OR c.department_id = target_dept);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 2. Get Cameras Near Point (Radial Search)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_get_cameras_near_point(
    center_lng DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 1000.0
)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    name VARCHAR,
    type camera_type_enum,
    status camera_status,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
) AS $$
DECLARE
    center_point GEOGRAPHY;
BEGIN
    center_point := ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography;

    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.name,
        c.type,
        c.status,
        c.latitude,
        c.longitude,
        ST_Distance(c.location_geom, center_point) AS distance_meters
    FROM cameras c
    WHERE ST_DWithin(c.location_geom, center_point, radius_meters)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 3. Recalculate Zone Gap Analysis
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_recalculate_zone_gaps()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_installed INT;
    v_online INT;
    v_required INT;
    v_vdi DOUBLE PRECISION;
    v_tier VARCHAR;
BEGIN
    FOR rec IN SELECT id, area_sq_km, target_camera_density, boundary_geom FROM coverage_zones LOOP
        -- Count cameras physically inside polygon boundary
        SELECT COUNT(*) INTO v_installed
        FROM cameras c
        WHERE ST_Contains(rec.boundary_geom, ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326));

        SELECT COUNT(*) INTO v_online
        FROM cameras c
        WHERE ST_Contains(rec.boundary_geom, ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326))
        AND c.status = 'ONLINE';

        -- Calculate required count based on area and target density
        v_required := GREATEST(1, ROUND(rec.area_sq_km * rec.target_camera_density));

        -- Vulnerability Deficit Index formula: (1 - (Online Cameras / Required Cameras)) clamped to [0, 1]
        v_vdi := GREATEST(0.0, LEAST(1.0, 1.0 - (v_online::DOUBLE PRECISION / v_required::DOUBLE PRECISION)));

        IF v_vdi > 0.6 THEN
            v_tier := 'HIGH_DEFICIT';
        ELSIF v_vdi > 0.3 THEN
            v_tier := 'MEDIUM_DEFICIT';
        ELSE
            v_tier := 'LOW_DEFICIT';
        END IF;

        -- Upsert into gap_analysis
        INSERT INTO gap_analysis (
            zone_id,
            required_cameras,
            installed_cameras,
            online_cameras,
            vulnerability_deficit_index,
            tier,
            calculated_at
        ) VALUES (
            rec.id,
            v_required,
            v_installed,
            v_online,
            v_vdi,
            v_tier,
            NOW()
        )
        ON CONFLICT (zone_id) DO UPDATE SET
            required_cameras = EXCLUDED.required_cameras,
            installed_cameras = EXCLUDED.installed_cameras,
            online_cameras = EXCLUDED.online_cameras,
            vulnerability_deficit_index = EXCLUDED.vulnerability_deficit_index,
            tier = EXCLUDED.tier,
            calculated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
