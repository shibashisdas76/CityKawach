import { Camera, CoverageZone, CriticalAlert } from '../types/camera.types';
import { MOCK_CAMERAS, MOCK_DEPARTMENTS, MOCK_COVERAGE_ZONES, MOCK_AUDIT_LOGS, MOCK_HEALTH_LOGS } from './mockData';
import { supabase } from './supabaseClient';

type Listener = () => void;

class ApiService {
  private cameras: Camera[] = [...MOCK_CAMERAS];
  private departments = [...MOCK_DEPARTMENTS];
  private coverageZones: CoverageZone[] = [...MOCK_COVERAGE_ZONES];
  private auditLogs = [...MOCK_AUDIT_LOGS];
  private healthLogs = { ...MOCK_HEALTH_LOGS };
  private alerts: CriticalAlert[] = [
    {
      id: 'alt-001',
      camera_id: 'GJ-AHM-POL-002',
      camera_name: 'Nehru Bridge East Junction',
      alert_type: 'ANPR_WATCHLIST_MATCH',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      severity: 'CRITICAL',
      resolved: false,
      confidence_score: 0.94,
      bounding_box_details: 'Target License: GJ-01-AB-9988'
    },
    {
      id: 'alt-002',
      camera_id: 'GJ-AHM-POL-001',
      camera_name: 'Income Tax Circle PTZ',
      alert_type: 'CROWD_SURGE_DETECTED',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'HIGH',
      resolved: false,
      confidence_score: 0.88,
      bounding_box_details: 'Est. Density: 8.4 persons/m²'
    }
  ];

  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initRealtimeSupabase();
  }

  // Subscribe to changes
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private async initRealtimeSupabase() {
    try {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cameras' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newCam = payload.new as Camera;
              if (!this.cameras.some((c) => c.id === newCam.id || c.camera_id === newCam.camera_id)) {
                this.cameras.unshift(newCam);
                this.notify();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase Realtime not available, using in-memory reactive state.', e);
    }
  }

  // CAMERAS API
  public getCameras(): Camera[] {
    return [...this.cameras];
  }

  public getCameraById(id: string): Camera | undefined {
    return this.cameras.find((c) => c.id === id || c.camera_id === id);
  }

  public addCamera(camera: Camera): Camera {
    this.cameras.unshift(camera);

    this.logAuditEvent({
      action: 'REGISTER_CAMERA',
      targetEntity: 'cameras',
      targetId: camera.camera_id,
      metadataDiff: { camera_id: camera.camera_id, name: camera.camera_name, status: camera.status }
    });

    this.notify();
    return camera;
  }

  public bulkAddCameras(newCameras: Camera[]): number {
    this.cameras.unshift(...newCameras);

    this.logAuditEvent({
      action: 'BULK_CSV_IMPORT',
      targetEntity: 'cameras',
      targetId: `batch_${newCameras.length}`,
      metadataDiff: { count: newCameras.length }
    });

    this.notify();
    return newCameras.length;
  }

  public updateCameraStatus(id: string, status: Camera['status']): boolean {
    const cam = this.cameras.find((c) => c.id === id || c.camera_id === id);
    if (cam) {
      const oldStatus = cam.status;
      cam.status = status;

      this.logAuditEvent({
        action: 'UPDATE_CAMERA_STATUS',
        targetEntity: 'cameras',
        targetId: cam.camera_id,
        metadataDiff: { from: oldStatus, to: status }
      });

      this.notify();
      return true;
    }
    return false;
  }

  public deleteCamera(id: string): boolean {
    const idx = this.cameras.findIndex((c) => c.id === id || c.camera_id === id);
    if (idx !== -1) {
      const deleted = this.cameras.splice(idx, 1)[0];
      this.logAuditEvent({
        action: 'DELETE_CAMERA',
        targetEntity: 'cameras',
        targetId: deleted.camera_id,
        metadataDiff: { camera_id: deleted.camera_id, name: deleted.camera_name }
      });
      this.notify();
      return true;
    }
    return false;
  }

  // DEPARTMENTS API
  public getDepartments() {
    return [...this.departments];
  }

  // COVERAGE ZONES & VDI GAP ANALYSIS API
  public getCoverageZones(): CoverageZone[] {
    return [...this.coverageZones];
  }

  public recalculateGaps(): CoverageZone[] {
    const updated = this.coverageZones.map((z) => {
      const matchingCams = this.cameras.filter((c) => c.district === z.district);
      const actual = matchingCams.length;
      const required = z.required_cameras || Math.max(1, Math.round(z.target_camera_density * 2));
      const vdi = Math.max(0, Math.min(1, 1.0 - actual / required));

      let tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (vdi > 0.7) tier = 'CRITICAL';
      else if (vdi > 0.4) tier = 'HIGH';
      else if (vdi > 0.2) tier = 'MEDIUM';

      return {
        ...z,
        actual_cameras: actual,
        required_cameras: required,
        vulnerability_index: parseFloat(vdi.toFixed(2)),
        priority_tier: tier
      };
    });

    this.coverageZones = updated;
    this.logAuditEvent({
      action: 'RECALCULATE_VDI_GAPS',
      targetEntity: 'coverage_zones',
      targetId: 'all_zones',
      metadataDiff: { zone_count: updated.length }
    });

    this.notify();
    return [...this.coverageZones];
  }

  // AI & SURVEILLANCE ALERTS API
  public getActiveAlerts(): CriticalAlert[] {
    return [...this.alerts];
  }

  public triggerAiAlert(alert: Omit<CriticalAlert, 'id' | 'timestamp' | 'resolved'>): CriticalAlert {
    const newAlert: CriticalAlert = {
      ...alert,
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.unshift(newAlert);
    this.notify();
    return newAlert;
  }

  public acknowledgeAlert(id: string): boolean {
    const target = this.alerts.find((a) => a.id === id);
    if (target) {
      target.resolved = true;
      this.alerts = this.alerts.filter((a) => a.id !== id);
      this.notify();
      return true;
    }
    return false;
  }

  // AUDIT LOGS API
  public getAuditLogs() {
    return [...this.auditLogs];
  }

  public logAuditEvent(event: {
    action: string;
    targetEntity: string;
    targetId: string;
    metadataDiff: Record<string, any>;
  }) {
    const entry = {
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'user_001',
      actorName: 'State Control Officer',
      actorRole: 'STATE_ADMIN',
      action: event.action,
      targetEntity: event.targetEntity,
      targetId: event.targetId,
      ipAddress: '10.120.0.1',
      metadataDiff: event.metadataDiff
    };

    this.auditLogs.unshift(entry);
  }

  // HEALTH LOGS API
  public getHealthLogs(cameraId: string) {
    return this.healthLogs[cameraId] || [
      {
        id: `h-sim-${Date.now()}`,
        cameraId,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        latencyMs: Math.floor(Math.random() * 15) + 8,
        packetLossRate: 0,
        cpuUsagePercent: Math.floor(Math.random() * 20) + 15,
        memoryUsagePercent: Math.floor(Math.random() * 25) + 30,
        storageUsagePercent: 55,
        temperatureCelsius: 40
      }
    ];
  }
}

export const apiService = new ApiService();
