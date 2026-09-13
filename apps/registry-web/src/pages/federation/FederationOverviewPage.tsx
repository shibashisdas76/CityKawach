import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Activity,
  Server,
  Network,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  BarChart3,
  Sliders,
  Workflow
} from 'lucide-react';
import { federationService } from '../../services/federationService';
import { VmsPlatform, CorrelatedIncident, VmsEventEnvelope } from '../../types/federation.types';

export const FederationOverviewPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<VmsPlatform[]>([]);
  const [correlations, setCorrelations] = useState<CorrelatedIncident[]>([]);
  const [events, setEvents] = useState<VmsEventEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const [plats, corrs, evts] = await Promise.all([
      federationService.getPlatforms(),
      federationService.getCorrelations(),
      federationService.getLiveEvents()
    ]);
    setPlatforms(plats);
    setCorrelations(corrs);
    setEvents(evts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const unsub = federationService.subscribe(() => {
      fetchData();
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const totalCameras = platforms.reduce((acc, p) => acc + (p.syncedCamerasCount || 0), 0);
  const avgLatency = platforms.length
    ? (platforms.reduce((acc, p) => acc + p.latencyMs, 0) / platforms.length).toFixed(1)
    : '42.0';
  const openCorrelations = correlations.filter(c => c.status !== 'RESOLVED').length;

  const vendorColorMap: Record<string, string> = {
    HIKVISION_HIKCENTRAL: 'from-rose-600 to-red-700 border-rose-500/40 text-rose-300',
    GENETEC_SECURITY_CENTER: 'from-emerald-600 to-teal-700 border-emerald-500/40 text-emerald-300',
    DAHUA_DSS: 'from-amber-600 to-orange-700 border-amber-500/40 text-amber-300',
    MILESTONE_XPROTECT: 'from-blue-600 to-indigo-700 border-blue-500/40 text-blue-300',
    HANWHA_WAVE: 'from-purple-600 to-violet-700 border-purple-500/40 text-purple-300',
    ONVIF_GENERIC: 'from-cyan-600 to-sky-700 border-cyan-500/40 text-cyan-300'
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-blue-800/60 shadow-xl shadow-blue-950/40 text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              MODEL 3: STATEWIDE VMS FEDERATION & MIDDLEWARE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              VMS Middleware & Federation Layer
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Unified cross-departmental integration engine federating Milestone, Genetec, Hikvision, Dahua, and Hanwha VMS platforms via metadata exchange bus and complex event correlation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-900/80 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-blue-700/60 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Bus
            </button>
            <Link
              to="/federation/wall"
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 transition"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Open Federated Wall
            </Link>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-blue-800/40 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Federated VMS</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{platforms.length}</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">✓ 100% Online & Synced</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-blue-800/40 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Managed Feeds</span>
              <Network className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{totalCameras || 30}</p>
            <p className="text-[10px] text-blue-300 font-semibold mt-1">Live Sentinel Grid 100%</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-blue-800/40 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Active Correlations</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-1">{openCorrelations}</p>
            <p className="text-[10px] text-amber-300 font-semibold mt-1">{correlations.length} Total Incidents 24h</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-blue-800/40 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Average Latency</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">{avgLatency} ms</p>
            <p className="text-[10px] text-emerald-300 font-semibold mt-1">SLA Uptime: 99.98%</p>
          </div>
        </div>
      </div>

      {/* Model 3 Quick Access Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            title: 'Federated Video Wall',
            desc: 'View live streams grouped by source VMS vendor with PTZ control.',
            icon: Play,
            href: '/federation/wall',
            color: 'from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-cyan-400'
          },
          {
            title: 'Event Correlation Engine',
            desc: 'Complex Event Processing (CEP) graph visualizer across jurisdictions.',
            icon: Zap,
            href: '/federation/correlation',
            color: 'from-amber-600/20 to-yellow-600/20 border-amber-500/30 text-amber-400'
          },
          {
            title: 'Unified Incident Hub',
            desc: 'Statewide alarm queue with multi-agency dispatch & SOP tracking.',
            icon: ShieldAlert,
            href: '/federation/incidents',
            color: 'from-rose-600/20 to-red-600/20 border-rose-500/30 text-rose-400'
          },
          {
            title: 'Connector Framework',
            desc: 'Interactive SDK sandbox, schema validator & live test runner.',
            icon: Sliders,
            href: '/federation/connectors',
            color: 'from-purple-600/20 to-indigo-600/20 border-purple-500/30 text-purple-400'
          },
          {
            title: 'Federated Analytics',
            desc: 'Cross-VMS MTTR, SLA uptime, and executive intelligence report.',
            icon: BarChart3,
            href: '/federation/reports',
            color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-400'
          }
        ].map(card => (
          <Link
            key={card.title}
            to={card.href}
            className={`group bg-slate-900/80 hover:bg-slate-800/90 rounded-2xl p-5 border ${card.color} transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-lg`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 ${card.color.split(' ')[2]}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">{card.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{card.desc}</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-4 inline-flex items-center gap-1">
              Explore Module →
            </span>
          </Link>
        ))}
      </div>

      {/* Connected Departmental VMS Platforms Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Connected Departmental VMS Instances</h2>
            <p className="text-xs text-slate-500">Live heartbeat telemetry and camera partitions across Gujarat state departments</p>
          </div>
          <Link
            to="/federation/connectors"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Onboard New VMS +
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {platforms.map(platform => {
            const badgeClass = vendorColorMap[platform.vendor] || 'from-blue-600 to-indigo-700 border-blue-500/40 text-blue-300';
            return (
              <div
                key={platform.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gradient-to-r ${badgeClass}`}>
                        {platform.vendor.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm font-black text-white mt-2">{platform.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{platform.departmentName}</p>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">📍 {platform.district}</p>
                    </div>

                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {platform.status}
                    </span>
                  </div>

                  {/* Telemetry pill */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-800/60 rounded-xl p-3 mt-4 border border-slate-700/50 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono">FEEDS</p>
                      <p className="text-sm font-black text-white">{platform.syncedCamerasCount || 6}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono">LATENCY</p>
                      <p className="text-sm font-black text-cyan-300">{platform.latencyMs} ms</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono">UPTIME</p>
                      <p className="text-sm font-black text-emerald-300">{platform.uptimePercentage}%</p>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Protocol Bridge:</span>
                      <span className="font-mono text-slate-300">{platform.protocol}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Alarms (24h):</span>
                      <span className="font-mono font-bold text-amber-300">{platform.totalAlarms24h}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
                  <Link
                    to={`/federation/wall?vms=${platform.id}`}
                    className="flex-1 text-center bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-bold py-2 rounded-xl border border-blue-500/30 transition"
                  >
                    View Feeds
                  </Link>
                  <Link
                    to={`/federation/connectors?test=${platform.id}`}
                    className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-xl border border-slate-700 transition"
                  >
                    Test Health
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Metadata Bus Stream & Active Correlations Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Correlated Incidents */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Active Complex Event Correlations</h3>
                  <p className="text-[11px] text-slate-400">Cross-system incidents triggered across 2+ departmental VMS instances</p>
                </div>
              </div>
              <Link to="/federation/correlation" className="text-xs font-bold text-cyan-400 hover:underline">
                View Graph →
              </Link>
            </div>

            <div className="space-y-3">
              {correlations.slice(0, 3).map(inc => (
                <div
                  key={inc.id}
                  className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 hover:border-amber-500/50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {inc.incidentCode}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">
                      ● {inc.severity} SEVERITY
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white">{inc.title}</p>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{inc.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-300">Rule: {inc.ruleCode}</span>
                    <span>Lead: {inc.leadDepartment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <Link
              to="/federation/incidents"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
            >
              Open Unified Incident Desk ({correlations.length} Total) →
            </Link>
          </div>
        </div>

        {/* Real-time Metadata Exchange Bus Stream */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Metadata Exchange Bus</h3>
                  <p className="text-[11px] text-slate-400">Kafka-style normalized event stream from all connected VMS plugins</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                340 msgs/s
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {events.slice(0, 5).map(evt => (
                <div
                  key={evt.eventId}
                  className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 font-mono text-[11px]">{evt.eventType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-semibold">{evt.cameraName} ({evt.location})</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="text-slate-400">{evt.sourceVmsName}</span>
                    <span className="text-emerald-400 font-mono font-bold">Conf: {Math.round(evt.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <Link
              to="/federation/correlation"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
            >
              Analyze Event Stream in CEP Visualizer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
