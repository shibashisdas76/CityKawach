export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN';

export type CameraType =
    | 'FIXED_BULLET'
    | 'FIXED_DOME'
    | 'PTZ'
    | 'ANPR_SPECIAL'
    | 'THERMAL'
    | 'PANORAMIC_360';

export type AICapability = 'ANPR' | 'CROWD_DENSITY' | 'INTRUSION' | 'THERMAL_ANOMALY' | 'FACIAL_RECOG' | 'MOTION_DETECT';

export interface Camera {
    id: string;
    camera_id: string;
    camera_name: string;
    department_id: string;
    departments?: { name: string; code: string };
    camera_type: CameraType;
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    city: string;
    ward: string;
    pin_code: string;
    status: CameraStatus;
    connectivity_type: string;
    storage_type: string;
    resolution: string;
    ip_address?: string;
    rtsp_url?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    retention_days: number;
    installation_date: string;
    created_at: string;
    ai_capabilities?: AICapability[];
    ping_latency_ms?: number;
    stream_status?: 'ACTIVE' | 'BUFFERING' | 'DISCONNECTED';
}

export interface CriticalAlert {
    id: string;
    camera_id: string;
    camera_name: string;
    alert_type: 'ANPR_WATCHLIST_MATCH' | 'CROWD_SURGE_DETECTED' | 'UNAUTHORIZED_INTRUSION' | 'FIRE_SMOKE_HAZARD' | 'OFFLINE_DISCONNECT';
    timestamp: string;
    severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
    resolved: boolean;
    confidence_score?: number;
    bounding_box_details?: string;
}

export interface CoverageZone {
    id: string;
    zone_code: string;
    zone_name: string;
    district: string;
    ward: string;
    priority_level: number;
    target_camera_density: number;
    actual_cameras?: number;
    required_cameras?: number;
    vulnerability_index?: number;
    priority_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}