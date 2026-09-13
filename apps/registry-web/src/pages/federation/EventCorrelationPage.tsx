import React, { useEffect, useState } from 'react';
import {
  Zap,
  Activity,
  Layers,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ArrowRight,
  Filter,
  Eye,
  Info,
  Server,
  Share2,
  RefreshCw
} from 'lucide-react';
import { federationService } from '../../services/federationService';
import { CorrelatedIncident, CorrelationRule, CorrelationGraphNode, CorrelationGraphEdge } from '../../types/federation.types';

export const EventCorrelationPage: React.FC = () => {
  const [correlations, setCorrelations] = useState<CorrelatedIncident[]>([]);
  const [rules, setRules] = useState<CorrelationRule[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<CorrelatedIncident | null>(null);
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'TIMELINE' | 'RULES'>('GRAPH');
  const [timelineStep, setTimelineStep] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingRule, setTogglingRule] = useState<string | null>(null);

  const loadData = async () => {
    const [corrs, rls] = await Promise.all([
      federationService.getCorrelations(),
      federationService.getRules()
    ]);
    setCorrelations(corrs);
    setRules(rls);
    if (corrs.length > 0 && !selectedIncident) {
      setSelectedIncident(corrs[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = federationService.subscribe(async () => {
      const corrs = await federationService.getCorrelations();
      setCorrelations(corrs);
    });
    return () => unsub();
  }, []);

  // Timeline auto-player
  useEffect(() => {
    let timer: any = null;
    if (isPlayingTimeline && selectedIncident && selectedIncident.triggerEvents.length > 0) {
      timer = setInterval(() => {
        setTimelineStep(prev => {
          if (prev >= selectedIncident.triggerEvents.length - 1) {
            setIsPlayingTimeline(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => timer && clearInterval(timer);
  }, [isPlayingTimeline, selectedIncident]);

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    setTogglingRule(ruleId);
    await federationService.toggleRule(ruleId, !currentActive);
    const updated = await federationService.getRules();
    setRules(updated);
    setTogglingRule(null);
  };

  const graphData = selectedIncident?.graphData || { nodes: [], edges: [] };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            COMPLEX EVENT PROCESSING (CEP) CORRELATION ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Cross-System Event Correlation
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Stateful multi-department CEP engine correlating spatial-temporal trigger sequences across disparate vendor VMS instances with interactive graph topology.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 shrink-0">
          {(['GRAPH', 'TIMELINE', 'RULES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'GRAPH' ? 'Correlation Graph' : tab === 'TIMELINE' ? 'Sequential Playback' : 'CEP Rules Engine'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Incident Selector + Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Correlated Incidents Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono">
              Correlated Incidents ({correlations.length})
            </h2>
            <button
              onClick={loadData}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {correlations.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setTimelineStep(0);
                    setIsPlayingTimeline(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {inc.incidentCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-2 leading-tight">{inc.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{inc.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-300">Score: {Math.round(inc.correlationScore * 100)}%</span>
                    <span>{inc.involvedVendors.length} VMS Systems</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Graph / Timeline / Rules Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'GRAPH' && selectedIncident && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      {selectedIncident.incidentCode}
                    </span>
                    <span className="text-xs font-bold text-rose-400 uppercase font-mono">
                      ● {selectedIncident.severity} SEVERITY
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white mt-2">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedIncident.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-500 font-mono">CONFIDENCE</p>
                  <p className="text-xl font-black text-emerald-400">{Math.round(selectedIncident.correlationScore * 100)}%</p>
                </div>
              </div>

              {/* Interactive SVG Correlation Graph Canvas */}
              <div className="relative bg-slate-950 rounded-2xl p-6 border border-slate-800/80 min-h-[380px] flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* Graph Node Flow Diagram */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-3 items-center py-6">
                  {graphData.nodes.map((node, idx) => {
                    const isTarget = node.type === 'TARGET';
                    const isCamera = node.type === 'CAMERA';
                    const isEvent = node.type === 'EVENT';

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          className={`p-3.5 rounded-2xl border text-center transition-all ${
                            isTarget
                              ? 'bg-gradient-to-br from-amber-600/30 to-rose-600/30 border-amber-500 text-white shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40'
                              : isCamera
                              ? 'bg-slate-800/90 border-cyan-500/50 text-slate-200'
                              : 'bg-slate-900/90 border-blue-500/40 text-slate-300'
                          }`}
                        >
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isTarget ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-cyan-300'
                          }`}>
                            {node.type}
                          </span>
                          <p className="text-xs font-black text-white mt-1.5 leading-snug">{node.label}</p>
                          {node.department && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{node.department}</p>
                          )}
                          {node.vmsVendor && (
                            <p className="text-[9px] font-mono text-cyan-400 mt-1">{node.vmsVendor.replace('_', ' ')}</p>
                          )}
                        </div>

                        {idx < graphData.nodes.length - 1 && (
                          <div className="hidden md:flex flex-col items-center justify-center">
                            <span className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                              {graphData.edges[idx]?.label || '→'}
                            </span>
                            <div className="w-full h-0.5 bg-gradient-to-r from-amber-500 to-cyan-500 relative">
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 absolute -right-1 -top-1.5" />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Graph Summary Footer */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>⏱ Time Delta: <strong className="text-white font-mono">{selectedIncident.timeWindowSeconds}s</strong></span>
                    <span>📍 Intercept ETA: <strong className="text-emerald-400 font-mono">{selectedIncident.estimatedEtaMinutes || 6.5} mins</strong></span>
                    <span>🏛 Lead Agency: <strong className="text-cyan-300">{selectedIncident.leadDepartment}</strong></span>
                  </div>

                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-1 rounded-md border border-amber-500/30">
                    CEP Engine State: CORRELATED_ACTIVE
                  </span>
                </div>
              </div>

              {/* Recommended Action SOP */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Standard Operating Procedure (SOP) Action Directive
                  </h4>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {selectedIncident.recommendedAction}
                  </p>
                  {selectedIncident.dispatchedUnits && selectedIncident.dispatchedUnits.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedIncident.dispatchedUnits.map(unit => (
                        <span key={unit} className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-cyan-300">
                          🚓 {unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TIMELINE' && selectedIncident && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-black text-white">Sequential Multi-VMS Incident Timeline</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Chronological playback of sensor trigger events leading to correlation</p>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTimelineStep(0);
                      setIsPlayingTimeline(false);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
                    title="Reset to first event"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition"
                  >
                    {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                    {isPlayingTimeline ? 'Pause' : 'Play Sequence'}
                  </button>
                </div>
              </div>

              {/* Step Sequence Visualizer */}
              <div className="space-y-4">
                {selectedIncident.triggerEvents.map((evt, idx) => {
                  const isActive = idx === timelineStep;
                  const isPassed = idx <= timelineStep;

                  return (
                    <div
                      key={evt.eventId}
                      onClick={() => setTimelineStep(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/60 border-cyan-400 ring-2 ring-cyan-400/30'
                          : isPassed
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">{evt.eventType}</span>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                            {evt.sourceVmsVendor.replace('_', ' ')}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(evt.timestamp).toLocaleTimeString()} (PTS: {Math.round(evt.ptsMs || 0)}ms)
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-300">
                        <p className="font-semibold">{evt.cameraName} — {evt.location}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Department: {evt.departmentName}</p>
                      </div>

                      {evt.payload && (
                        <div className="mt-3 bg-slate-950/80 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 flex gap-4 flex-wrap">
                          {Object.entries(evt.payload).map(([k, v]) => (
                            <span key={k}>
                              <strong className="text-cyan-400">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'RULES' && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-base font-black text-white">Complex Event Processing (CEP) Rules Matrix</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure spatial-temporal thresholds, confidence floors, and automated multi-agency trigger rules</p>
              </div>

              <div className="space-y-3">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      rule.isActive ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                            {rule.ruleCode}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                            ● {rule.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white mt-1.5">{rule.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rule.description}</p>
                      </div>

                      <button
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        disabled={togglingRule === rule.id}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition shrink-0 ${
                          rule.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                        }`}
                      >
                        {rule.isActive ? 'Active (ON)' : 'Disabled (OFF)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 rounded-xl p-3 mt-3 border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">TIME WINDOW</span>
                        <strong className="text-cyan-300 font-mono">{rule.maxTimeWindowSeconds}s ({Math.round(rule.maxTimeWindowSeconds / 60)} mins)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">MAX RADIUS</span>
                        <strong className="text-slate-200 font-mono">{rule.maxSpatialDistanceKm} km</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">MIN CONFIDENCE</span>
                        <strong className="text-emerald-400 font-mono">{Math.round(rule.minConfidence * 100)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TRIGGERS (24H)</span>
                        <strong className="text-amber-400 font-mono">{rule.triggerCount24h} hits</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
