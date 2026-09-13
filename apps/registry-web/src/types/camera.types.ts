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

// ============================================================
// MODEL 4 — CENTRAL VMS TYPES
// ============================================================

export interface SentinelCamera {
  id: string;
  number: number;
  name: string;
  location: string;
  codec: string;
  live: boolean;
  width: number;
  height: number;
  fps: number;
  bitrate_kbps: number;
  bits_per_pixel: number;
  rtsp_url: string;
  webrtc_url: string;
  hls_live_url: string;
  hls_url?: string;
  // Enriched fields
  latitude?: number;
  longitude?: number;
  department?: string;
  district?: string;
  ai_active?: boolean;
  analytics?: StreamAnalytics;
}

export interface StreamAnalytics {
  crowdDensity: number;       // 0-1
  vehicleCount: number;
  motionLevel: number;         // 0-1
  anomalyScore: number;        // 0-1
  lastUpdated: string;
}

export interface AnprDetection {
  id: string;
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  plate: string;
  confidence: number;          // 0-1
  timestamp: string;
  vehicleType: 'CAR' | 'TRUCK' | 'BUS' | 'BIKE' | 'AUTO';
  vehicleColor?: string;
  watchlistHit: boolean;
  vahanData?: VahanRecord;
  imageSnapshot?: string;       // base64 or URL
}

export interface VahanRecord {
  plate: string;
  ownerName: string;
  vehicleClass: string;
  fuelType: string;
  registrationDate: string;
  insuranceValid: boolean;
  fitnessValid: boolean;
  financerName?: string;
  blacklisted: boolean;
  challanCount: number;
}

export interface VehicleTrack {
  id: string;
  plate: string;
  sightings: VehicleSighting[];
  totalDistance: number;        // km
  routePolyline?: [number, number][];
  firstSeen: string;
  lastSeen: string;
  status: 'MOVING' | 'STATIONARY' | 'LOST';
}

export interface VehicleSighting {
  cameraId: string;
  cameraName: string;
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  direction?: string;
  speed?: number;               // km/h estimate
}

export interface AiAnalyticsEvent {
  id: string;
  cameraId: string;
  cameraLocation: string;
  eventType: 'CROWD_SURGE' | 'VEHICLE_WRONG_WAY' | 'ABANDONED_OBJECT' | 'FIRE_SMOKE' | 'INTRUSION' | 'FIGHT_DETECTED' | 'VEHICLE_SPEEDING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  confidence: number;
  description: string;
  resolved: boolean;
}

export interface StorageTier {
  name: 'HOT' | 'WARM' | 'COLD';
  technology: string;
  retentionDays: number;
  capacityTB: number;
  usedTB: number;
  costPerTBMonth: number;
  accessLatency: string;
  cameras: number;
}

export interface IntegrationEndpoint {
  id: string;
  name: string;
  system: 'VAHAN' | 'SARTHI' | 'EGUJCOP' | 'AFIS' | 'NAFIS' | 'CCTNS';
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  latencyMs: number;
  queryRate: number;            // queries/min
  lastSync: string;
  apiVersion: string;
  description: string;
}

export interface DrNode {
  id: string;
  name: string;
  type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  location: string;
  status: 'ACTIVE' | 'STANDBY' | 'FAILED';
  rpoMinutes: number;
  rtoMinutes: number;
  lastFailoverTest: string;
}