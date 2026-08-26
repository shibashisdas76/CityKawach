import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CAMERAS, MOCK_HEALTH_LOGS } from '../../services/supabaseClient';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import { 
  ArrowLeft, 
  Video, 
  MapPin, 
  Server, 
  Activity, 
  Radio, 
  Clock, 
  Copy
} from 'lucide-react';

export const CameraDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const camera = MOCK_CAMERAS.find((c: any) => c.id === id || c.camera_id === id) || MOCK_CAMERAS[0];
  const healthLogs = MOCK_HEALTH_LOGS[camera.id] || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/cameras"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Camera Registry</span>
        </Link>

        <Link
          to={`/map?camId=${camera.id}`}
          className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
        >
          <MapPin className="w-4 h-4" />
          <span>Locate on GIS Map</span>
        </Link>
      </div>

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
              <div className="text-slate-400 text-[10px]">RESOLUTION</div>
              <div className="text-slate-900 font-bold">{camera.resolution}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Hardware & Technical Specifications</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-mono text-[10px]">CAMERA TYPE</div>
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

        <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Telemetry Logs</span>
              </h3>
            </div>

            {healthLogs.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                No recent health alerts logged for this camera.
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
                      <div className="text-slate-500">Latency: <span className="text-slate-900 font-bold">{log.latencyMs} ms</span></div>
                      <div className="text-slate-500">CPU: <span className="text-slate-900 font-bold">{log.cpuUsagePercent}%</span></div>
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
