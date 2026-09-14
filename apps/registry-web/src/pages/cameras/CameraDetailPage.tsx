import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import { VideoPlayer } from '../../components/vms/VideoPlayer';
import { SentinelCamera } from '../../types/camera.types';
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
  RefreshCw,
  Check,
  Film,
  Layers,
  Car
} from 'lucide-react';

export const CameraDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const camera = (id ? apiService.getCameraById(id) : undefined) || apiService.getCameras()[0];
  const healthLogs = apiService.getHealthLogs(camera.id);

  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState<number | null>(camera.ping_latency_ms || 12);
  const [aiOverlay, setAiOverlay] = useState(true);

  // Map camera to Sentinel format for VideoPlayer
  const sentinelCam: SentinelCamera = {
    id: camera.camera_id || 'cam01',
    number: parseInt((camera.camera_id || 'cam01').replace(/\D/g, '') || '1', 10),
    name: camera.camera_name,
    location: camera.address || 'Ahmedabad Crossroad',
    hls_url: camera.rtsp_url ? `https://cctv.corp8.cloud/hls/${camera.camera_id}.m3u8` : '',
    hls_live_url: camera.rtsp_url ? `https://cctv.corp8.cloud/hls/${camera.camera_id}.m3u8` : '',
    rtsp_url: camera.rtsp_url || '',
    webrtc_url: '',
    codec: 'H.264 / AAC',
    live: camera.status === 'ONLINE',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate_kbps: 4096,
    bits_per_pixel: 0.08,
    district: camera.district,
    department: camera.departments?.name || 'Surveillance',
    latitude: camera.latitude,
    longitude: camera.longitude,
    ai_active: true
  };

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
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          to="/cameras"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Camera Registry</span>
        </Link>

        {/* 4-Model Cross Navigation Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={handleTestPing}
            disabled={pinging}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${pinging ? 'animate-spin' : ''}`} />
            <span>Test Ping</span>
          </button>
          
          <Link
            to={`/map?camId=${camera.id}`}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>M1: GIS Map</span>
          </Link>

          <Link
            to={`/vms/live?camId=${camera.camera_id}`}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Video className="w-3.5 h-3.5" />
            <span>M2: Live Wall</span>
          </Link>

          <Link
            to={`/federation/correlation?camId=${camera.camera_id}`}
            className="px-3 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>M3: CEP Events</span>
          </Link>

          <Link
            to={`/vms/playback?camId=${camera.camera_id}`}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Film className="w-3.5 h-3.5" />
            <span>M4: Playback</span>
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <Video className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-blue-700 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-100">
                  {camera.camera_id}
                </span>
                <CameraStatusBadge status={camera.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">{camera.camera_name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{camera.address} • {camera.ward}, {camera.district}, Gujarat</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">DEPARTMENT</div>
              <div className="text-slate-900 font-bold mt-0.5">{camera.departments?.name || 'Traffic Police'}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">LATENCY</div>
              <div className="text-emerald-600 font-bold mt-0.5">{latency} ms</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">RESOLUTION</div>
              <div className="text-slate-900 font-bold mt-0.5">{camera.resolution}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Canvas + Tech Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Stream Player */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg space-y-0 relative">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-white tracking-wide">LIVE HLS / RTSP STREAM FEED</span>
                <span className="text-slate-400">({camera.resolution} @ 30 FPS)</span>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAiOverlay(!aiOverlay)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${aiOverlay ? 'bg-blue-950 text-blue-400 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  AI Overlay {aiOverlay ? 'ON' : 'OFF'}
                </button>
                <span className="text-emerald-400 font-bold">{camera.stream_status || 'ACTIVE'}</span>
              </div>
            </div>

            {/* Live Video Element */}
            <div className="aspect-video bg-black relative">
              <VideoPlayer camera={sentinelCam} showOverlay={aiOverlay} />
            </div>
          </div>

          {/* Technical Specs Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 tracking-tight">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Hardware & Technical Specifications</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">CAMERA HARDWARE TYPE</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{camera.camera_type}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">CONNECTIVITY & STORAGE</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{camera.connectivity_type} • {camera.storage_type}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">IP ADDRESS</div>
                <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{camera.ip_address || '10.120.10.1'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">RETENTION PERIOD</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{camera.retention_days} Days</div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Assigned AI & Computer Vision Pipelines</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(camera.ai_capabilities || ['ANPR', 'CROWD_DENSITY', 'MOTION_DETECT', 'FACE_RECOGNITION']).map((cap) => (
                  <span key={cap} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-mono text-xs font-semibold inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>{cap.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* RTSP Stream Endpoint */}
            {camera.rtsp_url && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    <span>RTSP Stream Endpoint</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(camera.rtsp_url || '')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1.5 text-[11px] transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto">
                  {camera.rtsp_url}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Logs Sidebar Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 tracking-tight">
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
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center space-x-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </span>
                      <CameraStatusBadge status={log.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="text-slate-500">Latency: <span className="text-emerald-600 font-bold">{log.latencyMs} ms</span></div>
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


