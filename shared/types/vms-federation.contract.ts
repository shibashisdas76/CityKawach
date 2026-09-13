/**
 * CCTV Central Platform - Model 3 VMS Federation & Middleware Contract
 * Cross-Departmental Interoperability, Metadata Exchange & Event Correlation
 */

export type VmsVendor =
  | 'MILESTONE_XPROTECT'
  | 'GENETEC_SECURITY_CENTER'
  | 'HIKVISION_HIKCENTRAL'
  | 'DAHUA_DSS'
  | 'HANWHA_WAVE'
  | 'ONVIF_GENERIC';

export type VmsPlatformStatus = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'SYNCING';

export type VmsEventType =
  | 'ANPR_SIGHTING'
  | 'VEHICLE_SPEEDING'
  | 'PERIMETER_INTRUSION'
  | 'CROWD_SURGE'
  | 'FIRE_SMOKE_HAZARD'
  | 'WRONG_WAY_ENTRY'
  | 'ABANDONED_OBJECT'
  | 'CAMERA_TAMPERING'
  | 'OFFLINE_DISCONNECT'
  | 'CROSS_JURISDICTION_BOLO';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface VmsCapabilities {
  ptzControl: boolean;
  liveStreaming: boolean;
  playbackStreaming: boolean;
  edgeAnalyticsPassthrough: boolean;
  alarmTriggering: boolean;
  twoWayAudio: boolean;
  bookmarking: boolean;
}

export interface VmsPlatformContract {
  id: string;
  name: string;
  vendor: VmsVendor;
  vendorName: string;
  departmentId: string;
  departmentName: string;
  district: string;
  status: VmsPlatformStatus;
  protocol: string; // e.g., 'REST + MIP SDK', 'Web SDK v5.12', 'Artemis OpenAPI'
  apiVersion: string;
  apiBaseUrl: string;
  syncedCamerasCount: number;
  totalAlarms24h: number;
  latencyMs: number;
  packetLossPercent: number;
  uptimePercentage: number;
  lastHeartbeat: string;
  capabilities: VmsCapabilities;
  icon?: string;
  colorTheme?: string;
}

export interface VmsCameraMetadataContract {
  id: string;
  vmsCameraId: string;
  sourceVmsId: string;
  sourceVmsVendor: VmsVendor;
  sourceVmsName: string;
  departmentName: string;
  district: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  codec: 'h264' | 'hevc' | 'mjpeg';
  resolution: string;
  fps: number;
  bitrateKbps: number;
  hlsUrl: string;
  rtspUrl: string;
  webrtcUrl: string;
  ptzCapable: boolean;
  lastPtsMs: number;
}

export interface VmsEventEnvelopeContract {
  eventId: string;
  sourceVmsId: string;
  sourceVmsName: string;
  sourceVmsVendor: VmsVendor;
  departmentName: string;
  district: string;
  cameraId: string;
  cameraName: string;
  location: string;
  eventType: VmsEventType;
  severity: IncidentSeverity;
  confidence: number;
  ptsMs: number;
  timestamp: string;
  payload: {
    plateNumber?: string;
    vehicleType?: string;
    speedKmh?: number;
    speedLimit?: number;
    crowdDensity?: number;
    personCount?: number;
    zoneName?: string;
    hazardType?: string;
    watchlistHit?: boolean;
    rawAlarmCode?: string;
    snapshotUrl?: string;
    [key: string]: any;
  };
}

export interface CorrelationGraphNode {
  id: string;
  type: 'EVENT' | 'CAMERA' | 'VMS' | 'TARGET';
  label: string;
  vmsVendor?: VmsVendor;
  department?: string;
  timestamp?: string;
  details?: Record<string, any>;
  status?: string;
}

export interface CorrelationGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationType: 'SPATIAL_PROXIMITY' | 'TEMPORAL_SEQUENCE' | 'IDENTITY_MATCH' | 'ESCALATION_TRIGGER';
  confidence: number;
  timeDeltaSeconds: number;
}

export interface CorrelatedIncidentContract {
  id: string;
  incidentCode: string; // e.g. "CORR-2026-881"
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  leadDepartment: string;
  involvedVmsIds: string[];
  involvedVmsVendors: VmsVendor[];
  involvedCameraIds: string[];
  triggerEvents: VmsEventEnvelopeContract[];
  correlationScore: number; // 0-1
  timeWindowSeconds: number;
  firstEventTimestamp: string;
  lastEventTimestamp: string;
  estimatedInterceptEtaMinutes?: number;
  recommendedAction: string;
  resolvedBy?: string;
  actionNotes?: string;
  dispatchedUnits?: string[];
  graphData: {
    nodes: CorrelationGraphNode[];
    edges: CorrelationGraphEdge[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CorrelationRuleContract {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  category: 'SECURITY' | 'TRAFFIC' | 'DISASTER' | 'SURVEILLANCE';
  primaryTriggerType: VmsEventType;
  secondaryTriggerTypes: VmsEventType[];
  maxTimeWindowSeconds: number;
  maxSpatialDistanceKm: number;
  minConfidence: number;
  severity: IncidentSeverity;
  isActive: boolean;
  triggerCount24h: number;
}

export interface VmsPluginSpecContract {
  pluginId: string;
  vendor: VmsVendor;
  name: string;
  version: string;
  author: string;
  description: string;
  supportedProtocols: string[];
  authSchemes: ('BASIC' | 'BEARER_TOKEN' | 'OAUTH2' | 'CERTIFICATE')[];
  configSchemaJson: Record<string, any>;
  sampleConfig: Record<string, any>;
  complianceScore: number; // e.g. 98.5%
}

export interface FederatedAnalyticsReportContract {
  generatedAt: string;
  reportingPeriod: string;
  totalFederatedVms: number;
  totalFederatedCameras: number;
  totalEventsProcessed24h: number;
  totalCorrelationsTriggered24h: number;
  systemAvailabilitySlaPercent: number;
  meanTimeToResolutionMinutes: number;
  crossVmsLatencyPercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  vendorBreakdown: {
    vendor: VmsVendor;
    vendorName: string;
    cameraCount: number;
    eventCount24h: number;
    avgLatencyMs: number;
    uptimePercent: number;
  }[];
  departmentalIncidentMatrix: {
    department: string;
    criticalIncidents: number;
    highIncidents: number;
    mediumIncidents: number;
    lowIncidents: number;
    avgMttrMinutes: number;
  }[];
  hourlyIncidentVolume: {
    hour: string;
    trafficVms: number;
    policeVms: number;
    municipalVms: number;
    portVms: number;
    correlatedAlerts: number;
  }[];
}
