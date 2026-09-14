import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Zap,
  ArrowUpRight,
  UserCheck,
  FileText,
  Send,
  Loader2,
  RefreshCw,
  Eye,
  Sliders,
  MapPin,
  Film,
  Car,
  Database
} from 'lucide-react';
import { federationService } from '../../services/federationService';
import { CorrelatedIncident, IncidentSeverity, IncidentStatus } from '../../types/federation.types';
import { useAuth } from '../../context/AuthContext';

export const UnifiedIncidentHubPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState<CorrelatedIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<CorrelatedIncident | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadIncidents = async () => {
    const data = await federationService.getCorrelations();
    setIncidents(data);
    if (data.length > 0 && !selectedIncident) {
      setSelectedIncident(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
    const unsub = federationService.subscribe(async () => {
      const data = await federationService.getCorrelations();
      setIncidents(data);
    });
    return () => unsub();
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    const matchesSev = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSearch = !searchQuery.trim() ||
      inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.leadDepartment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesStat && matchesSearch;
  });

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !officerNotes.trim()) return;

    setResolving(true);
    await federationService.resolveCorrelation(
      selectedIncident.id,
      currentUser ? `${currentUser.fullName} (${currentUser.badgeNumber})` : 'Authorized State Officer',
      officerNotes.trim()
    );
    await loadIncidents();
    setResolving(false);
    setResolveModalOpen(false);
    setOfficerNotes('');
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (stat: IncidentStatus) => {
    switch (stat) {
      case 'OPEN': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'INVESTIGATING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DISPATCHED': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-black text-white">Unified Incident & Alert Hub</h1>
              <p className="text-xs text-slate-400">
                Centralized cross-departmental incident triage, multi-agency dispatch, and resolution ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadIncidents}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Refresh Queue
          </button>
          <Link
            to="/federation/correlation"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-md"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            CEP Graph View
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, title, agency…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 w-52 sm:w-64"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map(stat => (
              <button
                key={stat}
                onClick={() => setStatusFilter(stat)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  statusFilter === stat
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono font-bold">
          Showing {filteredIncidents.length} of {incidents.length} Incidents
        </span>
      </div>

      {/* Main Incident Desk: Table Queue & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Queue List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredIncidents.map(inc => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`bg-slate-900 rounded-2xl p-5 border transition-all cursor-pointer shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                        {inc.incidentCode}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Rule: {inc.ruleCode}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${getStatusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white leading-snug">{inc.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{inc.description}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>🏛 Lead: <strong className="text-slate-200">{inc.leadDepartment}</strong></span>
                    <span>🔗 {inc.involvedVendors.length} VMS Platforms</span>
                  </div>
                  <span className="font-mono text-slate-500">
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredIncidents.length === 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No incidents match the active filter criteria</p>
              <p className="text-xs text-slate-500 mt-1">All departmental event triggers have been triaged and resolved.</p>
            </div>
          )}
        </div>

        {/* Right Column: Selected Incident Action Drawer */}
        <div className="space-y-4">
          {selectedIncident ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono font-black text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedIncident.incidentCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{selectedIncident.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedIncident.description}</p>
              </div>

              {/* SOP Action Box */}
              <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-500/30 space-y-2">
                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                  SOP Action Directive
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedIncident.recommendedAction}</p>
              </div>

              {/* Dispatched Units */}
              {selectedIncident.dispatchedUnits && selectedIncident.dispatchedUnits.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase mb-1.5">Assigned Patrol / Interception Units</p>
                  <div className="space-y-1.5">
                    {selectedIncident.dispatchedUnits.map(u => (
                      <div key={u} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-cyan-300 font-mono flex items-center gap-2">
                        <span>🚓</span> {u}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution State if resolved */}
              {selectedIncident.status === 'RESOLVED' && (
                <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-500/30 space-y-1 text-xs">
                  <p className="font-bold text-emerald-300">✓ Incident Resolved</p>
                  <p className="text-slate-300 text-[11px]"><strong className="text-slate-400">Officer:</strong> {selectedIncident.resolvedBy || 'Central Admin'}</p>
                  <p className="text-slate-300 text-[11px]"><strong className="text-slate-400">Notes:</strong> {selectedIncident.actionNotes || 'Target intercepted and validated'}</p>
                </div>
              )}

              {/* Action Buttons & Cross-Model Bridges */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/map`}
                    className="flex items-center justify-center gap-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 text-xs font-bold py-2 rounded-xl border border-blue-700/50 transition"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>M1: GIS Map</span>
                  </Link>

                  <Link
                    to={`/vms/tracking`}
                    className="flex items-center justify-center gap-1.5 bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold py-2 rounded-xl border border-cyan-700/50 transition"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>M2: Track Target</span>
                  </Link>
                </div>

                <Link
                  to={`/federation/correlation?incident=${selectedIncident.incidentCode}`}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Inspect M3 CEP Correlation Graph
                </Link>

                <Link
                  to={`/vms/playback`}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold py-2.5 rounded-xl border border-emerald-700/50 transition"
                >
                  <Film className="w-3.5 h-3.5" />
                  Export Section 65B Video Recording (M4)
                </Link>

                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setResolveModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-2.5 rounded-xl transition shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                    Log Interception &amp; Resolve Incident
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center text-slate-500">
              <p className="text-xs">Select an incident from the queue to review details and take action.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Incident Audit Modal */}
      {resolveModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Resolve Incident: {selectedIncident.incidentCode}</h3>
              </div>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Authorized Officer / Lead Investigator</label>
                <input
                  type="text"
                  disabled
                  value={currentUser ? `${currentUser.fullName} (${currentUser.badgeNumber}) — ${currentUser.role}` : 'State Command Officer'}
                  className="w-full bg-slate-800 text-slate-400 text-xs px-3 py-2 rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Interception Actions & Resolution Compliance Notes <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the actions taken by field units, vehicle verification status, challan issued, or suspect detained..."
                  value={officerNotes}
                  onChange={e => setOfficerNotes(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !officerNotes.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm & Commit to Audit Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
