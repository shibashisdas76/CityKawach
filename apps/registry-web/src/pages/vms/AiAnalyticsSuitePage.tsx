import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Car,
  UserCheck,
  Users,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Search,
  CheckCircle2,
  Filter,
  Eye,
  ArrowRight,
  TrendingUp,
  MapPin,
  Activity,
  Layers,
  Radio
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { FaceDetectionEvent, CrowdMetricEvent, AnomalyEvent } from '../../types/model4.types';

type AiTab = 'ANPR' | 'FACE_RECOGNITION' | 'CROWD_DENSITY' | 'ANOMALIES';

export const AiAnalyticsSuitePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AiTab>('ANPR');
  
  // ANPR state
  const [anprDetections, setAnprDetections] = useState<any[]>([]);
  const [anprSearch, setAnprSearch] = useState('');
  
  // Face Recognition state
  const [faceEvents, setFaceEvents] = useState<FaceDetectionEvent[]>([]);
  const [watchlistOnlyFaces, setWatchlistOnlyFaces] = useState(false);
  const [privacyMaskingEnabled, setPrivacyMaskingEnabled] = useState(true);
  
  // Crowd Density state
  const [crowdMetrics, setCrowdMetrics] = useState<CrowdMetricEvent[]>([]);
  
  // Anomalies state
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolvingOfficer, setResolvingOfficer] = useState('PI K.M. Jadeja');
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      const [faces, crowd, anoms] = await Promise.all([
        model4Service.getFaceDetections(watchlistOnlyFaces),
        model4Service.getCrowdMetrics(),
        model4Service.getAnomalies()
      ]);
      setFaceEvents(faces);
      setCrowdMetrics(crowd);
      setAnomalies(anoms);
      
      // Load ANPR via backend search / default pool
      const mockAnpr = [
        {
          id: "DET-01",
          camera_id: "cam01",
          camera_name: "01 Chiman bhai Bridge",
          location: "Chimanbhai Bridge, Ahmedabad",
          plate_number: "GJ01AB1234",
          vehicle_type: "CAR (Mahindra Scorpio)",
          vehicle_color: "White",
          speed_kmh: 54.2,
          confidence: 0.96,
          pts_ms: 18450.0,
          watchlist_hit: true,
          reason: "Stolen Vehicle (eGujCop FIR #2026/881)",
          timestamp: new Date().toISOString()
        },
        {
          id: "DET-02",
          camera_id: "cam03",
          camera_name: "03 O.N.G.C",
          location: "ONGC Office Circle, Ahmedabad",
          plate_number: "GJ05CD5678",
          vehicle_type: "SUV (Toyota Fortuner)",
          vehicle_color: "Black",
          speed_kmh: 62.1,
          confidence: 0.94,
          pts_ms: 42100.0,
          watchlist_hit: true,
          reason: "NAFIS / Inter-State Smuggling Warrant",
          timestamp: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: "DET-03",
          camera_id: "cam05",
          camera_name: "05 Visat Teen Rasta",
          location: "Visat Teen Rasta, Sabarmati",
          plate_number: "GJ27K9901",
          vehicle_type: "CAR (Maruti Swift)",
          vehicle_color: "Silver",
          speed_kmh: 48.0,
          confidence: 0.91,
          pts_ms: 95300.0,
          watchlist_hit: false,
          reason: "Standard Transit",
          timestamp: new Date(Date.now() - 1200000).toISOString()
        },
        {
          id: "DET-04",
          camera_id: "cam08",
          camera_name: "08 Majewadi Gate",
          location: "Majewadi Gate, Junagadh",
          plate_number: "GJ03XY8890",
          vehicle_type: "SUV (Hyundai Creta)",
          vehicle_color: "Grey",
          speed_kmh: 44.5,
          confidence: 0.92,
          pts_ms: 140200.0,
          watchlist_hit: false,
          reason: "Standard Transit",
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      setAnprDetections(mockAnpr);
    } catch (e) {
      console.error('Error loading AI data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = model4Service.subscribe(loadData);
    return unsub;
  }, [watchlistOnlyFaces]);

  const handleResolveAnomaly = async () => {
    if (!selectedAnomaly) return;
    setResolving(true);
    await model4Service.resolveAnomaly(selectedAnomaly.id, resolvingOfficer, resolveNotes);
    setResolving(false);
    setSelectedAnomaly(null);
    setResolveNotes('');
    loadData();
  };

  const filteredAnpr = anprDetections.filter(
    d => !anprSearch || d.plate_number.toLowerCase().includes(anprSearch.toLowerCase()) || d.location.toLowerCase().includes(anprSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 border border-purple-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-300 font-mono text-xs font-bold rounded-md border border-purple-500/40 uppercase">
              MODEL 4 MULTI-TASK AI
            </span>
            <span className="text-xs text-slate-400 font-mono">YOLOV8 · DEEPSTREAM · AFIS/NAFIS BIOMETRICS</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Multi-Task Vision AI Analytics Suite
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Unified edge-and-cloud AI inference pipeline providing real-time License Plate Recognition (ANPR), Facial
            Biometrics against National AFIS/NAFIS registries, Crowd Footfall & Heatmaps, and Spatial-Temporal Anomaly
            Detection.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab('ANPR')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'ANPR'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>ANPR Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('FACE_RECOGNITION')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'FACE_RECOGNITION'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Face Recognition (FR)</span>
          </button>

          <button
            onClick={() => setActiveTab('CROWD_DENSITY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'CROWD_DENSITY'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Crowd & Density</span>
          </button>

          <button
            onClick={() => setActiveTab('ANOMALIES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'ANOMALIES'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Anomalies ({anomalies.filter(a => a.status === 'ACTIVE').length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ANPR Engine ─────────────────────────────────────────── */}
      {activeTab === 'ANPR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={anprSearch}
                onChange={e => setAnprSearch(e.target.value)}
                placeholder="Filter by license plate number (e.g. GJ01AB1234) or location..."
                className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-mono">Total Sightings: <b>{filteredAnpr.length}</b></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredAnpr.map(det => (
              <div
                key={det.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                  det.watchlist_hit ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="bg-slate-900 text-amber-300 font-mono font-black text-sm px-3 py-1.5 rounded-lg border border-amber-500/40 tracking-wider shadow-inner">
                    {det.plate_number}
                  </div>
                  {det.watchlist_hit ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-md border border-rose-300 animate-pulse">
                      WATCHLIST HIT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md">
                      VERIFIED
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800">{det.vehicle_type}</p>
                  <p className="text-slate-500 text-[11px] font-mono">{det.location}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-600 border-t border-slate-100">
                    <span>Speed: <b>{det.speed_kmh} km/h</b></span>
                    <span>Conf: <b>{Math.round(det.confidence * 100)}%</b></span>
                  </div>
                  {det.watchlist_hit && (
                    <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-900 text-[10px] p-2 rounded-lg font-bold">
                      ⚠️ {det.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Face Recognition Biometrics ─────────────────────────── */}
      {activeTab === 'FACE_RECOGNITION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">AFIS & NAFIS Biometric Face Sighting Feed</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase rounded-md border border-indigo-200">
                  PRIVACY-BY-DESIGN COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time facial vector matching with criminal and suspect databases</p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={privacyMaskingEnabled}
                  onChange={e => setPrivacyMaskingEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="flex items-center gap-1">
                  🛡️ Auto-Blur Civilian Faces
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watchlistOnlyFaces}
                  onChange={e => setWatchlistOnlyFaces(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
                Show Watchlist Matches Only
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {faceEvents.map(face => (
              <div
                key={face.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                  face.matched_watchlist ? 'border-purple-300 bg-purple-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-md transition-all ${
                    face.matched_watchlist 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                      : (privacyMaskingEnabled ? 'bg-slate-300 text-slate-600 blur-[2px]' : 'bg-slate-700')
                  }`}>
                    {face.matched_watchlist || !privacyMaskingEnabled ? (face.person_name ? face.person_name.charAt(0) : 'U') : '🔒'}
                  </div>
                  {face.matched_watchlist ? (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-black uppercase rounded-lg">
                      NAFIS MATCH ({Math.round(face.confidence * 100)}%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1">
                      {privacyMaskingEnabled && <span className="text-[10px]">🛡️</span>} CIVILIAN CLEAR
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <h4 className={`font-extrabold text-sm ${
                    !face.matched_watchlist && privacyMaskingEnabled ? 'text-slate-400 font-mono filter blur-[1px]' : 'text-slate-900'
                  }`}>
                    {!face.matched_watchlist && privacyMaskingEnabled ? 'Civilian Identity Protected' : face.person_name}
                  </h4>
                  <p className="text-slate-500 text-[11px] font-mono">
                    Gender: <b>{face.gender}</b> · Est. Age: <b>{face.estimated_age} yrs</b>
                  </p>
                  <p className="text-slate-500 text-[11px] font-mono">{face.location}</p>
                  
                  {face.nafis_id ? (
                    <div className="bg-purple-950 text-purple-200 rounded-lg p-2.5 font-mono text-[10px] space-y-1 border border-purple-800/40">
                      <p className="font-bold text-cyan-300">ID: {face.nafis_id}</p>
                      <p className="text-slate-300">{face.criminal_record}</p>
                    </div>
                  ) : (
                    privacyMaskingEnabled && (
                      <div className="bg-slate-50 text-slate-500 rounded-lg p-2 font-mono text-[10px] border border-slate-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Privacy Mask Applied (Section 43A IT Act Compliant)
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Crowd Density & Traffic Heatmaps ────────────────────── */}
      {activeTab === 'CROWD_DENSITY' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900">Crowd Footfall & Traffic Congestion Index</h3>
            <p className="text-xs text-slate-500">Live spatial density metrics across urban corridors and transit intersections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {crowdMetrics.map((cm, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-xs">{cm.camera_id.toUpperCase()}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      cm.congestion_level === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : cm.congestion_level === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {cm.congestion_level} CONGESTION
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700 truncate">{cm.location}</p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Density Ratio</span>
                    <b>{cm.density_percent}%</b>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cm.density_percent > 75
                          ? 'bg-rose-500'
                          : cm.density_percent > 45
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${cm.density_percent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block">Pedestrians</span>
                    <b className="text-sm text-slate-900">{cm.pedestrian_count}</b>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block">Vehicles</span>
                    <b className="text-sm text-slate-900">{cm.vehicle_count}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Spatial-Temporal Anomalies ───────────────────────────── */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Active Spatial-Temporal Threat Matrix</h3>
              <p className="text-xs text-slate-500">Perimeter breaches, wrong-way traffic, unattended luggage, and overcrowding</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold font-mono rounded-lg border border-rose-200">
              {anomalies.filter(a => a.status === 'ACTIVE').length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {anomalies.map(anom => (
              <div
                key={anom.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 flex flex-col justify-between ${
                  anom.status === 'ACTIVE'
                    ? 'border-rose-300'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-md">
                      {anom.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                        anom.status === 'ACTIVE'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {anom.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900">{anom.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{anom.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{anom.location}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Conf: {Math.round(anom.confidence * 100)}%</span>
                  {anom.status === 'ACTIVE' ? (
                    <button
                      onClick={() => setSelectedAnomaly(anom)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      Triage & Resolve
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Resolve Anomaly Threat</h3>
              <button onClick={() => setSelectedAnomaly(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{selectedAnomaly.title}</p>
                <p className="text-slate-500 mt-1">{selectedAnomaly.description}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolving Officer</label>
                <input
                  type="text"
                  value={resolvingOfficer}
                  onChange={e => setResolvingOfficer(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Investigation & Action Notes</label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Enter police interception or maintenance action details..."
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveAnomaly}
                  disabled={resolving || !resolveNotes.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md disabled:opacity-50"
                >
                  {resolving ? 'Recording...' : 'Commit Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
