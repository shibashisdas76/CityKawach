import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Cpu,
  Car,
  AlertTriangle,
  Activity,
  ArrowRight,
  Shield,
  Database,
  Layers,
  Globe,
  Zap,
  HardDrive,
  Lock,
  RefreshCw,
  Server,
  Radio,
  FileCheck2,
  CheckCircle2,
  TrendingUp,
  Clock,
  Play
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { VmsOverviewKpi, VmsCameraFeed, AnomalyEvent, FaceDetectionEvent } from '../../types/model4.types';

export const VmsLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<VmsOverviewKpi | null>(null);
  const [cameras, setCameras] = useState<VmsCameraFeed[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [faceHits, setFaceHits] = useState<FaceDetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [ov, cams, anoms, faces] = await Promise.all([
        model4Service.getOverview(),
        model4Service.getCameras(),
        model4Service.getAnomalies('ACTIVE'),
        model4Service.getFaceDetections(true)
      ]);
      setOverview(ov);
      setCameras(cams);
      setAnomalies(anoms);
      setFaceHits(faces);
    } catch (e) {
      console.error('Error loading VMS landing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = model4Service.subscribe(loadData);
    return unsub;
  }, []);

  const modules = [
    {
      icon: Video,
      title: 'Live Video Wall',
      desc: 'Multi-grid monitoring (1×1 to 4×4) across 30 live Sentinel cameras with PTZ controls & telemetry.',
      href: '/vms/live',
      color: 'from-blue-600 to-cyan-500',
      badge: `${cameras.filter(c => c.live).length} LIVE FEEDS`,
      tag: 'Monitoring'
    },
    {
      icon: Clock,
      title: 'Timeline & Synchronized Playback',
      desc: 'Hot buffer scrubbing, event bookmark markers, variable playback speed & SHA-256 evidence export.',
      href: '/vms/playback',
      color: 'from-indigo-600 to-blue-500',
      badge: 'HOT / WARM SCRUBBER',
      tag: 'Playback'
    },
    {
      icon: Cpu,
      title: 'Multi-Task Vision AI Suite',
      desc: 'Unified AI: ANPR, Facial Recognition (AFIS/NAFIS), Crowd Density Heatmaps & Anomaly Detection.',
      href: '/vms/ai-suite',
      color: 'from-violet-600 to-purple-500',
      badge: `${anomalies.length + faceHits.length} ACTIVE ALERTS`,
      tag: 'Inference'
    },
    {
      icon: Globe,
      title: 'Statewide Vehicle Tracking',
      desc: 'GIS trajectory reconstructor with sequential checkpoint history, speed deltas & escape vector projection.',
      href: '/vms/tracking',
      color: 'from-emerald-600 to-teal-500',
      badge: 'PTS-DRIVEN ROUTING',
      tag: 'Tracking'
    },
    {
      icon: Zap,
      title: 'Government Integration Hub',
      desc: 'Live bidirectional sync with VAHAN, SARTHI, eGujCop, AFIS/NAFIS, and CCTNS national networks.',
      href: '/vms/integrations',
      color: 'from-pink-600 to-rose-500',
      badge: '5/5 CONNECTED',
      tag: 'Integrations'
    },
    {
      icon: HardDrive,
      title: 'Tiered Storage Architecture',
      desc: 'Hot (NVMe SSD), Warm (Ceph Object), and Cold (S3 WORM) tiers with 80k sizing calculator.',
      href: '/vms/storage',
      color: 'from-amber-600 to-orange-500',
      badge: 'CEPH + S3 WORM',
      tag: 'Storage'
    },
    {
      icon: Activity,
      title: '80k Scalability & Load Lab',
      desc: 'Statewide capacity model & synthetic stress testing runner simulating 10k to 80k camera streams.',
      href: '/vms/scalability',
      color: 'from-cyan-600 to-blue-600',
      badge: '140.8 GBPS CERTIFIED',
      tag: 'Scalability'
    },
    {
      icon: Server,
      title: 'Disaster Recovery (DR)',
      desc: 'Active-Active dual datacenter replication (SDC Gandhinagar <-> DRS Ahmedabad) with RTO < 30s.',
      href: '/vms/dr',
      color: 'from-teal-600 to-emerald-600',
      badge: 'RTO 18.5s / RPO 320ms',
      tag: 'Resilience'
    },
    {
      icon: Lock,
      title: 'Zero-Trust Security & RBAC',
      desc: 'End-to-end TLS 1.3, AES-256-GCM encryption, 4 network VLANs, and tamper-proof audit trail.',
      href: '/vms/security',
      color: 'from-slate-700 to-slate-900',
      badge: 'TAMPER-PROOF AUDIT',
      tag: 'Governance'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 rounded-2xl p-8 border border-blue-800/50 shadow-2xl text-white">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 50%, #38BDF8 0%, transparent 45%), radial-gradient(circle at 85% 20%, #818CF8 0%, transparent 40%)'
          }}
        />

        <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-md shadow-sm">
                MODEL 4 CONSOLIDATED
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                STATE CCTV COMMAND PLATFORM
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Statewide Consolidated Central VMS
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
              Consolidated Video Management System integrating cameras across Gujarat Police, Traffic Directorate,
              Municipal Corporations, Transport, and Port Authorities. Features multi-task AI analytics (ANPR, Face
              Recognition, Crowd Density, Anomalies), tiered hot/warm/cold storage, and 80,000 camera scalability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/vms/live')}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Live Video Wall
            </button>
            <button
              onClick={() => navigate('/vms/ai-suite')}
              className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs px-4 py-3 rounded-xl transition"
            >
              <Cpu className="w-4 h-4" />
              Open AI Suite
            </button>
          </div>
        </div>

        {/* Real-time KPI Ribbon */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mt-8 pt-6 border-t border-blue-800/40">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Ingestion Grid</p>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">30 / 30</p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> 100% Online Feeds
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Certified Sizing</p>
            <p className="text-2xl font-black text-white mt-0.5">80,000</p>
            <p className="text-[10px] text-cyan-400 font-mono mt-0.5">140.8 Gbps Ingest</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Active Anomalies</p>
            <p className="text-2xl font-black text-rose-400 mt-0.5">{anomalies.length}</p>
            <p className="text-[10px] text-rose-300 font-mono mt-0.5">Tripwire / Wrong-Way</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Biometric Watchlist</p>
            <p className="text-2xl font-black text-violet-400 mt-0.5">{faceHits.length}</p>
            <p className="text-[10px] text-violet-300 font-mono mt-0.5">AFIS / NAFIS Matches</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Storage Architecture</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">3 Tiers</p>
            <p className="text-[10px] text-amber-300 font-mono mt-0.5">NVMe · Ceph · S3 WORM</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">DR Failover SLA</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">18.5s</p>
            <p className="text-[10px] text-emerald-300 font-mono mt-0.5">RTO &lt; 30s Met</p>
          </div>
        </div>
      </div>

      {/* Active Threat Strip if any */}
      {anomalies.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 border border-rose-500/40 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-200 uppercase tracking-wide">
                Priority Law Enforcement Interception Alerts
              </h3>
            </div>
            <button
              onClick={() => navigate('/vms/ai-suite')}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
            >
              View In AI Suite <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {anomalies.slice(0, 3).map(anom => (
              <div
                key={anom.id}
                className="bg-slate-900/80 rounded-xl p-3 border border-rose-500/30 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 text-[10px] font-black uppercase rounded-md">
                      {anom.severity}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">{anom.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{anom.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{anom.location}</p>
                </div>
                <button
                  onClick={() => navigate('/vms/ai-suite')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shrink-0 transition"
                >
                  Triage
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model 4 Consolidated Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Central VMS Operational Modules
            </h2>
            <p className="text-xs text-slate-500">
              Complete end-to-end management, AI vision processing, and inter-agency integration suites
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            9 Operational Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.href}
                onClick={() => navigate(mod.href)}
                className="group cursor-pointer bg-white hover:bg-slate-50/80 rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold font-mono uppercase px-2.5 py-1 bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-800 rounded-lg transition-colors">
                      {mod.badge}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {mod.tag}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statewide Architecture & Technology Stack Box */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Statewide Technology Stack & Enterprise Topology
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Production-certified infrastructure dimensions for Gujarat 80,000 camera rollout
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono rounded-lg">
            ARCH-SPEC-2026.4
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">VMS Platform</span>
            <p className="text-sm font-bold text-white mt-1">Consolidated Central VMS</p>
            <p className="text-[10px] text-slate-400 mt-1">RTSP TCP, HLS, WebRTC</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Storage Cluster</span>
            <p className="text-sm font-bold text-white mt-1">Ceph + S3 WORM</p>
            <p className="text-[10px] text-slate-400 mt-1">Hot, Warm, Cold Tiers</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">AI Streaming Bus</span>
            <p className="text-sm font-bold text-white mt-1">Kafka (256 Partitions)</p>
            <p className="text-[10px] text-slate-400 mt-1">1.25M msgs/sec Peak</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">GPU Analytics</span>
            <p className="text-sm font-bold text-white mt-1">400x NVIDIA GPUs</p>
            <p className="text-[10px] text-slate-400 mt-1">DeepStream + TensorRT</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Databases</span>
            <p className="text-sm font-bold text-white mt-1">TimescaleDB + PostGIS</p>
            <p className="text-[10px] text-slate-400 mt-1">Spatial-Temporal Sharding</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Orchestration</span>
            <p className="text-sm font-bold text-white mt-1">Kubernetes Dual SDC/DRS</p>
            <p className="text-[10px] text-slate-400 mt-1">Istio mTLS 1.3 Mesh</p>
          </div>
        </div>
      </div>
    </div>
  );
};
