/**
 * Model 4: Consolidated Central VMS Enterprise Data Contract.
 * Defines shared interfaces for Statewide Video Ingestion, Recording Playback,
 * Multi-Task AI (ANPR, Face Recognition, Crowd Density, Anomalies),
 * Government Integrations (VAHAN, SARTHI, eGujCop, AFIS/NAFIS, CCTNS),
 * Tiered Storage (Hot, Warm, Cold Ceph/S3), 80k Scalability Lab, and Disaster Recovery.
 */

export type StorageTierType = 'HOT' | 'WARM' | 'COLD';
export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AnomalyStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type AnomalyType =
  | 'TRIPWIRE_BREACH'
  | 'WRONG_WAY_DRIVING'
  | 'UNATTENDED_BAGGAGE'
  | 'OVERCROWDING'
  | 'FIRE_SMOKE_HAZARD'
  | 'CAMERA_TAMPERING';

export interface VmsOverviewKpi {
  platform_title: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
  ingestion: {
    total_cameras: number;
    live_cameras: number;
    departments_connected: number;
    protocols_active: string[];
    live_bandwidth_mbps: number;
    frame_rate_avg: number;
  };
  scalability_target: {
    certified_capacity: number;
    target_bandwidth_gbps: number;
    gpu_nodes_dimensioned: number;
    kafka_partitions: number;
  };
  storage: {
    hot_tier_chunks: number;
    warm_tier_chunks: number;
    cold_tier_chunks: number;
    ceph_cluster_status: string;
    s3_worm_retention_days: number;
  };
  ai_multitask: {
    active_anomalies_count: number;
    watchlist_face_hits: number;
    anpr_active: boolean;
    crowd_monitoring_active: boolean;
  };
  disaster_recovery: {
    primary_site: string;
    secondary_site: string;
    replication_rpo_ms: number;
    tested_rto_sec: number;
    health: string;
  };
}

export interface VmsCameraFeed {
  id: string;
  number: number;
  name: string;
  location: string;
  district: string;
  department: string;
  hls_url: string;
  hls_live_url: string;
  rtsp_url: string;
  webrtc_url: string;
  status: 'online' | 'offline';
  live: boolean;
  codec: string;
  resolution: string;
  fps: number;
  bitrate_kbps: number;
}

export interface VideoRecordingChunk {
  id: string;
  camera_id: string;
  camera_name: string;
  location: string;
  start_time: string;
  end_time: string;
  duration_sec: number;
  size_mb: number;
  storage_tier: StorageTierType;
  storage_uri: string;
  codec: string;
  resolution: string;
  fps: number;
  sha256_hash: string;
  encrypted: number;
  bookmarks: string;
}

export interface FaceDetectionEvent {
  id: string;
  camera_id: string;
  camera_name: string;
  location: string;
  timestamp: string;
  pts_ms: number;
  person_name?: string;
  gender?: string;
  estimated_age?: number;
  confidence: number;
  nafis_id?: string;
  criminal_record?: string;
  alert_severity: AnomalySeverity | 'NONE';
  matched_watchlist: number;
  face_bbox?: string;
}

export interface CrowdMetricEvent {
  id?: number;
  camera_id: string;
  camera_name: string;
  location: string;
  timestamp: string;
  pedestrian_count: number;
  vehicle_count: number;
  density_percent: number;
  congestion_level: 'LOW' | 'MODERATE' | 'HIGH';
  overcrowding_alert: number;
  heatmap_data?: string;
}

export interface AnomalyEvent {
  id: string;
  camera_id: string;
  camera_name: string;
  location: string;
  timestamp: string;
  pts_ms: number;
  anomaly_type: AnomalyType;
  title: string;
  description: string;
  severity: AnomalySeverity;
  confidence: number;
  status: AnomalyStatus;
  resolved_by?: string;
  resolution_notes?: string;
  bounding_box?: string;
}

export interface VahanRecordData {
  plate_number: string;
  owner_name: string;
  father_name?: string;
  maker_model: string;
  vehicle_class: string;
  fuel_type: string;
  chassis_number: string;
  engine_number: string;
  registration_date: string;
  fitness_upto: string;
  insurance_valid_upto: string;
  rc_status: string;
  rto_location: string;
  blacklisted: number;
  blacklist_reason?: string;
}

export interface SarthiRecordData {
  dl_number: string;
  holder_name: string;
  father_name?: string;
  date_of_birth: string;
  blood_group?: string;
  license_status: string;
  valid_from: string;
  valid_upto: string;
  endorsements: string;
  issuing_rto: string;
  flagged: number;
  flag_reason?: string;
}

