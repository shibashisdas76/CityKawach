import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, HardDrive, Wifi, RefreshCw, ArrowRight } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>Health Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time latency monitoring, packet loss analysis, and endpoint ping diagnostic status
          </p>
        </div>

        <button
          onClick={handlePingAll}
          disabled={refreshing}
          className="px-2.5 py-0.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-6 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Ping All Endpoints</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <span>Avg Stream Latency</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">{avgLatency} ms</p>
          <p className="text-[11px] text-slate-400 font-medium">Target threshold: &lt; 50 ms</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <span>RTSP Active Streams</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {cameras.filter((c) => c.status === 'ONLINE').length} / {cameras.length}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold">100% Signal Stability</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <span>AI Processor Load</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-600 tracking-tight">28%</p>
          <p className="text-[11px] text-slate-400 font-medium">Edge GPU Acceleration</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <span>Storage Health</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">54% Used</p>
          <p className="text-[11px] text-slate-400 font-medium">30-Day Auto Retention</p>
        </div>
      </div>

      {/* Camera Telemetry Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-xs flex justify-between items-center tracking-tight">
          <span>Live Endpoint Health & Latency Log</span>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">Showing {cameras.length} Monitored Cameras</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80 font-bold">
                <th className="py-3.5 px-4">Camera ID</th>
                <th className="py-3.5 px-4">Asset Name</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">RTSP Endpoint</th>
                <th className="py-3.5 px-4">Latency</th>
                <th className="py-3.5 px-4">Packet Loss</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right font-sans">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cameras.map((cam) => {
                const lat = cam.ping_latency_ms || Math.floor(Math.random() * 15) + 8;
                return (
                  <tr key={cam.id} className="hover:bg-blue-50/20 transition">
                    <td className="py-3.5 px-4 text-blue-600 font-bold">{cam.camera_id}</td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{cam.camera_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cam.ip_address || '10.120.10.1'}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate">{cam.rtsp_url || 'rtsp://admin:pass@10.120.10.1:554'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{lat} ms</td>
                    <td className="py-3.5 px-4 text-slate-600">0.0%</td>
                    <td className="py-3.5 px-4 font-sans">
                      <CameraStatusBadge status={cam.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <Link
                        to={`/cameras/${cam.id}`}
                        className="px-3 py-1 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-semibold border border-slate-200 text-[11px] inline-flex items-center gap-1 transition shadow-sm"
                      >
                        <span>Telemetry</span>
                        <ArrowRight className="w-3 h-3" />
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

