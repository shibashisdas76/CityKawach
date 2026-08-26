export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN';

export type CameraType =
    | 'FIXED_BULLET'
    | 'FIXED_DOME'
    | 'PTZ'
    | 'ANPR_SPECIAL'
    | 'THERMAL'
    | 'PANORAMIC_360';

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