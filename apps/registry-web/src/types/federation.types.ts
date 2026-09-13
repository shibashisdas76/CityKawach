/**
 * Model 3: VMS Federation & Middleware Frontend Types
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

export interface VmsPlatform {
  id: string;
  name: string;
  vendor: VmsVendor;
  vendorName: string;
  departmentId: string;
  departmentName: string;
  district: string;
  status: VmsPlatformStatus;
  protocol: string;
  apiVersion: string;
  apiBaseUrl: string;
  syncedCamerasCount: number;
  totalAlarms24h: number;
  latencyMs: number;
  packetLossPercent: number;
  uptimePercentage: number;
  lastHeartbeat: string;
  capabilities: VmsCapabilities;
  colorTheme?: string;
}

export interface FederatedCamera {
  id: string;
  number?: number;
  name: string;
  location: string;
  district: string;
  department: string;
  departmentName?: string;
  sourceVmsId: string;
  sourceVmsVendor: VmsVendor;
  sourceVmsName: string;
  vmsCameraCode?: string;
  codec: string;
  resolution?: string;
  fps?: number;
  bitrate_kbps?: number;
  live: boolean;
  hls_url: string;
  hls_live_url?: string;
  rtsp_url: string;
  webrtc_url: string;
  ptzCapable?: boolean;
}

export interface VmsEventEnvelope {
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

export interface CorrelatedIncident {
  id: number | string;
  incidentCode: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  leadDepartment: string;
  involvedVmsIds: string[];
  involvedVendors: VmsVendor[];
  involvedCameras: string[];
  triggerEvents: VmsEventEnvelope[];
  correlationScore: number;
  timeWindowSeconds: number;
  firstEventTimestamp: string;
  lastEventTimestamp: string;
  estimatedEtaMinutes?: number;
  recommendedAction: string;
  resolvedBy?: string;
  actionNotes?: string;
  dispatchedUnits?: string[];
  graphData: {
    nodes: CorrelationGraphNode[];
    edges: CorrelationGraphEdge[];
  };
  createdAt: string;
  resolvedAt?: string;
}

export interface CorrelationRule {
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

export interface VmsPluginSpec {
  frameworkVersion: string;
  standardProtocols: string[];
  supportedVendors: string[];
  lifecycleHooks: string[];
  jsonSchema: Record<string, any>;
  samplePluginConfig: Record<string, any>;
}

export interface VmsTestStepResult {
  step: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  durationMs: number;
  details: string;
}

export interface VmsComplianceTestReport {
  vmsId: string;
  vendor: VmsVendor;
  name: string;
  status: string;
  overallCompliance: string;
  latencyMs: number;
  steps: VmsTestStepResult[];
  testedAt: string;
}

export interface FederatedAnalyticsReport {
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