export interface EgujcopRecordData {
  fir_number: string;
  police_station: string;
  district: string;
  crime_type: string;
  ipc_sections: string;
  stolen_vehicle_plate?: string;
  accused_name?: string;
  accused_nafis_id?: string;
  fir_date: string;
  io_name: string;
  status: string;
}

export interface NafisRecordData {
  nafis_id: string;
  person_name: string;
  aliases?: string;
  gender: string;
  age?: number;
  crime_category: string;
  wanted_by_state: string;
  red_corner_alert: number;
  last_known_location?: string;
  fingerprint_pattern?: string;
  face_embedding_hash?: string;
}

export interface IntegrationSyncStatus {
  id: string;
  name: string;
  type: string;
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  latency_ms: number;
  uptime_sla: string;
  queries_today: number;
  last_sync: string;
}

export interface StorageTierSpec {
  tier: StorageTierType;
  name: string;
  technology: string;
  retention_period: string;
  total_capacity_tb: number;
  used_capacity_tb: number;
  usage_pct: number;
  chunk_count: number;
  iops?: number;
  throughput_gbps?: number;
  compliance?: string;
  encryption: string;
}

export interface Scalability80kModel {
  target_camera_capacity: number;
  stream_profiles: Record<string, any>;
  bandwidth: {
    aggregate_ingest_gbps: number;
    peak_burst_headroom_gbps: number;
    backbone_redundancy: string;
    edge_nodes: number;
  };
  ingestion_cluster: {
    technology: string;
    streaming_gateways: number;
    node_spec: string;
    high_availability: string;
  };
  gpu_ai_cluster: {
    framework: string;
    gpu_model: string;
    gpu_count: number;
    models_deployed: Array<{ name: string; latency_ms: number; fps_throughput: number }>;
  };
  message_bus: {
    technology: string;
    brokers: number;
    topic_partitions: number;
    peak_msg_rate_per_sec: number;
    replication_factor: number;
  };
  storage_tiers: Record<string, any>;
  kubernetes_topology: Record<string, any>;
  disaster_recovery: Record<string, any>;
}

export interface LoadTestResult {
  test_id: string;
  simulated_cameras: number;
  test_duration_sec: number;
  timestamp: string;
  status: string;
  metrics: {
    aggregate_ingest_gbps: number;
    packet_loss_percent: number;
    kafka_message_rate_per_sec: number;
    latency_p50_ms: number;
    latency_p95_ms: number;
    latency_p99_ms: number;
    cluster_cpu_utilization_pct: number;
    cluster_gpu_utilization_pct: number;
    gateway_instances_active: number;
    gpu_nodes_allocated: number;
    storage_ingest_rate_tb_per_hour: number;
  };
  sla_verification: {
    max_allowed_p95_latency_ms: number;
    max_allowed_packet_loss_pct: number;
    target_uptime_sla: string;
    verdict: string;
  };
}

export interface DisasterRecoveryStatus {
  topology: string;
  primary_datacenter: {
    name: string;
    role: string;
    nodes_online: number;
    status: string;
    uptime: string;
  };
  disaster_recovery_site: {
    name: string;
    role: string;
    nodes_online: number;
    status: string;
    replication_lag_ms: number;
  };
  sla_metrics: {
    target_rpo_ms: number;
    actual_rpo_ms: number;
    target_rto_sec: number;
    actual_rto_sec: number;
    rpo_compliance: string;
    rto_compliance: string;
  };
  recent_dr_drills: Array<{
    id: string;
    drill_name: string;
    primary_site: string;
    dr_site: string;
    trigger_type: string;
    start_time: string;
    failover_duration_sec: number;
    rpo_achieved_ms: number;
    rto_achieved_sec: number;
    status: string;
    logs: string;
    executed_by: string;
  }>;
}

export interface SecurityAuditStatus {
  zero_trust_architecture: {
    transit_encryption: string;
    at_rest_encryption: string;
    network_segmentation: Array<{ vlan: number; name: string; cidr: string; access: string }>;
    rbac_matrix: Array<{ role: string; permissions: string }>;
  };
  recent_audit_trail: Array<{
    id: string;
    action_type: string;
    actor_id: string;
    actor_name: string;
    actor_role: string;
    resource_id?: string;
    description: string;
    sha256_checksum?: string;
    timestamp: string;
  }>;
}
