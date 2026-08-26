import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import {
  ArrowLeft,
  Video,
  MapPin,
  Server,
  Activity,
  Radio,
  Clock,
  Copy,
  Zap,
  Play,
  Cpu,
  RefreshCw
} from 'lucide-react';

export const CameraDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const camera = (id ? apiService.getCameraById(id) : undefined) || apiService.getCameras()[0];
  const healthLogs = apiService.getHealthLogs(camera.id);

  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState<number | null>(camera.ping_latency_ms || 12);
  const [aiOverlay, setAiOverlay] = useState(true);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('RTSP Endpoint URL copied to clipboard!');
  };

  const handleTestPing = () => {
    setPinging(true);
    setTimeout(() => {
      const simulated = Math.floor(Math.random() * 12) + 8;
      setLatency(simulated);
      setPinging(false);
      apiService.logAuditEvent({
        action: 'RTSP_PING_TEST',
        targetEntity: 'cameras',
        targetId: camera.camera_id,
        metadataDiff: { latency_ms: simulated, status: 'ONLINE' }
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/cameras"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Camera Registry</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestPing}
            disabled={pinging}
            className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-medium text-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
            <span>Test Ping Latency</span>
          </button>
          <Link
            to={`/map?camId=${camera.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Locate on GIS Map</span>
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {camera.camera_id}
                </span>
                <CameraStatusBadge status={camera.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{camera.camera_name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{camera.address} • {camera.ward}, {camera.district}, Gujarat</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px]">DEPT</div>
              <div className="text-slate-900 font-bold">{camera.departments?.name || 'Traffic Police'}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400 text-[10px]">PING LATENCY</div>
              <div className="text-emerald-600 font-bold">{latency} ms</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400 text-[10px]">RESOLUTION</div>
              <div className="text-slate-900 font-bold">{camera.resolution}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Canvas + Tech Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulated Live RTSP Video Player */}
          <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl space-y-0 relative">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-white">LIVE RTSP STREAM FEED</span>
                <span className="text-slate-400">({camera.resolution} @ 30 FPS)</span>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAiOverlay(!aiOverlay)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${aiOverlay ? 'bg-blue-900/60 text-blue-300 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  AI Overlay {aiOverlay ? 'ON' : 'OFF'}
                </button>
                <span className="text-emerald-400 font-bold">{camera.stream_status || 'ACTIVE'}</span>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div className="h-72 bg-gradient-to-br from-slate-900 via-slate-950 to-black relative flex items-center justify-center overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Bounding Box Visual Overlays when AI is enabled */}
              {aiOverlay && (
                <>
                  <div className="absolute top-12 left-16 border-2 border-emerald-400/80 bg-emerald-500/10 rounded p-1 text-[10px] font-mono text-emerald-300 shadow-lg">
                    <span>VEHICLE: GJ-01-AB-1234 (98%)</span>
                  </div>
                  <div className="absolute bottom-16 right-24 border-2 border-blue-400/80 bg-blue-500/10 rounded p-1 text-[10px] font-mono text-blue-300 shadow-lg">
                    <span>PEDESTRIAN (92%)</span>
                  </div>
                  <div className="absolute top-8 right-12 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                    ANPR Model: v2.4-lite
                  </div>
                </>
              )}

              <div className="text-center space-y-2 z-10">
                <Play className="w-10 h-10 text-blue-500 mx-auto opacity-70 animate-pulse" />
                <p className="text-xs font-mono text-slate-400">RTSP Stream Ingestion Pipeline Operational</p>
                <p className="text-[11px] font-mono text-emerald-400">{camera.rtsp_url}</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Hardware & Technical Specifications</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 font-mono text-[10px]">CAMERA HARDWARE TYPE</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{camera.camera_type}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 font-mono text-[10px]">CONNECTIVITY & STORAGE</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{camera.connectivity_type} • {camera.storage_type}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 font-mono text-[10px]">IP ADDRESS</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{camera.ip_address || '10.120.10.1'}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 font-mono text-[10px]">RETENTION PERIOD</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{camera.retention_days} Days</div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned AI & Computer Vision Pipelines</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(camera.ai_capabilities || ['ANPR', 'CROWD_DENSITY', 'MOTION_DETECT']).map((cap) => (
                  <span key={cap} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold">
                    ✓ {cap.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* RTSP Stream Endpoint */}
            {camera.rtsp_url && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>RTSP Stream Endpoint</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(camera.rtsp_url || '')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </button>
                </div>
                <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto">
                  {camera.rtsp_url}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Logs Sidebar */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Health Telemetry Logs</span>
              </h3>
            </div>

            {healthLogs.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                No recent health telemetry logged for this camera.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {healthLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </span>
                      <CameraStatusBadge status={log.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="text-slate-500">Latency: <span className="text-emerald-700 font-bold">{log.latencyMs} ms</span></div>
                      <div className="text-slate-500">CPU: <span className="text-slate-900 font-bold">{log.cpuUsagePercent}%</span></div>
                      <div className="text-slate-500">RAM: <span className="text-slate-900 font-bold">{log.memoryUsagePercent}%</span></div>
                      <div className="text-slate-500">Temp: <span className="text-slate-900 font-bold">{log.temperatureCelsius}°C</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

