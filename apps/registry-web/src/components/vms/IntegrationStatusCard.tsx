import React from 'react';
import { IntegrationEndpoint } from '../../types/camera.types';
import { CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

interface IntegrationStatusCardProps {
  endpoint: IntegrationEndpoint;
  onLookup?: (system: IntegrationEndpoint['system']) => void;
}

const STATUS_CONFIG = {
  CONNECTED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-950/40 border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400' },
  DEGRADED: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-950/40 border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400' },
  DISCONNECTED: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-950/40 border-rose-500/30', badge: 'bg-rose-500/20 text-rose-400' },
};

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({ endpoint, onLookup }) => {
  const cfg = STATUS_CONFIG[endpoint.status];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${cfg.bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${cfg.color}`} />
            <span className="text-sm font-bold text-white">{endpoint.name}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{endpoint.description}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {endpoint.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-xs font-bold text-white">{endpoint.latencyMs}ms</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Latency</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-xs font-bold text-white">{endpoint.queryRate}/min</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Query Rate</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-xs font-bold text-white">{endpoint.apiVersion}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">API Ver.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500 font-mono">
          Last sync: {new Date(endpoint.lastSync).toLocaleTimeString()}
        </p>
        {onLookup && endpoint.status !== 'DISCONNECTED' && (
          <button
            onClick={() => onLookup(endpoint.system)}
            className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors border border-blue-500/30"
          >
            <Zap className="w-3 h-3" /> Query
          </button>
        )}
      </div>
    </div>
  );
};
