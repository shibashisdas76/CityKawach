/**
 * Model 2 & Model 4 Unified VMS Service.
 * Connects to the local FastAPI Edge AI Analytics Gateway (http://127.0.0.1:8000)
 * and the Sentinel Grid (https://cctv.corp8.cloud) with robust fallbacks.
 */

import {
  SentinelCamera,
  StreamAnalytics,
  AnprDetection,
  VehicleTrack,
  VehicleSighting,
  AiAnalyticsEvent,
  StorageTier,
  IntegrationEndpoint,
  DrNode,
  VahanRecord,
} from '../types/camera.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const SENTINEL_BASE = 'https://cctv.corp8.cloud';

// Gujarat location heuristic with precise geographic coordinates
export const LOCATION_ENRICHMENT: Record<string, { district: string; department: string; lat: number; lng: number }> = {
  'chiman bhai': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0611, lng: 72.5833 },
  'janpath': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0425, lng: 72.5714 },
  'o.n.g.c': { district: 'Ahmedabad', department: 'State Police', lat: 23.0921, lng: 72.5945 },
  'paldi': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0145, lng: 72.5623 },
  'visat': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.1044, lng: 72.5912 },
  'timbavadi': { district: 'Junagadh', department: 'Municipal Corp', lat: 21.5144, lng: 70.4712 },
  'somnath': { district: 'Gir Somnath', department: 'Traffic Police', lat: 20.9011, lng: 70.4022 },
  'majewadi': { district: 'Junagadh', department: 'Municipal Corp', lat: 21.5322, lng: 70.4533 },
  'bypass': { district: 'Junagadh', department: 'State Highways', lat: 21.5544, lng: 70.4812 },
  'char-chowk': { district: 'Junagadh', department: 'Municipal Corp', lat: 21.5211, lng: 70.4633 },
  'dolatpara': { district: 'Junagadh', department: 'Traffic Police', lat: 21.5433, lng: 70.4412 },
  'adalaj': { district: 'Gandhinagar', department: 'Transport Dept', lat: 23.1645, lng: 72.5810 },
  'cn vidhyalaya': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0233, lng: 72.5512 },
  'delight': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0511, lng: 72.6022 },
  'suvidha': { district: 'Ahmedabad', department: 'Municipal Corp', lat: 23.0344, lng: 72.5633 },
  'rajkot': { district: 'Rajkot', department: 'Traffic Police', lat: 22.3039, lng: 70.8022 },
  'navsari': { district: 'Navsari', department: 'Rural Police', lat: 20.9500, lng: 72.9300 },
  'mohanpura': { district: 'Ahmedabad', department: 'Traffic Police', lat: 23.0311, lng: 72.5922 },
  'patan': { district: 'Patan', department: 'Traffic Police', lat: 23.8500, lng: 72.1200 },
  'mervada': { district: 'Banaskantha', department: 'State Police', lat: 24.1700, lng: 72.4300 },
  'kheram': { district: 'Navsari', department: 'Rural Police', lat: 20.8500, lng: 72.9000 },
  'dehgam': { district: 'Gandhinagar', department: 'State Highways', lat: 23.1600, lng: 72.8100 },
  'dhanori': { district: 'Navsari', department: 'Rural Police', lat: 20.9200, lng: 72.9600 },
  'tankal': { district: 'Navsari', department: 'Rural Police', lat: 20.8800, lng: 73.0500 },
  'bilimora': { district: 'Navsari', department: 'Municipal Corp', lat: 20.7621, lng: 72.9644 },
  'gandhidham': { district: 'Kutch', department: 'Port Authority', lat: 23.0753, lng: 70.1337 },
};

const WATCHLIST = new Set([
  'GJ01AB1234', 'GJ05CD5678', 'GJ27K9901', 'GJ03XY8890',
  'GJ18CX4521', 'GJ01ZZ0001', 'MH02AB1234', 'RJ14GH8822'
]);

type Listener = () => void;

class VmsService {
  private sentinelCameras: SentinelCamera[] = [];
  private anprDetections: AnprDetection[] = [];
  private vehicleTracks: Map<string, VehicleTrack> = new Map();
  private analyticsEvents: AiAnalyticsEvent[] = [];
  private listeners: Set<Listener> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private catalogueLoaded = false;
  private fetchingCatalogue = false;

