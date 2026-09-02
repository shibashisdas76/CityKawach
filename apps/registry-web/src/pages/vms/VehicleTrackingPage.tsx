import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { vmsService } from '../../services/vmsService';
import { VehicleTrack } from '../../types/camera.types';
import { MapPin, Clock, Navigation, AlertTriangle, ChevronRight, Activity, Search, ShieldCheck, Play, RotateCcw, Compass, Gauge } from 'lucide-react';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const QUICK_PLATES = ['GJ01AB1234', 'GJ05CD5678', 'GJ27K9901', 'GJ18CX4521', 'GJ03XY8890', 'MH02AB1234'];

export const VehicleTrackingPage: React.FC = () => {
  const [tracks, setTracks] = useState<VehicleTrack[]>(vmsService.getVehicleTracks());
  const [searchQuery, setSearchQuery] = useState('GJ01AB1234');
  const [selected, setSelected] = useState<VehicleTrack | null>(tracks[0] ?? null);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = vmsService.subscribe(() => {
      const t = vmsService.getVehicleTracks();
      setTracks(t);
      if (!selected && t.length > 0) setSelected(t[0]);
    });
    return unsub;
  }, [selected]);

  const handleSearch = async (plateToSearch?: string) => {
    const query = (plateToSearch || searchQuery).trim().toUpperCase();
    if (!query) return;
    setLoadingSearch(true);
    const result = await vmsService.searchPlateTrajectory(query);
    if (result) {
      setSelected(result);
      setReplayIdx(0);
      setReplaying(false);
    }
    setLoadingSearch(false);
  };

  const startReplay = () => {
    if (!selected || selected.sightings.length < 2) return;
    setReplayIdx(selected.sightings.length - 1);
    setReplaying(true);
    if (replayRef.current) clearInterval(replayRef.current);
    replayRef.current = setInterval(() => {
      setReplayIdx(prev => {
        if (prev <= 0) {
          clearInterval(replayRef.current!);
          setReplaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 900);
  };

  const resetReplay = () => {
    if (replayRef.current) clearInterval(replayRef.current);
    setReplaying(false);
    setReplayIdx(0);
  };

  useEffect(() => () => { if (replayRef.current) clearInterval(replayRef.current); }, []);

  const routePoints = selected
    ? (replaying ? selected.sightings.slice(replayIdx) : selected.sightings)
        .map(s => [s.lat, s.lng] as [number, number])
    : [];

  const mapCenter: [number, number] = selected?.sightings[0]
    ? [selected.sightings[0].lat, selected.sightings[0].lng]
    : [22.5, 72.5];

  const watchlistPlates = new Set(['GJ01AB1234', 'GJ05CD5678', 'GJ27K9901', 'GJ18CX4521', 'MH02AB1234', 'RJ14GH8822']);
  const isSelectedWatchlist = selected ? watchlistPlates.has(selected.plate) : false;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 border border-emerald-800/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-emerald-400">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Statewide Vehicle Movement Tracing & Trajectory Reconstructor</h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Checkpoint-to-Checkpoint Journey Reconstruction Ordered by Presentation Timestamps (Model 2)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-900/50 border border-emerald-500/40 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-white font-mono">{tracks.length}</p>
              <p className="text-[10px] text-emerald-300">Active Trajectories</p>
            </div>
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-rose-300 font-mono">
                {tracks.filter(t => watchlistPlates.has(t.plate)).length}
              </p>
              <p className="text-[10px] text-rose-300">Watchlisted Targets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plate Search Bar & Quick Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Vehicle Plate (e.g. GJ01AB1234, GJ05CD5678)..."
              className="w-full bg-slate-50 text-slate-900 text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase tracking-wider"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loadingSearch}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingSearch ? 'Reconstructing...' : 'Trace Vehicle Journey'}
          </button>
        </div>

        {/* Quick select pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] whitespace-nowrap">Suggested Targets:</span>
          {QUICK_PLATES.map(p => (
            <button
              key={p}
              onClick={() => {
                setSearchQuery(p);
                handleSearch(p);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all border ${
                selected?.plate === p
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Track List on Left, Map & Journey Timeline on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left Col: Track History List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '620px', maxHeight: '78vh' }}>
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Tracked Vehicle Pool</h3>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{tracks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {tracks.map(track => {
              const isWatch = watchlistPlates.has(track.plate);
              const isCurrent = selected?.plate === track.plate;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    setSelected(track);
                    setSearchQuery(track.plate);
                    setReplayIdx(0);
                    setReplaying(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-emerald-50 border border-emerald-400 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isWatch && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        <span className="font-mono font-black text-xs text-slate-900 uppercase">{track.plate}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {track.sightings.length} checkpoints · {track.totalDistance} km
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      track.status === 'MOVING' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {track.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Interactive GIS Route Map & Trajectory Timeline */}
        <div className="xl:col-span-3 space-y-4">
          {/* Leaflet Map Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-1">
            <div className="h-[380px] w-full rounded-xl overflow-hidden relative">
              <MapContainer
                center={mapCenter}
                zoom={9}
                style={{ width: '100%', height: '100%' }}
                key={selected?.id}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {selected && routePoints.length > 1 && (
                  <Polyline
                    positions={routePoints}
                    pathOptions={{ color: '#059669', weight: 4, dashArray: '8 6', opacity: 0.85 }}
                  />
                )}
                {selected && selected.sightings.map((s, i) => {
                  const isVisible = replaying ? i >= replayIdx : true;
                  if (!isVisible) return null;
                  const isLatest = i === 0;
                  return (
                    <CircleMarker
                      key={`${s.cameraId}-${i}`}
                      center={[s.lat, s.lng]}
                      radius={isLatest ? 10 : 7}
                      pathOptions={{
                        color: isLatest ? '#DC2626' : '#059669',
                        fillColor: isLatest ? '#DC2626' : '#10B981',
                        fillOpacity: 0.85,
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1">
                          <p className="font-bold text-slate-900">{s.cameraName}</p>
                          <p className="text-slate-600">{s.location}</p>
                          <p className="font-mono text-[11px] text-slate-500 mt-1">{new Date(s.timestamp).toLocaleString()}</p>
                          {s.speed && <p className="text-emerald-600 font-semibold">Speed: ~{s.speed} km/h</p>}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>

              {/* Map Floating Legend */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-md flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>Latest Sighting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Historical Checkpoints</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Journey Timeline & Replay Controls */}
          {selected && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-300 border border-slate-900 rounded-md px-3 py-1 text-sm font-black font-mono text-slate-950">
                      {selected.plate}
                    </div>
                    {isSelectedWatchlist && (
                      <span className="bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        ⚠️ FLAGGED IN WATCHLIST
                      </span>
                    )}
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                      {selected.sightings.length} Checkpoints Indexed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    First Sighting: {new Date(selected.firstSeen).toLocaleTimeString()} · Last Sighting: {new Date(selected.lastSeen).toLocaleTimeString()} · Total Route: {selected.totalDistance} km
                  </p>
                </div>

                {/* Replay Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startReplay}
                    disabled={replaying}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{replaying ? 'Replaying Journey…' : 'Replay Path'}</span>
                  </button>
                  <button
                    onClick={resetReplay}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    title="Reset Journey"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chronological Checkpoint Stream */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                {selected.sightings.map((s, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-xs flex items-center justify-center ${idx === 0 ? 'bg-red-600' : 'bg-emerald-600'}`} />
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span className="font-bold text-slate-800 text-sm">{s.location}</span>
                          <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">{s.cameraName}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(s.timestamp).toLocaleTimeString()} ({new Date(s.timestamp).toLocaleDateString()})</span>
                          </div>
                          {s.speed && (
                            <div className="flex items-center gap-1 text-slate-600 font-semibold">
                              <Gauge className="w-3.5 h-3.5 text-blue-500" />
                              <span>~{s.speed} km/h</span>
                            </div>
                          )}
                          {s.direction && (
                            <div className="flex items-center gap-1 text-slate-600 font-semibold">
                              <Compass className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Heading {s.direction}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block">Checkpoint Status</span>
                        <span className="text-xs font-bold text-emerald-600 font-mono">VERIFIED PTS</span>
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
