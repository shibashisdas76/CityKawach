import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, PlusCircle, CheckCircle2, Search, Filter, Radio, Clock, MapPin, User, FileText, Loader2, Navigation, Zap, Film, Car } from 'lucide-react';

interface WatchlistRecord {
  id: number;
  plate_number: string;
  owner_name?: string;
  vehicle_model?: string;
  reason: string;
  severity: string;
  source?: string;
  active: number;
  created_at?: string;
}

interface AlertIncident {
  id: number;
  detection_id?: number;
  camera_id: string;
  camera_name?: string;
  location: string;
  plate_number: string;
  reason: string;
  severity: string;
  source?: string;
  confidence: number;
  timestamp: string;
  resolved: number;
  resolved_by?: string;
  action_notes?: string;
}

export const AlertsHubPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertIncident[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'watchlist'>('alerts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertIncident | null>(null);

  // New Watchlist Form State
  const [newPlate, setNewPlate] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState('CRITICAL');
  const [newSource, setNewSource] = useState('eGujCop');
  const [submitting, setSubmitting] = useState(false);

  // Resolution Form State
  const [resolveOfficer, setResolveOfficer] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const fetchAlertsAndWatchlist = async () => {
    try {
      const resAlerts = await fetch(`${API_BASE}/api/alerts`);
      if (resAlerts.ok) {
        const data = await resAlerts.json();
        setAlerts(data);
      }
      const resWatchlist = await fetch(`${API_BASE}/api/watchlist`);
      if (resWatchlist.ok) {
        const data = await resWatchlist.json();
        setWatchlist(data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchAlertsAndWatchlist();
    const interval = setInterval(fetchAlertsAndWatchlist, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: newPlate.trim(),
          owner_name: newOwner.trim(),
          vehicle_model: newModel.trim(),
          reason: newReason.trim(),
          severity: newSeverity,
          source: newSource,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewPlate('');
        setNewOwner('');
        setNewModel('');
        setNewReason('');
        fetchAlertsAndWatchlist();
      }
    } catch (e) {
      console.error('Failed to add watchlist entry:', e);
    }
    setSubmitting(false);
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !resolveOfficer.trim() || !resolveNotes.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${selectedAlert.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved_by: resolveOfficer.trim(),
          action_notes: resolveNotes.trim(),
        }),
      });
      if (res.ok) {
        setSelectedAlert(null);
        setResolveOfficer('');
        setResolveNotes('');
        fetchAlertsAndWatchlist();
      }
    } catch (e) {
      console.error('Failed to resolve alert:', e);
    }
    setResolving(false);
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-6 border border-rose-800/60 shadow-xl relative overflow-hidden text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-600/30 border border-rose-500/40 rounded-xl text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Law Enforcement Watchlist & Alert Incident Hub</h2>
                <p className="text-xs text-rose-200 mt-0.5">
                  Automated Cross-Referencing with eGujCop, NAFIS & CCTNS Hotlists (Model 2)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Flag New Vehicle</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-rose-400 font-mono">{unresolvedCount}</p>
            <p className="text-[11px] text-rose-200 mt-0.5">Active Unresolved Incidents</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-amber-400 font-mono">{criticalCount}</p>
            <p className="text-[11px] text-amber-200 mt-0.5">Critical Priority Matches</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-white font-mono">{watchlist.length || 8}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">Target Watchlist Pool</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-emerald-400 font-mono">100%</p>
            <p className="text-[11px] text-emerald-200 mt-0.5">Automated Match Rate</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Real-time Watchlist Hits ({alerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'watchlist'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Flagged Vehicle Registry ({watchlist.length})</span>
        </button>
      </div>

      {/* Tab 1: Real-time Incident Hits */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3 ${
                  alert.resolved
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                    : 'bg-amber-50/60 border-amber-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {alert.severity} PRIORITY
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      Source: {alert.source || 'eGujCop'}
                    </span>
                  </div>

                  {/* License Plate Display */}
                  <div className="mt-3 bg-amber-300 border-2 border-slate-900 rounded-lg py-2 px-3 text-center shadow-xs flex items-center justify-between">
                    <div className="bg-blue-700 text-white px-1.5 py-0.5 rounded text-[8px] font-black">IND</div>
                    <span className="font-black font-mono text-lg text-slate-950 uppercase">{alert.plate_number}</span>
                    <span className="text-[9px] font-bold text-slate-700">ALERT</span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                    <p className="font-bold text-slate-900">{alert.reason}</p>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 4-Model Cross Bridges */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/60">
                    <Link
                      to={`/vms/tracking?plate=${alert.plate_number}`}
                      className="py-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] text-center border border-emerald-200 flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>M2 Track</span>
                    </Link>
                    <Link
                      to={`/federation/correlation?plate=${alert.plate_number}`}
                      className="py-1 px-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] text-center border border-purple-200 flex items-center justify-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>M3 CEP</span>
                    </Link>
                    <Link
                      to={`/vms/playback?plate=${alert.plate_number}`}
                      className="py-1 px-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] text-center border border-blue-200 flex items-center justify-center gap-1"
                    >
                      <Film className="w-3 h-3" />
                      <span>M4 DVR</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  {alert.resolved ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolved by {alert.resolved_by || 'Officer'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm"
                    >
                      Acknowledge & Intercept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Flagged Vehicle Registry */}
      {activeTab === 'watchlist' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Registration Plate</th>
                  <th className="py-3 px-4">Owner & Vehicle</th>
                  <th className="py-3 px-4">Reason / FIR Flag</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Database Source</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {watchlist.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="bg-amber-300 border border-slate-800 text-slate-950 font-black font-mono px-2 py-0.5 rounded text-xs">
                        {item.plate_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{item.owner_name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">{item.vehicle_model || 'Unknown Model'}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold max-w-xs">{item.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.source || 'eGujCop'}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 font-bold text-[11px]">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Flag New Vehicle */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Register Flagged Vehicle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddWatchlist} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={e => setNewPlate(e.target.value)}
                  placeholder="e.g. GJ01AB1234"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={e => setNewOwner(e.target.value)}
                  placeholder="e.g. Vikram Rathore"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Model & Color</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  placeholder="e.g. White Mahindra Scorpio"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">FIR Flag / Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="e.g. Stolen Vehicle under IPC 379 - FIR #2026/901"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Database Source</label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="eGujCop">eGujCop</option>
                    <option value="NAFIS">NAFIS (CBI)</option>
                    <option value="CCTNS">CCTNS</option>
                    <option value="Traffic Police">Traffic Police</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register to Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Acknowledge & Resolve Alert */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Acknowledge Sighting Alert</h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-mono font-black text-base text-rose-900">{selectedAlert.plate_number}</p>
              <p className="font-semibold text-rose-800">{selectedAlert.reason}</p>
              <p className="text-rose-600">{selectedAlert.location} · {new Date(selectedAlert.timestamp).toLocaleTimeString()}</p>
            </div>
            <form onSubmit={handleResolveAlert} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Responding Officer Name / Badge *</label>
                <input
                  type="text"
                  required
                  value={resolveOfficer}
                  onChange={e => setResolveOfficer(e.target.value)}
                  placeholder="e.g. Insp. K. Parmar (GJ-POL-8821)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Action Taken / Resolution Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="e.g. PCR Van #12 dispatched to intercept vehicle at toll plaza."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                >
                  {resolving ? 'Logging...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