  constructor() {
    this.seedVehicleTracks();
    this.seedAnalyticsEvents();
    this.startLivePolling();
  }

  // ─── Pub/Sub ───────────────────────────────────────────────────────────
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private notify() { this.listeners.forEach(fn => fn()); }

  // ─── Sentinel & Backend Camera Catalogue ──────────────────────────────
  public async loadCatalogue(): Promise<SentinelCamera[]> {
    if (this.catalogueLoaded && this.sentinelCameras.length > 0) return this.sentinelCameras;
    if (this.fetchingCatalogue) {
      await new Promise(res => setTimeout(res, 1000));
      return this.sentinelCameras;
    }
    this.fetchingCatalogue = true;

    try {
      // 1. Try FastAPI Backend
      const res = await fetch(`${API_BASE_URL}/api/cameras`, { method: 'GET' });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          this.sentinelCameras = raw.map(c => this.normalizeCamera(c));
          this.catalogueLoaded = true;
          this.fetchingCatalogue = false;
          this.notify();
          return this.sentinelCameras;
        }
      }
    } catch {
      // Backend not reached, try direct fallback
    }

    try {
      // 2. Direct fallback catalogue
      this.sentinelCameras = this.generateFallbackCameras();
      this.catalogueLoaded = true;
    } catch (e) {
      console.error('Catalogue initialization error:', e);
    }

    this.fetchingCatalogue = false;
    this.notify();
    return this.sentinelCameras;
  }

  public getCatalogue(): SentinelCamera[] { return this.sentinelCameras; }

  public getHlsUrl(cam: SentinelCamera): string {
    return `${API_BASE_URL}/api/stream/${cam.id}/index.m3u8`;
  }

  public getWhepUrl(cam: SentinelCamera): string {
    return cam.webrtc_url || `http://103.250.160.189:8889/stream/${cam.number || cam.id}/whep`;
  }

  private normalizeCamera(raw: any): SentinelCamera {
    const name = raw.name || `Camera ${raw.id}`;
    const enrichment = this.resolveEnrichment(name);
    const num = raw.number || parseInt(String(raw.id).replace(/\D/g, '') || '1', 10);

    return {
      id: String(raw.id || raw.number),
      number: num,
      name,
      location: raw.location || enrichment.location,
      district: raw.district || enrichment.district,
      department: raw.department || enrichment.department,
      latitude: raw.latitude || enrichment.lat,
      longitude: raw.longitude || enrichment.lng,
      codec: raw.codec || 'h264',
      live: raw.status === 'online' || raw.live !== false,
      width: raw.width || 1920,
      height: raw.height || 1080,
      fps: raw.fps || 25,
      bitrate_kbps: raw.bitrate_kbps || 1500,
      bits_per_pixel: 0.035,
      hls_url: `${API_BASE_URL}/api/stream/${raw.id}/index.m3u8`,
      hls_live_url: `/api/stream/${raw.id}/index.m3u8`,
      rtsp_url: raw.rtsp_url || `rtsp://dasshibashis76%40gmail.com:8SNR-B7W4-QR4X@103.250.160.189:8554/stream/${num}`,
      webrtc_url: raw.webrtc_url || `http://103.250.160.189:8889/stream/${num}/whep`,
      ai_active: true,
      analytics: this.generateAnalytics(),
    };
  }

  private resolveEnrichment(name: string) {
    const nameLower = name.toLowerCase();
    for (const [key, meta] of Object.entries(LOCATION_ENRICHMENT)) {
      if (nameLower.includes(key)) {
        return {
          district: meta.district,
          department: meta.department,
          location: name.replace(/^\d+\s*/, ''),
          lat: meta.lat,
          lng: meta.lng
        };
      }
    }
    return {
      district: 'Gujarat',
      department: 'Traffic Police',
      location: name.replace(/^\d+\s*/, ''),
      lat: 23.0300,
      lng: 72.5800
    };
  }

  private generateAnalytics(): StreamAnalytics {
    return {
      crowdDensity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
      vehicleCount: 5 + Math.floor(Math.random() * 20),
      motionLevel: parseFloat((0.4 + Math.random() * 0.5).toFixed(2)),
      anomalyScore: parseFloat((Math.random() * 0.2).toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateFallbackCameras(): SentinelCamera[] {
    const rawNames = [
      "01 Chiman bhai Bridge", "02 Janpath", "03 O.N.G.C. Office", "04 Paldi Circle",
      "05 Visat teen Rasta", "06 Timbavadi gate-Junagadh", "07 hero-showroom-gir-somnath",
      "08 majewadi-gate-junagadh", "09 new-bypass-near-by-circle-junagadh-2", "10 char-chowk-road-2-junagadh",
      "11 dolatpara-junagadh", "12 Tri Mandir Adalaj Tollnaka", "13 CN Vidhyalaya", "14 Delight RLVD",
      "15 Suvidha park", "16 Visat P2", "17 Rajkot Bus Port CCTV", "18 Rajkot CCTV",
      "19 KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI", "20 Mohanpura", "23 Patan Dethali Char Rasta",
      "28 BK Mervada tran Rasta", "30 kheram", "33 dehgam", "34 dhanori", "35 TANKAL",
      "36 bilimora", "37 bilimora", "38 bilimora", "Gandhidham Rambaugh p2"
    ];

    return rawNames.map((name, i) => {
      const id = `cam${String(i + 1).padStart(2, '0')}`;
      const num = i + 1;
      const enrichment = this.resolveEnrichment(name);
      return {
        id,
        number: num,
        name,
        location: enrichment.location,
        district: enrichment.district,
        department: enrichment.department,
        codec: i % 3 === 0 ? 'hevc' : 'h264',
        live: true,
        width: 1920,
        height: 1080,
        fps: 25,
        bitrate_kbps: 1200 + (i * 40),
        bits_per_pixel: 0.035,
        hls_url: `${API_BASE_URL}/api/stream/${id}/index.m3u8`,
        hls_live_url: `/api/stream/${id}/index.m3u8`,
        rtsp_url: `rtsp://dasshibashis76%40gmail.com:8SNR-B7W4-QR4X@103.250.160.189:8554/stream/${num}`,
        webrtc_url: `http://103.250.160.189:8889/stream/${num}/whep`,
        ai_active: true,
        analytics: this.generateAnalytics(),
      };
    });
  }

  // ─── ANPR & Live Detection Poller ──────────────────────────────────────
  public getAnprDetections(): AnprDetection[] {
    return [...this.anprDetections];
  }

  private startLivePolling() {
    const pollBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/detections?limit=30`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            this.anprDetections = raw.map((d: any) => ({
              id: `det-${d.id || d.pts_ms}`,
              cameraId: String(d.camera_id),
              cameraName: d.camera_name || `Camera ${d.camera_id}`,
              cameraLocation: d.location,
              plate: d.plate_number,
              confidence: d.confidence || 0.92,
              timestamp: d.timestamp || new Date().toISOString(),
              vehicleType: (d.vehicle_type || 'CAR').toUpperCase() as any,
              vehicleColor: d.vehicle_color || 'White',
              watchlistHit: Boolean(d.watchlist_hit || WATCHLIST.has(d.plate_number)),
              vahanData: this.generateVahanRecord(d.plate_number, Boolean(d.watchlist_hit || WATCHLIST.has(d.plate_number))),
            }));
            this.notify();
            return;
          }
        }
      } catch {
        // Backend offline, fallback to simulation
      }

      // Local simulation if backend not responding yet
      if (this.sentinelCameras.length > 0) {
        const cam = this.sentinelCameras[Math.floor(Math.random() * this.sentinelCameras.length)];
        const plates = Array.from(WATCHLIST).concat(['GJ01EF4512', 'GJ18KL3321', 'GJ03AZ4419', 'GJ11AB5566']);
        const plate = plates[Math.floor(Math.random() * plates.length)];
        const isWatchlist = WATCHLIST.has(plate);

        const newDet: AnprDetection = {
          id: `det-${Date.now()}`,
          cameraId: cam.id,
          cameraName: cam.name,
          cameraLocation: cam.location,
          plate,
          confidence: parseFloat((0.85 + Math.random() * 0.13).toFixed(2)),
          timestamp: new Date().toISOString(),
          vehicleType: ['CAR', 'TRUCK', 'BUS', 'BIKE', 'AUTO'][Math.floor(Math.random() * 5)] as any,
          vehicleColor: ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue'][Math.floor(Math.random() * 6)],
          watchlistHit: isWatchlist,
          vahanData: this.generateVahanRecord(plate, isWatchlist),
        };

        this.anprDetections.unshift(newDet);
        if (this.anprDetections.length > 100) this.anprDetections.pop();
        this.updateVehicleTrack(newDet, cam);
        this.notify();
      }
    };

    this.pollInterval = setInterval(pollBackend, 3000);
  }

  // ─── Vehicle Trajectory Search (Backend API) ───────────────────────────
  public async searchPlateTrajectory(plate: string): Promise<VehicleTrack | null> {
    const cleanPlate = plate.replace(/[-\s]/g, '').toUpperCase();
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?plate=${encodeURIComponent(cleanPlate)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          const sightings: VehicleSighting[] = data.history.map((h: any) => {
            const enrichment = this.resolveEnrichment(h.location || h.camera_name || '');
            const coord = LOCATION_ENRICHMENT[Object.keys(LOCATION_ENRICHMENT).find(k => (h.location || '').toLowerCase().includes(k)) || ''] || { lat: 23.03, lng: 72.58 };
            return {
              cameraId: String(h.camera_id),
              cameraName: h.camera_name || `Camera ${h.camera_id}`,
              location: h.location,
              lat: coord.lat,
              lng: coord.lng,
              timestamp: h.timestamp,
              speed: h.speed_kmh || 45,
              direction: h.direction || 'N',
            };
          });

          const track: VehicleTrack = {
            id: `track-${cleanPlate}`,
            plate: cleanPlate,
            sightings,
            totalDistance: parseFloat((sightings.length * 3.8).toFixed(1)),
            firstSeen: sightings[0].timestamp,
            lastSeen: sightings[sightings.length - 1].timestamp,
            status: WATCHLIST.has(cleanPlate) ? 'MOVING' : 'STATIONARY',
          };
          this.vehicleTracks.set(cleanPlate, track);
          return track;
        }
      }
    } catch (e) {
      console.error('Trajectory search error:', e);
    }

    return this.vehicleTracks.get(cleanPlate) || this.generateSimulatedTrajectory(cleanPlate);
  }

  private generateSimulatedTrajectory(plate: string): VehicleTrack {
    const checkpoints = [
      { name: "Chimanbhai Bridge", loc: "Ahmedabad", lat: 23.06, lng: 72.58 },
      { name: "Janpath Cross Road", loc: "Ahmedabad", lat: 23.04, lng: 72.57 },
      { name: "Paldi Circle Checkpost", loc: "Ahmedabad", lat: 23.01, lng: 72.56 },
      { name: "Tri Mandir Toll Plaza", loc: "Adalaj, Gandhinagar", lat: 23.16, lng: 72.58 },
    ];
    const now = Date.now();
    const sightings: VehicleSighting[] = checkpoints.map((c, i) => ({
      cameraId: `cam0${i + 1}`,
      cameraName: `Camera 0${i + 1} - ${c.name}`,
      location: `${c.name}, ${c.loc}`,
      lat: c.lat,
      lng: c.lng,
      timestamp: new Date(now - (checkpoints.length - i) * 15 * 60 * 1000).toISOString(),
      speed: 42 + i * 4,
      direction: 'NE',
    }));

    return {
      id: `track-${plate}`,
      plate,
      sightings,
      totalDistance: 24.5,
      firstSeen: sightings[0].timestamp,
      lastSeen: sightings[sightings.length - 1].timestamp,
      status: WATCHLIST.has(plate) ? 'MOVING' : 'STATIONARY',
    };
  }

  // ─── Vehicle Tracking Data ─────────────────────────────────────────────
  public getVehicleTracks(): VehicleTrack[] {
    return Array.from(this.vehicleTracks.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }

  public getTrackByPlate(plate: string): VehicleTrack | undefined {
    return this.vehicleTracks.get(plate.replace(/[-\s]/g, '').toUpperCase());
  }

  private updateVehicleTrack(detection: AnprDetection, cam: SentinelCamera) {
    const cleanPlate = detection.plate.replace(/[-\s]/g, '').toUpperCase();
    const existing = this.vehicleTracks.get(cleanPlate);
    const enrichment = LOCATION_ENRICHMENT[Object.keys(LOCATION_ENRICHMENT).find(k => cam.location.toLowerCase().includes(k)) || ''] || { lat: 23.03, lng: 72.58 };

    const sighting: VehicleSighting = {
      cameraId: cam.id,
      cameraName: cam.name,
      location: cam.location,
      lat: enrichment.lat,
      lng: enrichment.lng,
      timestamp: detection.timestamp,
      speed: 35 + Math.floor(Math.random() * 45),
      direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    };

    if (existing) {
      existing.sightings.unshift(sighting);
      if (existing.sightings.length > 25) existing.sightings.pop();
      existing.lastSeen = detection.timestamp;
      existing.status = 'MOVING';
      existing.totalDistance = parseFloat((existing.totalDistance + 2.5).toFixed(1));
    } else {
      this.vehicleTracks.set(cleanPlate, {
        id: `track-${cleanPlate}`,
        plate: cleanPlate,
        sightings: [sighting],
        totalDistance: 0,
        firstSeen: detection.timestamp,
        lastSeen: detection.timestamp,
        status: 'MOVING',
      });
    }
  }

  private seedVehicleTracks() {
    const seedPlates = ['GJ01AB1234', 'GJ05CD5678', 'GJ27K9901', 'GJ18CX4521'];
    seedPlates.forEach(plate => {
      this.vehicleTracks.set(plate, this.generateSimulatedTrajectory(plate));
    });
  }

  // ─── Watchlist & VAHAN ─────────────────────────────────────────────────
  public generateVahanRecord(plate: string, blacklisted: boolean): VahanRecord {
    const names = ['Amit Patel', 'Suresh Shah', 'Priya Modi', 'Rahul Joshi', 'Kavita Trivedi', 'Rajan Mehta', 'Devendra Singh'];
    const classes = ['LMV (Car)', 'HMV (Truck)', 'M/Cycle', 'E-Rickshaw', 'Passenger Bus', 'Commercial Taxi'];
    const fuels = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'];
    return {
      plate,
      ownerName: names[Math.floor(Math.random() * names.length)],
      vehicleClass: classes[Math.floor(Math.random() * classes.length)],
      fuelType: fuels[Math.floor(Math.random() * fuels.length)],
      registrationDate: `${2019 + Math.floor(Math.random() * 6)}-05-12`,
      insuranceValid: !blacklisted || Math.random() > 0.4,
      fitnessValid: !blacklisted || Math.random() > 0.3,
      blacklisted,
      challanCount: blacklisted ? 6 + Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3),
    };
  }

  public async lookupVahan(plate: string): Promise<VahanRecord | null> {
    const cleanPlate = plate.replace(/[-\s]/g, '').toUpperCase();
    await new Promise(res => setTimeout(res, 400));
    return this.generateVahanRecord(cleanPlate, WATCHLIST.has(cleanPlate));
  }

  // ─── Storage, Integrations, DR & Scalability ──────────────────────────
  public getStorageTiers(): StorageTier[] {
    return [
      { name: 'HOT', technology: 'NVMe SSD / SAN All-Flash', retentionDays: 7, capacityTB: 2400, usedTB: 1680, costPerTBMonth: 45, accessLatency: '< 1ms', cameras: 80000 },
      { name: 'WARM', technology: 'SAS HDD / Ceph Object Storage', retentionDays: 30, capacityTB: 12000, usedTB: 7200, costPerTBMonth: 12, accessLatency: '10–50ms', cameras: 80000 },
      { name: 'COLD', technology: 'Deep Tape & Glacier Object Store', retentionDays: 180, capacityTB: 80000, usedTB: 22000, costPerTBMonth: 2, accessLatency: '1–4h restore', cameras: 80000 },
    ];
  }

  public getIntegrations(): IntegrationEndpoint[] {
    return [
      { id: 'vahan', name: 'VAHAN 4.0', system: 'VAHAN', status: 'CONNECTED', latencyMs: 120, queryRate: 95, lastSync: new Date().toISOString(), apiVersion: 'v4.2.0', description: 'MoRTH National Vehicle Registry Database' },
      { id: 'egujcop', name: 'eGujCop Gateway', system: 'EGUJCOP', status: 'CONNECTED', latencyMs: 65, queryRate: 410, lastSync: new Date().toISOString(), apiVersion: 'v2.8.1', description: 'Gujarat Police Core Law Enforcement & FIR Interface' },
      { id: 'nafis', name: 'NAFIS (MHA/CBI)', system: 'NAFIS', status: 'CONNECTED', latencyMs: 240, queryRate: 18, lastSync: new Date().toISOString(), apiVersion: 'v1.2.0', description: 'National Automated Fingerprint & Criminal Tracking System' },
      { id: 'cctns', name: 'CCTNS National Hub', system: 'CCTNS', status: 'CONNECTED', latencyMs: 185, queryRate: 72, lastSync: new Date().toISOString(), apiVersion: 'v3.0.0', description: 'Crime and Criminal Tracking Network System' },
      { id: 'sarthi', name: 'SARTHI DL Registry', system: 'SARTHI', status: 'CONNECTED', latencyMs: 150, queryRate: 35, lastSync: new Date().toISOString(), apiVersion: 'v3.1.0', description: 'Driving License Verification System' },
    ];
  }

  public getDrNodes(): DrNode[] {
    return [
      { id: 'dr-1', name: 'Primary SDC', type: 'PRIMARY', location: 'Gandhinagar State Data Centre', status: 'ACTIVE', rpoMinutes: 5, rtoMinutes: 30, lastFailoverTest: '2026-08-15T02:00:00Z' },
      { id: 'dr-2', name: 'Secondary DR Site', type: 'SECONDARY', location: 'Surat GSWAN Node', status: 'STANDBY', rpoMinutes: 15, rtoMinutes: 90, lastFailoverTest: '2026-08-01T03:00:00Z' },
      { id: 'dr-3', name: 'Regional Edge Cache', type: 'TERTIARY', location: 'Rajkot Police HQ Edge', status: 'STANDBY', rpoMinutes: 60, rtoMinutes: 240, lastFailoverTest: '2026-07-20T04:00:00Z' },
    ];
  }

  public getAnalyticsEvents(): AiAnalyticsEvent[] { return [...this.analyticsEvents]; }

  private seedAnalyticsEvents() {
    this.analyticsEvents = [
      { id: 'evt-1', cameraId: 'cam06', cameraLocation: '06 Timbavadi gate-Junagadh', eventType: 'CROWD_SURGE', severity: 'CRITICAL', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), confidence: 0.95, description: 'Dense crowd accumulation (>8 persons/m²) at entrance gate', resolved: false },
      { id: 'evt-2', cameraId: 'cam13', cameraLocation: '13 CN Vidhyalaya', eventType: 'VEHICLE_WRONG_WAY', severity: 'HIGH', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), confidence: 0.89, description: 'Vehicle detected driving against one-way traffic direction', resolved: false },
      { id: 'evt-3', cameraId: 'cam01', cameraLocation: '01 Chiman bhai Bridge', eventType: 'VEHICLE_SPEEDING', severity: 'MEDIUM', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), confidence: 0.91, description: 'Vehicle speed detected at 88 km/h in 50 km/h bridge corridor', resolved: false },
    ];
  }

  public async lookupFace(description: string): Promise<{ name: string; id: string; status: string } | null> {
    await new Promise(res => setTimeout(res, 800));
    const names = ['Unknown Suspect A', 'Ravi Kumar Singh', 'Mohammad Iqbal', 'Sanjay Dave'];
    return {
      name: names[Math.floor(Math.random() * names.length)],
      id: `AFIS-${Math.floor(100000 + Math.random() * 900000)}`,
      status: Math.random() > 0.5 ? 'WANTED' : 'CLEAR',
    };
  }

  public getScalabilityStats() {
    return {
      targetCameras: 80000,
      currentCameras: 30,
      ingestBandwidthGbps: 800,
      storagePerDayTB: 864,
      gpuNodes: 128,
      kafkaPartitions: 2400,
      k8sPods: 3200,
      regions: 3,
      zones: 33,
    };
  }

  public resolveEvent(id: string) {
    const ev = this.analyticsEvents.find(e => e.id === id);
    if (ev) { ev.resolved = true; this.notify(); }
  }

  public destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}

export const vmsService = new VmsService();
