import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { vmsService } from '../../services/vmsService';
import { AiAnalyticsEvent, SentinelCamera } from '../../types/camera.types';
import { CrowdDensityMeter } from '../../components/vms/CrowdDensityMeter';
import { AlertTriangle, CheckCircle2, Activity, Car, Users, Eye } from 'lucide-react';

const EVENT_COLORS: Record<AiAnalyticsEvent['severity'], string> = {
  CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#F59E0B', LOW: '#10B981',
};

const EVENT_LABELS: Record<AiAnalyticsEvent['eventType'], string> = {
  CROWD_SURGE: '👥 Crowd Surge',
  VEHICLE_WRONG_WAY: '🚗 Wrong Way',
  ABANDONED_OBJECT: '📦 Abandoned Object',
  FIRE_SMOKE: '🔥 Fire / Smoke',
  INTRUSION: '🚨 Intrusion',
  FIGHT_DETECTED: '⚠️ Fight Detected',
  VEHICLE_SPEEDING: '💨 Speeding',
};

function generateHourlyData() {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    vehicles: Math.floor(Math.random() * 120) + 20,
    crowd: Math.floor(Math.random() * 80) + 5,
    anomalies: Math.floor(Math.random() * 5),
  }));
}

export const AnalyticsEnginePage: React.FC = () => {
  const [cameras, setCameras] = useState<SentinelCamera[]>(vmsService.getCatalogue());
  const [events, setEvents] = useState<AiAnalyticsEvent[]>(vmsService.getAnalyticsEvents());
  const [selectedCam, setSelectedCam] = useState<SentinelCamera | null>(null);
  const [hourlyData] = useState(generateHourlyData());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    vmsService.loadCatalogue();
    const unsub = vmsService.subscribe(() => {
      const cams = vmsService.getCatalogue();
      setCameras(cams);
      setEvents(vmsService.getAnalyticsEvents());
      if (!selectedCam && cams.length > 0) setSelectedCam(cams[0]);
      setTick(t => t + 1);
    });
    const unsub2 = vmsService.subscribe(() => setTick(t => t + 1));
    return () => { unsub(); unsub2(); };
  }, [selectedCam]);

  useEffect(() => {
    if (!selectedCam && cameras.length > 0) setSelectedCam(cameras[0]);
  }, [cameras, selectedCam]);

  const activeEvents = events.filter(e => !e.resolved);
  const resolvedCount = events.filter(e => e.resolved).length;
  const avgCrowd = cameras.length > 0
    ? cameras.reduce((s, c) => s + (c.analytics?.crowdDensity ?? 0), 0) / cameras.length
    : 0;
  const totalVehicles = cameras.reduce((s, c) => s + (c.analytics?.vehicleCount ?? 0), 0);

  const topAlertCameras = cameras
    .filter(c => (c.analytics?.anomalyScore ?? 0) > 0.1)
    .sort((a, b) => (b.analytics?.anomalyScore ?? 0) - (a.analytics?.anomalyScore ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Crowd Density', value: `${Math.round(avgCrowd * 100)}%`, icon: Users, color: 'text-blue-400', bg: 'from-blue-950 to-indigo-950 border-blue-700/40' },
          { label: 'Active Vehicles', value: totalVehicles, icon: Car, color: 'text-emerald-400', bg: 'from-emerald-950 to-teal-950 border-emerald-700/40' },
          { label: 'Active Events', value: activeEvents.length, icon: AlertTriangle, color: 'text-rose-400', bg: 'from-rose-950 to-red-950 border-rose-700/40' },
          { label: 'Cameras w/ AI', value: cameras.filter(c => c.ai_active).length, icon: Eye, color: 'text-violet-400', bg: 'from-violet-950 to-purple-950 border-violet-700/40' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} rounded-2xl border p-4`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main analytics */}
        <div className="xl:col-span-2 space-y-4">
          {/* Hourly vehicle/crowd chart */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">24-Hour Activity Timeline (Simulated · All Cameras)</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', fontSize: 11 }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area type="monotone" dataKey="vehicles" stroke="#3B82F6" fill="#1D4ED8" fillOpacity={0.3} name="Vehicles" />
                  <Area type="monotone" dataKey="crowd" stroke="#10B981" fill="#059669" fillOpacity={0.2} name="Crowd Index" />
                  <Area type="monotone" dataKey="anomalies" stroke="#EF4444" fill="#DC2626" fillOpacity={0.4} name="Anomalies" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-camera density gauges */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Real-time Crowd Density · Top Cameras</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {cameras.slice(0, 10).map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCam(cam)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${selectedCam?.id === cam.id ? 'bg-blue-900/40 border border-blue-500/40' : 'hover:bg-slate-800'}`}
                >
                  <CrowdDensityMeter value={cam.analytics?.crowdDensity ?? 0} size="sm" />
                  <p className="text-[9px] text-slate-400 text-center leading-tight">{cam.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle count per camera bar chart */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Vehicle Count per Camera (Current)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cameras.slice(0, 12).map(c => ({ name: c.id, count: c.analytics?.vehicleCount ?? 0 }))}>
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', fontSize: 11 }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Vehicles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Events & Anomalies */}
        <div className="space-y-4">
          {/* Top anomaly cameras */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-4">
            <h3 className="text-sm font-bold text-white mb-3">High Anomaly Cameras</h3>
            <div className="space-y-2">
              {topAlertCameras.map(cam => (
                <div key={cam.id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-900/40 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{cam.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(cam.analytics?.anomalyScore ?? 0) * 100}%`, backgroundColor: '#EF4444' }}
                        />
                      </div>
                      <span className="text-[10px] text-rose-400 font-bold">{Math.round((cam.analytics?.anomalyScore ?? 0) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event feed */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden" style={{ maxHeight: '420px' }}>
            <div className="p-3 border-b border-slate-700/60 flex items-center justify-between">
              <p className="text-xs font-bold text-white">AI Event Log</p>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">{activeEvents.length} active</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {events.map(ev => (
                <div key={ev.id} className={`px-3 py-2.5 border-b border-slate-800/60 flex items-start gap-2 ${ev.resolved ? 'opacity-40' : ''}`}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: EVENT_COLORS[ev.severity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-200">{EVENT_LABELS[ev.eventType]}</span>
                      {!ev.resolved && (
                        <button
                          onClick={() => vmsService.resolveEvent(ev.id)}
                          className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold ml-1 shrink-0"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 truncate">{ev.cameraLocation}</p>
                    <p className="text-[9px] font-mono text-slate-600">{new Date(ev.timestamp).toLocaleTimeString()} · {Math.round(ev.confidence * 100)}% conf</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
