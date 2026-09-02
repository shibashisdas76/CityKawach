import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Cpu, Car, AlertTriangle, Activity, ArrowRight,
  Wifi, Shield, Database, Layers, Globe, Zap
} from 'lucide-react';
import { vmsService } from '../../services/vmsService';

export const VmsLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState(vmsService.getCatalogue());
  const [anpr, setAnpr] = useState(vmsService.getAnprDetections());
  const [events, setEvents] = useState(vmsService.getAnalyticsEvents());
  const [tracks, setTracks] = useState(vmsService.getVehicleTracks());

  useEffect(() => {
    // Load catalogue
    vmsService.loadCatalogue();
    const unsub = vmsService.subscribe(() => {
      setCameras(vmsService.getCatalogue());
      setAnpr(vmsService.getAnprDetections());
      setEvents(vmsService.getAnalyticsEvents());
      setTracks(vmsService.getVehicleTracks());
    });
    return unsub;
  }, []);

  const scalability = vmsService.getScalabilityStats();
  const integrations = vmsService.getIntegrations();
  const connectedIntegrations = integrations.filter(i => i.status === 'CONNECTED').length;
  const watchlistHits = anpr.filter(a => a.watchlistHit).length;
  const criticalEvents = events.filter(e => e.severity === 'CRITICAL' && !e.resolved).length;

  const modules = [
    {
      icon: Video, title: 'Live Video Wall', desc: 'Real-time multi-feed monitoring from 30 Sentinel cameras across Gujarat',
      href: '/vms/live', color: 'from-blue-600 to-cyan-500', badge: `${cameras.filter(c => c.live).length} LIVE`,
    },
    {
      icon: Car, title: 'ANPR Engine', desc: 'Automated number plate recognition with VAHAN/SARTHI lookup and watchlist matching',
      href: '/vms/anpr', color: 'from-violet-600 to-purple-500', badge: `${anpr.length} Detections`,
    },
    {
      icon: Globe, title: 'Vehicle Tracking', desc: 'Statewide route reconstruction and cross-camera vehicle journey timeline',
      href: '/vms/tracking', color: 'from-emerald-600 to-teal-500', badge: `${tracks.length} Tracks`,
    },
    {
      icon: Cpu, title: 'Analytics Engine', desc: 'Crowd density, anomaly detection, vehicle counting and heatmap analysis',
      href: '/vms/analytics', color: 'from-orange-600 to-amber-500', badge: `${events.length} Events`,
    },
    {
      icon: Zap, title: 'Integration Hub', desc: 'VAHAN, SARTHI, eGujCop, AFIS, NAFIS and CCTNS real-time connectivity',
      href: '/vms/integrations', color: 'from-pink-600 to-rose-500', badge: `${connectedIntegrations}/6 Connected`,
    },
    {
      icon: Database, title: 'Storage Tiers', desc: 'Hot, Warm and Cold tiered storage with retention policy and capacity planning',
      href: '/vms/storage', color: 'from-slate-600 to-slate-500', badge: '3 Tiers',
    },
    {
      icon: Shield, title: 'Security Architecture', desc: 'RBAC, encryption, network segmentation and disaster recovery status',
      href: '/vms/security', color: 'from-red-700 to-red-600', badge: 'SECURE',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-8 border border-blue-800/40">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366F1 0%, transparent 40%)' }}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">Model 4 — Central VMS</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Statewide Video Management System</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl">
              Unified centralised platform for CCTV monitoring, AI analytics, vehicle tracking, and cross-departmental
              surveillance across the State of Gujarat. Powered by the Sentinel Camera Grid.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-emerald-300">All Systems Operational</span>
          </div>
        </div>

        {/* KPI row */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Live Feeds', value: cameras.filter(c => c.live).length, sub: `of 30 sentinel cameras`, color: 'text-cyan-400' },
            { label: 'ANPR Detections', value: anpr.length, sub: `${watchlistHits} watchlist hits`, color: 'text-violet-400' },
            { label: 'Vehicles Tracked', value: tracks.length, sub: 'statewide routes active', color: 'text-emerald-400' },
            { label: 'Critical Events', value: criticalEvents, sub: 'requiring response', color: criticalEvents > 0 ? 'text-rose-400' : 'text-slate-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-bold text-white mt-1">{kpi.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scalability banner */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Scalability Target: 80,000 Cameras</h3>
            <p className="text-xs text-slate-400 mt-0.5">Infrastructure design certified for statewide Gujarat deployment</p>
          </div>
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Target Cameras', value: '80,000' },
            { label: 'Ingest Bandwidth', value: `${scalability.ingestBandwidthGbps} Gbps` },
            { label: 'Storage/Day', value: `${scalability.storagePerDayTB} TB` },
            { label: 'GPU Nodes', value: scalability.gpuNodes },
            { label: 'K8s Pods', value: `${scalability.k8sPods}+` },
            { label: 'Kafka Partitions', value: scalability.kafkaPartitions },
          ].map(item => (
            <div key={item.label} className="text-center bg-slate-800/60 rounded-xl p-3">
              <p className="text-sm font-black text-blue-400">{item.value}</p>
              <p className="text-[9px] text-slate-500 mt-1 font-medium uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">VMS Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map(mod => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => navigate(mod.href)}
                className="group text-left bg-white hover:shadow-lg rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:border-blue-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mod.badge}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-blue-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent alerts strip */}
      {events.filter(e => !e.resolved).length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-300">Active AI Alerts</h3>
          </div>
          <div className="space-y-2">
            {events.filter(e => !e.resolved).slice(0, 3).map(ev => (
              <div key={ev.id} className="flex items-center justify-between bg-slate-900/60 rounded-xl px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ev.severity === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300' :
                    ev.severity === 'HIGH' ? 'bg-orange-500/30 text-orange-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>{ev.severity}</span>
                  <span className="text-xs text-slate-300">{ev.description}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{ev.cameraLocation.slice(0, 20)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
