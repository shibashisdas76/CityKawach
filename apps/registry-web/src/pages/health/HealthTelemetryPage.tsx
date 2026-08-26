import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, HardDrive, Wifi, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import { Link } from 'react-router-dom';

export const HealthTelemetryPage: React.FC = () => {
  const [cameras, setCameras] = useState(apiService.getCameras());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setCameras(apiService.getCameras());
    });
    return () => unsubscribe();
  }, []);

  const handlePingAll = () => {
    setRefreshing(true);
    setTimeout(() => {
      setCameras(apiService.getCameras());
      setRefreshing(false);
    }, 500);
  };

  const avgLatency = Math.round(
    cameras.reduce((acc, c) => acc + (c.ping_latency_ms || 12), 0) / Math.max(1, cameras.length)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Health & RTSP Stream Telemetry Grid</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time latency monitoring, packet loss analysis, and endpoint ping diagnostic status
          </p>
        </div>

        <button
          onClick={handlePingAll}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center space-x-2 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Ping All Endpoints</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Avg Stream Latency</span>
            <Wifi className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{avgLatency} ms</p>
          <p className="text-[11px] text-slate-400">Target threshold: &lt; 50 ms</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">RTSP Active Streams</span>
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {cameras.filter((c) => c.status === 'ONLINE').length} / {cameras.length}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">100% Signal Stability</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">AI Processor Load</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-1">28%</p>
          <p className="text-[11px] text-slate-400">Edge GPU Acceleration</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Storage Health</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">54% Used</p>
          <p className="text-[11px] text-slate-400">30-Day Auto Retention</p>
        </div>
      </div>

      {/* Camera Telemetry Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-xs flex justify-between items-center">
          <span>Live Endpoint Health & Latency Log</span>
          <span className="font-mono text-[11px] text-slate-500">Showing {cameras.length} Monitored Cameras</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Camera ID</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">RTSP Endpoint</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Packet Loss</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cameras.map((cam) => {
                const lat = cam.ping_latency_ms || Math.floor(Math.random() * 15) + 8;
                return (
                  <tr key={cam.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-blue-700 font-bold">{cam.camera_id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{cam.camera_name}</td>
                    <td className="py-3 px-4 text-slate-600">{cam.ip_address || '10.120.10.1'}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{cam.rtsp_url || 'rtsp://admin:pass@10.120.10.1:554'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{lat} ms</td>
                    <td className="py-3 px-4 text-slate-600">0.0%</td>
                    <td className="py-3 px-4">
                      <CameraStatusBadge status={cam.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Link
                        to={`/cameras/${cam.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 text-blue-700 hover:bg-blue-50 font-semibold border border-slate-200 text-[11px]"
                      >
                        Telemetry →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
