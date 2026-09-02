import React, { useEffect, useState, useRef } from 'react';
import { Search, AlertTriangle, CheckCircle2, Clock, Car, ChevronRight, Loader2, Database, Radio, Shield, MapPin, Sparkles, Filter } from 'lucide-react';
import { vmsService } from '../../services/vmsService';
import { AnprDetection, VahanRecord } from '../../types/camera.types';

const VEHICLE_TYPE_ICON: Record<string, string> = {
  CAR: '🚗', TRUCK: '🚛', BUS: '🚌', MOTORCYCLE: '🏍️', BIKE: '🏍️', AUTO: '🛺', PERSON: '🚶', VEHICLE: '🚙'
};

export const AnprEnginePage: React.FC = () => {
  const [detections, setDetections] = useState<AnprDetection[]>(vmsService.getAnprDetections());
  const [selected, setSelected] = useState<AnprDetection | null>(null);
  const [filterWatchlist, setFilterWatchlist] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [lookupPlate, setLookupPlate] = useState('');
  const [lookupResult, setLookupResult] = useState<VahanRecord | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = vmsService.subscribe(() => {
      const all = vmsService.getAnprDetections();
      setDetections(all);
      if (!selected && all.length > 0) {
        setSelected(all[0]);
      }
    });
    return unsub;
  }, [selected]);

  const filtered = detections
    .filter(d => !filterWatchlist || d.watchlistHit)
    .filter(d => !searchPlate || d.plate.toLowerCase().includes(searchPlate.toLowerCase()));

  const handleVahanLookup = async () => {
    if (!lookupPlate.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    const result = await vmsService.lookupVahan(lookupPlate.trim().toUpperCase());
    setLookupResult(result);
    setLookupLoading(false);
  };

  const watchlistCount = detections.filter(d => d.watchlistHit).length;
  const avgConf = detections.length > 0
    ? Math.round(detections.reduce((s, d) => s + d.confidence, 0) / detections.length * 100)
    : 94;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 border border-blue-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Real-Time ANPR Optical Recognition Engine</h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  Automated Edge License Plate Extraction & Monotonic PTS Sighting Feed (Model 2)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-300 font-mono">YOLOv8 EDGE INFERENCE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-white font-mono">{detections.length}</p>
            <p className="text-[11px] text-blue-300 font-medium mt-0.5">Indexed Sightings</p>
          </div>
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-rose-300 font-mono">{watchlistCount}</p>
            <p className="text-[11px] text-rose-300 font-medium mt-0.5">Watchlist Incidents</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-cyan-300 font-mono">{avgConf}%</p>
            <p className="text-[11px] text-cyan-300 font-medium mt-0.5">Model Confidence</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur-md">
            <p className="text-2xl font-black text-emerald-300 font-mono">TCP RTSP</p>
            <p className="text-[11px] text-emerald-300 font-medium mt-0.5">Stream Transport</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Sightings Feed */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '640px', maxHeight: '78vh' }}>
          {/* Controls Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchPlate}
                  onChange={e => setSearchPlate(e.target.value)}
                  placeholder="Filter by plate number (e.g. GJ01, GJ05)..."
                  className="w-full bg-white text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                onClick={() => setFilterWatchlist(f => !f)}
                className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all ${
                  filterWatchlist
                    ? 'bg-rose-600 border-rose-700 text-white shadow-md shadow-rose-600/20'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Watchlist Only
              </button>
              <span className="text-xs font-semibold text-slate-500 font-mono px-2">
                {filtered.length} detections
              </span>
            </div>
          </div>

          {/* Sighting Cards Feed */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 divide-y-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span>Waiting for continuous camera stream frames…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(det => {
                  const isSelected = selected?.id === det.id;
                  return (
                    <div
                      key={det.id}
                      onClick={() => setSelected(det)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                        det.watchlistHit
                          ? isSelected
                            ? 'bg-rose-50/80 border-rose-500 shadow-md ring-2 ring-rose-400'
                            : 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                          : isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{VEHICLE_TYPE_ICON[det.vehicleType] || '🚗'}</span>
                          <span className="text-xs font-bold text-slate-700">{det.cameraName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {det.watchlistHit && (
                            <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                              FLAGGED
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            {Math.round(det.confidence * 100)}% MATCH
                          </span>
                        </div>
                      </div>

                      {/* Authentic Indian License Plate High-Contrast Card */}
                      <div className="bg-amber-300 border-2 border-slate-900 rounded-lg py-2.5 px-4 text-center shadow-sm relative overflow-hidden flex items-center justify-between">
                        {/* IND Blue Stripe */}
                        <div className="flex flex-col items-center justify-center bg-blue-700 text-white px-2 py-1 rounded text-[8px] font-black tracking-tighter leading-none border border-blue-800">
                          <span>🇮🇳</span>
                          <span className="mt-0.5">IND</span>
                        </div>
                        {/* Registration Number */}
                        <div className="flex-1 text-center font-black font-mono text-xl tracking-wider text-slate-950 uppercase">
                          {det.plate}
                        </div>
                        <div className="text-[9px] font-bold text-slate-700 uppercase">
                          {det.vehicleColor}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{det.cameraLocation}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(det.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Detailed Sighting & VAHAN Lookup */}
        <div className="space-y-4">
          {/* Detail Card */}
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Sighting Inspector</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {selected.id}</p>
                </div>
                {selected.watchlistHit && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    Watchlist Match
                  </span>
                )}
              </div>

              {/* Plate Big Box */}
              <div className={`p-4 rounded-xl border text-center ${selected.watchlistHit ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="inline-flex items-center gap-2 bg-amber-300 border-2 border-slate-900 rounded-lg px-4 py-2 shadow-sm">
                  <div className="bg-blue-700 text-white px-1.5 py-0.5 rounded text-[8px] font-black">IND</div>
                  <span className="text-2xl font-black font-mono text-slate-950 uppercase">{selected.plate}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-semibold">
                  {selected.vehicleColor} {selected.vehicleType} · {Math.round(selected.confidence * 100)}% Confidence
                </p>
                {selected.watchlistHit && (
                  <div className="mt-3 bg-rose-600 text-white rounded-xl p-3 text-left flex items-start gap-2 shadow-md">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">LAW ENFORCEMENT WATCHLIST HIT</p>
                      <p className="text-[11px] text-rose-100 mt-0.5">Cross-referenced with eGujCop / NAFIS stolen database.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sighting Metadata */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Camera Checkpoint</span>
                  <span className="font-semibold text-slate-800 text-right">{selected.cameraName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-800 text-right">{selected.cameraLocation}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Presentation Time (PTS)</span>
                  <span className="font-mono text-slate-800 text-right">{new Date(selected.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Stream Source</span>
                  <span className="font-mono text-blue-600 font-semibold">TCP RTSP / HLS Grid</span>
                </div>
              </div>

              {/* VAHAN Live Record */}
              {selected.vahanData && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>MoRTH VAHAN 4.0 Vehicle Data</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Registered Owner</span><span className="font-bold text-slate-800">{selected.vahanData.ownerName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Vehicle Class</span><span className="font-semibold text-slate-700">{selected.vahanData.vehicleClass}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Fuel Type</span><span className="font-semibold text-slate-700">{selected.vahanData.fuelType}</span></div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Insurance Status</span>
                      <span className={`font-bold ${selected.vahanData.insuranceValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selected.vahanData.insuranceValid ? '✓ Valid' : '✗ Expired'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending Challans</span>
                      <span className="font-mono font-bold text-slate-800">{selected.vahanData.challanCount} pending</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select any detection card to inspect OCR metadata and VAHAN registration.
            </div>
          )}

          {/* Manual VAHAN & Plate Search Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Direct VAHAN 4.0 Query</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupPlate}
                onChange={e => setLookupPlate(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVahanLookup()}
                placeholder="e.g. GJ01AB1234"
                className="flex-1 bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase font-bold"
              />
              <button
                onClick={handleVahanLookup}
                disabled={lookupLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Query'}
              </button>
            </div>
            {lookupResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="font-bold text-slate-800">{lookupResult.ownerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Class</span><span className="font-semibold text-slate-700">{lookupResult.vehicleClass}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fuel</span><span className="font-semibold text-slate-700">{lookupResult.fuelType}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Insurance</span><span className={`font-bold ${lookupResult.insuranceValid ? 'text-emerald-600' : 'text-rose-600'}`}>{lookupResult.insuranceValid ? '✓ Valid' : '✗ Expired'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Blacklisted</span><span className={`font-bold ${lookupResult.blacklisted ? 'text-rose-600' : 'text-emerald-600'}`}>{lookupResult.blacklisted ? '⚠ YES (eGujCop Alert)' : 'No'}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
