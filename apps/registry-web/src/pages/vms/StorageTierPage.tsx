import React from 'react';
import { vmsService } from '../../services/vmsService';
import { StorageTier } from '../../types/camera.types';
import { HardDrive, Flame, Snowflake, Wind, Clock, Server } from 'lucide-react';

const TIER_CONFIG = {
  HOT: { icon: Flame, color: 'text-red-400', bg: 'from-red-950 to-orange-950 border-red-700/40', barColor: '#EF4444' },
  WARM: { icon: Wind, color: 'text-amber-400', bg: 'from-amber-950 to-yellow-950 border-amber-700/40', barColor: '#F59E0B' },
  COLD: { icon: Snowflake, color: 'text-blue-400', bg: 'from-blue-950 to-slate-950 border-blue-700/40', barColor: '#3B82F6' },
};

function formatTB(tb: number): string {
  if (tb >= 1000) return `${(tb / 1000).toFixed(1)} PB`;
  return `${tb.toLocaleString()} TB`;
}

function calcBitrate(cameras: number, avgBitrateKbps = 2000): string {
  const totalGbps = (cameras * avgBitrateKbps) / 1e6;
  return `${totalGbps.toFixed(0)} Gbps`;
}

export const StorageTierPage: React.FC = () => {
  const tiers = vmsService.getStorageTiers();
  const scalability = vmsService.getScalabilityStats();
  const totalCapacity = tiers.reduce((s, t) => s + t.capacityTB, 0);
  const totalUsed = tiers.reduce((s, t) => s + t.usedTB, 0);

  // Simulate per-department retention
  const deptRetention = [
    { dept: 'Traffic Police', hot: 7, warm: 30, cold: 180 },
    { dept: 'Municipal Corp', hot: 7, warm: 45, cold: 90 },
    { dept: 'Transport Dept', hot: 14, warm: 60, cold: 365 },
    { dept: 'State HQ', hot: 30, warm: 90, cold: 730 },
    { dept: 'Rural Police', hot: 7, warm: 30, cold: 90 },
    { dept: 'Port Authority', hot: 14, warm: 60, cold: 365 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-600/60">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="w-5 h-5 text-slate-300" />
          <h2 className="text-lg font-black text-white">Storage Architecture</h2>
        </div>
        <p className="text-xs text-slate-400">
          Tiered storage design for scalable video retention across the statewide VMS platform
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total Capacity', value: formatTB(totalCapacity) },
            { label: 'Currently Used', value: formatTB(totalUsed) },
            { label: 'Utilization', value: `${Math.round((totalUsed / totalCapacity) * 100)}%` },
            { label: 'Daily Ingestion', value: `${scalability.storagePerDayTB} TB` },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-white">{item.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map(tier => {
          const cfg = TIER_CONFIG[tier.name];
          const Icon = cfg.icon;
          const usagePct = Math.round((tier.usedTB / tier.capacityTB) * 100);

          return (
            <div key={tier.name} className={`bg-gradient-to-br ${cfg.bg} border rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                  <span className="text-base font-black text-white">{tier.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{tier.retentionDays}d retention</span>
              </div>

              {/* Capacity bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Capacity</span>
                  <span className="font-bold text-white">{usagePct}% used</span>
                </div>
                <div className="h-2.5 bg-slate-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${usagePct}%`, backgroundColor: cfg.barColor }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{formatTB(tier.usedTB)} used</span>
                  <span>{formatTB(tier.capacityTB)} total</span>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Technology', value: tier.technology },
                  { label: 'Access Latency', value: tier.accessLatency },
                  { label: 'Cost', value: `₹${(tier.costPerTBMonth * 85).toFixed(0)}/TB/month` },
                  { label: 'Cameras', value: `${tier.cameras.toLocaleString()}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-slate-200 font-medium text-right max-w-[60%] text-[11px]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 80K Camera Load Simulation */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Scalability — 80,000 Camera Load Estimate</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Peak Ingest', value: calcBitrate(80000), sub: '@ 2 Mbps avg per camera' },
            { label: 'Daily Storage', value: `${scalability.storagePerDayTB} TB`, sub: 'before compression' },
            { label: 'Annual Storage', value: formatTB(scalability.storagePerDayTB * 365), sub: 'raw (180d cold)' },
            { label: 'GPU Inference', value: `${scalability.gpuNodes} nodes`, sub: 'NVIDIA A100/H100' },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-sm font-black text-blue-400">{item.value}</p>
              <p className="text-xs font-bold text-white mt-1">{item.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { layer: 'Object Storage', tech: 'Ceph / S3-compatible distributed' },
            { layer: 'Stream Broker', tech: 'Apache Kafka (2,400 partitions)' },
            { layer: 'AI Inference', tech: 'NVIDIA DeepStream + Triton' },
            { layer: 'Database', tech: 'PostgreSQL + TimescaleDB' },
            { layer: 'Orchestration', tech: 'Kubernetes (K8s) 3,200+ pods' },
            { layer: 'Network', tech: 'GSWAN + 100Gbps backbone' },
          ].map(row => (
            <div key={row.layer} className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{row.layer}</p>
              <p className="text-slate-200 font-semibold mt-1">{row.tech}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Retention policy matrix */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden">
        <div className="p-4 border-b border-slate-700/60">
          <h3 className="text-sm font-bold text-white">Retention Policy Matrix</h3>
          <p className="text-xs text-slate-400 mt-0.5">Configurable per-department data retention lifecycle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/60">
                <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Department</th>
                <th className="text-center px-4 py-2.5 text-red-400 font-semibold">🔥 Hot (days)</th>
                <th className="text-center px-4 py-2.5 text-amber-400 font-semibold">🌤 Warm (days)</th>
                <th className="text-center px-4 py-2.5 text-blue-400 font-semibold">❄️ Cold (days)</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {deptRetention.map(row => (
                <tr key={row.dept} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200 font-semibold">{row.dept}</td>
                  <td className="px-4 py-2.5 text-center text-red-300 font-mono">{row.hot}</td>
                  <td className="px-4 py-2.5 text-center text-amber-300 font-mono">{row.warm}</td>
                  <td className="px-4 py-2.5 text-center text-blue-300 font-mono">{row.cold}</td>
                  <td className="px-4 py-2.5 text-center text-slate-300 font-bold font-mono">{row.hot + row.warm + row.cold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
