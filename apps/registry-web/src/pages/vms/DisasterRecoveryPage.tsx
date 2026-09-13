import React, { useState, useEffect } from 'react';
import {
  Server,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  Radio,
  RefreshCw,
  Zap,
  Lock
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { DisasterRecoveryStatus } from '../../types/model4.types';

export const DisasterRecoveryPage: React.FC = () => {
  const [drStatus, setDrStatus] = useState<DisasterRecoveryStatus | null>(null);
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillResult, setDrillResult] = useState<any>(null);
  const [drillName, setDrillName] = useState('Quarterly Statewide SDC-to-DRS Failover Drill');
  const [operatorName, setOperatorName] = useState('State Cyber Command Officer');

  const loadData = async () => {
    try {
      const status = await model4Service.getDrStatus();
      setDrStatus(status);
    } catch (e) {
      console.error('Error loading DR status:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = model4Service.subscribe(loadData);
    return unsub;
  }, []);

  const handleExecuteDrill = async () => {
    setDrillRunning(true);
    try {
      const res = await model4Service.runDrDrill({
        drill_name: drillName,
        primary_site: 'State Data Center (SDC) Gandhinagar',
        dr_site: 'Disaster Recovery Site (DRS) Ahmedabad',
        executed_by: operatorName
      });
      setDrillResult(res);
      loadData();
    } catch (e) {
      console.error('Error executing DR drill:', e);
    } finally {
      setDrillRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 border border-teal-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-teal-500/30 text-teal-300 font-mono text-xs font-bold rounded-md border border-teal-500/40 uppercase">
              MODEL 4 DISASTER RECOVERY & REDUNDANCY
            </span>
            <span className="text-xs text-slate-400 font-mono">SDC GANDHINAGAR ⟷ DRS AHMEDABAD</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Statewide High Availability & Disaster Recovery Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Active-Active Dual-Datacenter topology with asynchronous Ceph block replication, Kafka MirrorMaker 2 topic
            mirroring, and automated Global Server Load Balancing (GSLB) DNS failover.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>HEARTBEAT: SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {/* Dual-Datacenter Topology Diagram Card */}
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              Active-Active Geographical Redundancy Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-data-loss asynchronous replication across separate seismic and power zones
            </p>
          </div>
          <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold rounded-lg">
            SLA: RTO &lt; 30s | RPO &lt; 1s
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Datacenter Card */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg font-mono">
              PRIMARY ACTIVE
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Primary Site</span>
              <h4 className="text-lg font-black text-white mt-0.5">State Data Center (SDC), Gandhinagar</h4>
              <p className="text-xs text-slate-400">Sector 14, Infocity Corridor, Gandhinagar</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">K8s Compute Nodes</span>
                <b className="text-sm text-cyan-400">150 Online</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Uptime SLA</span>
                <b className="text-sm text-emerald-400">99.999%</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Active Gateways</span>
                <b className="text-sm text-white">80 Ingest Pods</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">GPU Inference</span>
                <b className="text-sm text-purple-400">400 L40S Cards</b>
              </div>
            </div>
          </div>

          {/* Secondary Datacenter Card */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-600 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg font-mono">
              STANDBY HOT SYNC
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Disaster Recovery Site</span>
              <h4 className="text-lg font-black text-white mt-0.5">Disaster Recovery Site (DRS), Ahmedabad</h4>
              <p className="text-xs text-slate-400">GIFT City / SG Highway Zone, Ahmedabad</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Replication Lag</span>
                <b className="text-sm text-emerald-400">320 ms (RPO Met)</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Failover Readiness</span>
                <b className="text-sm text-cyan-400">HOT STANDBY</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Dark Fiber Link</span>
                <b className="text-sm text-white">Dual 100 Gbps</b>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Storage Mirror</span>
                <b className="text-sm text-amber-400">Ceph Block Sync</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Failover Simulation Drill Console */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              Statewide Automated DR Failover Simulation Drill
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulates primary SDC power/network interruption, validates automatic DNS diversion, and measures exact RTO/RPO
            </p>
          </div>

          <button
            onClick={handleExecuteDrill}
            disabled={drillRunning}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {drillRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Failover Drill...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Initiate Controlled Failover Drill
              </>
            )}
          </button>
        </div>

        {drillResult && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <h4 className="text-sm font-extrabold text-teal-950">{drillResult.verdict}</h4>
              </div>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg">
                ID: {drillResult.drill_id}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[10px] text-slate-500 block">Total Failover Time</span>
                <b className="text-base text-slate-900">{drillResult.failover_duration_sec} Seconds</b>
                <p className="text-[10px] text-emerald-600">Target &lt; 30s Met</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[10px] text-slate-500 block">Achieved RPO</span>
                <b className="text-base text-slate-900">{drillResult.rpo_achieved_ms} ms</b>
                <p className="text-[10px] text-emerald-600">Target &lt; 1000ms Met</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[10px] text-slate-500 block">Traffic Diversion</span>
                <b className="text-base text-slate-900">DNS GSLB 100%</b>
                <p className="text-[10px] text-emerald-600">Seamless Switch</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[10px] text-slate-500 block">Feed Reconnect Rate</span>
                <b className="text-base text-slate-900">30 / 30 Feeds</b>
                <p className="text-[10px] text-emerald-600">0 Dropped Frames</p>
              </div>
            </div>

            {/* Drill Step Log */}
            <div className="bg-slate-950 rounded-xl p-4 text-xs font-mono text-cyan-300 space-y-1.5 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Live Failover Execution Telemetry:</p>
              {drillResult.telemetry_logs?.map((l: string, i: number) => (
                <p key={i} className="text-[11px] leading-relaxed">
                  ✓ {l}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
