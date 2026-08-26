-- Supabase Seed Data - Module 1: Gujarat CCTV Registry & GIS Mapping Platform

-- 1. Departments
INSERT INTO departments (id, code, name, district, state, contact_email) VALUES
('11111111-1111-1111-1111-111111111111', 'DEPT-AMD-TRAFFIC', 'Ahmedabad Traffic Police Surveillance', 'Ahmedabad', 'Gujarat', 'traffic.amd@gujarat.gov.in'),
('22222222-2222-2222-2222-222222222222', 'DEPT-GND-SMART', 'Gandhinagar Smart City Control Room', 'Gandhinagar', 'Gujarat', 'smartcity.gnd@gujarat.gov.in'),
('33333333-3333-3333-3333-333333333333', 'DEPT-SRT-PORT', 'Surat Municipal Command Center', 'Surat', 'Gujarat', 'command.srt@gujarat.gov.in'),
('44444444-4444-4444-4444-444444444444', 'DEPT-STATE-HQ', 'Gujarat State Police HQ - CCTV Cell', 'Gandhinagar', 'Gujarat', 'statehq.cctv@gujarat.gov.in')
ON CONFLICT (code) DO NOTHING;

-- 2. User Profiles
INSERT INTO user_profiles (id, user_id, full_name, email, role, department_id, badge_number) VALUES
('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Vikramaditya Sharma', 'superadmin@gujarat.gov.in', 'SUPER_ADMIN', '44444444-4444-4444-4444-444444444444', 'GJ-SP-001'),
('a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Ananya Patel', 'stateadmin@gujarat.gov.in', 'STATE_ADMIN', '44444444-4444-4444-4444-444444444444', 'GJ-SA-002'),
('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Rajesh Shah', 'amd.admin@gujarat.gov.in', 'DEPARTMENT_ADMIN', '11111111-1111-1111-1111-111111111111', 'GJ-DA-101'),
('a4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Priya Joshi', 'operator.amd@gujarat.gov.in', 'OPERATOR', '11111111-1111-1111-1111-111111111111', 'GJ-OP-102'),
('a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Karan Mehta', 'viewer@gujarat.gov.in', 'VIEWER', '22222222-2222-2222-2222-222222222222', 'GJ-VW-201')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Cameras (Ahmedabad, Gandhinagar, Surat)
INSERT INTO cameras (
    id, code, name, type, status, department_id, latitude, longitude, altitude, address, city, district, state, pincode, ip_address, mac_address, rtsp_url_template, resolution, frame_rate, codec, field_of_view_degrees, night_vision_distance_meters, ptz_support, uptime_percentage, tags, installed_at
) VALUES
-- Ahmedabad Cameras
('c1000000-0000-0000-0000-000000000001', 'CAM-AMD-001', 'SG Highway Iskcon Flyover Junction', 'ANPR', 'ONLINE', '11111111-1111-1111-1111-111111111111', 23.0285, 72.5068, 55.0, 'SG Highway Iskcon Circle', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380015', '10.120.10.1', '00:1A:2B:3C:4D:01', 'rtsp://admin:pass@10.120.10.1:554/live/ch0', '4K (3840x2160)', 30, 'H.265', 120, 50, true, 99.8, ARRAY['ANPR', 'SG_Highway', 'Traffic'], '2025-01-15'),
('c1000000-0000-0000-0000-000000000002', 'CAM-AMD-002', 'Law Garden Traffic Square', 'PTZ', 'ONLINE', '11111111-1111-1111-1111-111111111111', 23.0248, 72.5592, 53.0, 'Law Garden Circle', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380006', '10.120.10.2', '00:1A:2B:3C:4D:02', 'rtsp://admin:pass@10.120.10.2:554/live/ch0', '1080p', 30, 'H.264', 360, 40, true, 99.1, ARRAY['PTZ', 'Public_Safety'], '2025-02-01'),
('c1000000-0000-0000-0000-000000000003', 'CAM-AMD-003', 'Kalupur Railway Station Main Gate', 'MULTI_SENSOR', 'WARNING', '11111111-1111-1111-1111-111111111111', 23.0292, 72.6011, 50.0, 'Kalupur Railway Station Road', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380002', '10.120.10.3', '00:1A:2B:3C:4D:03', 'rtsp://admin:pass@10.120.10.3:554/live/ch0', '4K (3840x2160)', 25, 'H.265', 180, 60, false, 94.2, ARRAY['Transit', 'High_Crowd'], '2025-01-10'),
('c1000000-0000-0000-0000-000000000004', 'CAM-AMD-004', 'Sabarmati Riverfront Promenade North', 'THERMAL', 'OFFLINE', '11111111-1111-1111-1111-111111111111', 23.0512, 72.5834, 52.0, 'Riverfront West Promenade', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380013', '10.120.10.4', '00:1A:2B:3C:4D:04', 'rtsp://admin:pass@10.120.10.4:554/live/ch0', '1080p', 15, 'H.264', 90, 100, false, 82.5, ARRAY['Riverfront', 'Thermal', 'Perimeter'], '2024-11-20'),
('c1000000-0000-0000-0000-000000000005', 'CAM-AMD-005', 'Ellisbridge Police Chowki Outer', 'DOME', 'MAINTENANCE', '11111111-1111-1111-1111-111111111111', 23.0234, 72.5712, 51.0, 'Ellisbridge Circle', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380006', '10.120.10.5', '00:1A:2B:3C:4D:05', 'rtsp://admin:pass@10.120.10.5:554/live/ch0', '1080p', 30, 'H.264', 110, 30, false, 90.0, ARRAY['Dome', 'Police_Chowki'], '2025-03-12'),

-- Gandhinagar Cameras
('c2000000-0000-0000-0000-000000000001', 'CAM-GND-001', 'CH-0 Circle Secretariat Gate 1', 'ANPR', 'ONLINE', '22222222-2222-2222-2222-222222222222', 23.2156, 72.6369, 80.0, 'CH-0 Highway Secretariat Entry', 'Gandhinagar', 'Gandhinagar', 'Gujarat', '382010', '10.130.20.1', '00:1A:2B:3C:4E:01', 'rtsp://admin:pass@10.130.20.1:554/live/ch0', '4K (3840x2160)', 30, 'H.265', 120, 50, true, 99.9, ARRAY['Secretariat', 'VVIP', 'ANPR'], '2025-01-01'),
('c2000000-0000-0000-0000-000000000002', 'CAM-GND-002', 'GH-5 Circle Capital Highway', 'PTZ', 'ONLINE', '22222222-2222-2222-2222-222222222222', 23.2294, 72.6481, 82.0, 'GH-5 Square Central Road', 'Gandhinagar', 'Gandhinagar', 'Gujarat', '382016', '10.130.20.2', '00:1A:2B:3C:4E:02', 'rtsp://admin:pass@10.130.20.2:554/live/ch0', '1080p', 30, 'H.264', 360, 45, true, 99.4, ARRAY['PTZ', 'Smart_City'], '2025-02-10'),
('c2000000-0000-0000-0000-000000000003', 'CAM-GND-003', 'GIFT City Main Boulevard North', 'FIXED', 'ONLINE', '22222222-2222-2222-2222-222222222222', 23.1610, 72.6842, 75.0, 'GIFT City Tower 1 Crossing', 'Gandhinagar', 'Gandhinagar', 'Gujarat', '382355', '10.130.20.3', '00:1A:2B:3C:4E:03', 'rtsp://admin:pass@10.130.20.3:554/live/ch0', '4K (3840x2160)', 30, 'H.265', 100, 40, false, 99.7, ARRAY['GIFT_City', 'Financial_Hub'], '2025-01-20'),

-- Surat Cameras
('c3000000-0000-0000-0000-000000000001', 'CAM-SRT-001', 'Dumas Beach Entry Point', 'PTZ', 'ONLINE', '33333333-3333-3333-3333-333333333333', 21.0742, 72.7120, 10.0, 'Dumas Main Coastal Road', 'Surat', 'Surat', 'Gujarat', '395007', '10.140.30.1', '00:1A:2B:3C:4F:01', 'rtsp://admin:pass@10.140.30.1:554/live/ch0', '1080p', 30, 'H.264', 360, 50, true, 98.6, ARRAY['Coastal', 'Tourist'], '2025-02-15'),
('c3000000-0000-0000-0000-000000000002', 'CAM-SRT-002', 'Textile Market Ring Road Junction', 'ANPR', 'WARNING', '33333333-3333-3333-3333-333333333333', 21.1959, 72.8302, 18.0, 'Ring Road Flyover Junction', 'Surat', 'Surat', 'Gujarat', '395002', '10.140.30.2', '00:1A:2B:3C:4F:02', 'rtsp://admin:pass@10.140.30.2:554/live/ch0', '4K (3840x2160)', 25, 'H.265', 120, 35, false, 95.8, ARRAY['Textile_Market', 'High_Density'], '2025-01-25')
ON CONFLICT (code) DO NOTHING;

-- 4. Camera Health Records
INSERT INTO camera_health (camera_id, status, latency_ms, packet_loss_rate, cpu_usage_percent, memory_usage_percent, storage_usage_percent, temperature_celsius, error_message) VALUES
('c1000000-0000-0000-0000-000000000001', 'ONLINE', 12, 0.0, 22.4, 38.1, 55.0, 41.2, NULL),
('c1000000-0000-0000-0000-000000000002', 'ONLINE', 16, 0.1, 28.0, 42.5, 62.0, 43.5, NULL),
('c1000000-0000-0000-0000-000000000003', 'WARNING', 185, 4.2, 88.5, 91.2, 89.0, 58.4, 'High network latency & memory usage threshold breach'),
('c1000000-0000-0000-0000-000000000004', 'OFFLINE', 0, 100.0, 0.0, 0.0, 0.0, 0.0, 'RTSP stream buffer heartbeat timeout'),
('c1000000-0000-0000-0000-000000000005', 'MAINTENANCE', 0, 0.0, 5.0, 12.0, 10.0, 30.0, 'Scheduled firmware upgrade in progress');

-- 5. Coverage Zones (Gujarat Polygons)
INSERT INTO coverage_zones (id, code, name, district, city, state, target_camera_density, area_sq_km, boundary_geom) VALUES
('z1000000-0000-0000-0000-000000000001', 'ZONE-AMD-WEST', 'Ahmedabad West Commercial Sector', 'Ahmedabad', 'Ahmedabad', 'Gujarat', 6.0, 15.4, ST_GeomFromText('POLYGON((72.50 23.01, 72.58 23.01, 72.58 23.06, 72.50 23.06, 72.50 23.01))', 4326)),
('z2000000-0000-0000-0000-000000000001', 'ZONE-GND-CAPITAL', 'Gandhinagar Administrative Corridor', 'Gandhinagar', 'Gandhinagar', 'Gujarat', 8.0, 12.0, ST_GeomFromText('POLYGON((72.62 23.20, 72.67 23.20, 72.67 23.25, 72.62 23.25, 72.62 23.20))', 4326)),
('z3000000-0000-0000-0000-000000000001', 'ZONE-SRT-RING', 'Surat Commercial Ring Road Zone', 'Surat', 'Surat', 'Gujarat', 5.0, 18.2, ST_GeomFromText('POLYGON((72.80 21.15, 72.86 21.15, 72.86 21.22, 72.80 21.22, 72.80 21.15))', 4326))
ON CONFLICT (code) DO NOTHING;

-- 6. Execute Gap Recalculation Procedure
SELECT rpc_recalculate_zone_gaps();

-- 7. Audit Logs
INSERT INTO audit_logs (actor_id, actor_name, actor_role, actor_department_id, action, target_entity, target_id, ip_address, metadata_diff) VALUES
('a1111111-1111-1111-1111-111111111111', 'Vikramaditya Sharma', 'SUPER_ADMIN', '44444444-4444-4444-4444-444444444444', 'INITIALIZE_SCHEMA', 'system', 'postgis_v1', '10.0.0.1', '{"status": "initialized", "version": "1.0.0"}'::jsonb),
('a3333333-3333-3333-3333-333333333333', 'Rajesh Shah', 'DEPARTMENT_ADMIN', '11111111-1111-1111-1111-111111111111', 'CREATE_CAMERA', 'cameras', 'c1000000-0000-0000-0000-000000000001', '10.120.0.45', '{"code": "CAM-AMD-001", "name": "SG Highway Iskcon Flyover Junction", "status": "ONLINE"}'::jsonb),
('a4444444-4444-4444-4444-444444444444', 'Priya Joshi', 'OPERATOR', '11111111-1111-1111-1111-111111111111', 'UPDATE_STATUS', 'cameras', 'c1000000-0000-0000-0000-000000000003', '10.120.0.52', '{"old_status": "ONLINE", "new_status": "WARNING", "reason": "High latency alert"}'::jsonb);
