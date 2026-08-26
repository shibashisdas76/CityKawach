/**
 * CCTV Central Platform - Shared Metadata Contract
 * Module 1 -> Module 2 (Streaming) & Module 3 (Federation) Integration Interface
 */

export type UserRole = 'SUPER_ADMIN' | 'STATE_ADMIN' | 'DEPARTMENT_ADMIN' | 'OPERATOR' | 'VIEWER';

export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'MAINTENANCE';

export type CameraType = 'PTZ' | 'FIXED' | 'DOME' | 'THERMAL' | 'ANPR' | 'MULTI_SENSOR';

export interface CameraLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  address?: string;
  district: string;
  city: string;
  state: string;
  pincode?: string;
}

export interface CameraSpecifications {
  resolution: string; // e.g. "4K (3840x2160)"
  frameRate: number; // fps
  codec: 'H.264' | 'H.265' | 'MJPEG' | 'AV1';
  fieldOfViewDegrees: number;
  nightVisionDistanceMeters: number;
  ipAddress: string;
  macAddress: string;
  rtspUrlTemplate: string;
  ptzSupport: boolean;
}

export interface CameraMetadataContract {
  id: string;
  code: string; // Unique camera identifier e.g. "CAM-AMD-001"
  name: string;
  type: CameraType;
  status: CameraStatus;
  departmentId: string;
  departmentName: string;
  location: CameraLocation;
  specifications: CameraSpecifications;
  installedAt: string; // ISO date
  lastHealthCheckAt: string; // ISO date
  uptimePercentage: number;
  streamingEndpoint?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckRecord {
  id: string;
  cameraId: string;
  timestamp: string;
  status: CameraStatus;
  latencyMs: number;
  packetLossRate: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  storageUsagePercent: number;
  temperatureCelsius: number;
  errorMessage?: string;
}

export interface CoverageZoneContract {
  id: string;
  name: string;
  district: string;
  city: string;
  boundaryGeoJson: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  requiredCameraDensity: number; // per sq km
  areaSqKm: number;
  installedCameraCount: number;
  vulnerabilityDeficitIndex: number; // 0 (Optimal) to 1.0 (Critical Gap)
  tier: 'LOW_DEFICIT' | 'MEDIUM_DEFICIT' | 'HIGH_DEFICIT';
}

export interface AuditLogContract {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorDepartmentId?: string;
  action: string; // e.g., "CREATE_CAMERA", "UPDATE_STATUS", "BULK_IMPORT"
  targetEntity: string; // e.g., "cameras"
  targetId: string;
  ipAddress: string;
  metadataDiff: Record<string, any>;
}
