import React, { useEffect, useState } from 'react';
import { Grid, Grid2X2, LayoutGrid, Maximize2, RefreshCw, Wifi, Filter, Search, Layers, Radio, Camera } from 'lucide-react';
import { VideoPlayer } from '../../components/vms/VideoPlayer';
import { vmsService } from '../../services/vmsService';
import { SentinelCamera } from '../../types/camera.types';

type GridSize = 1 | 4 | 9 | 16;

export const LiveVideoWallPage: React.FC = () => {
  const [cameras, setCameras] = useState<SentinelCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fullscreenCam, setFullscreenCam] = useState<SentinelCamera | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [searchCam, setSearchCam] = useState('');

  useEffect(() => {
    const load = async () => {
      const cams = await vmsService.loadCatalogue();
      setCameras(cams);
      setSelectedIds(cams.slice(0, 4).map(c => c.id));
      setLoading(false);
    };
    load();
    const unsub = vmsService.subscribe(() => setCameras(vmsService.getCatalogue()));
    return unsub;
  }, []);

  const districts = ['ALL', ...Array.from(new Set(cameras.map(c => c.district || 'Gujarat')))];
  const filtered = cameras
    .filter(c => filterDistrict === 'ALL' || (c.district || 'Gujarat') === filterDistrict)
    .filter(c => !searchCam || c.name.toLowerCase().includes(searchCam.toLowerCase()) || c.location.toLowerCase().includes(searchCam.toLowerCase()));

  const activeGrid = cameras.filter(c => selectedIds.includes(c.id));

  const gridCols: Record<GridSize, string> = {
    1: 'grid-cols-1',
    4: 'grid-cols-1 sm:grid-cols-2',
    9: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    16: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  const toggleCamera = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= gridSize) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const setGrid = (size: GridSize) => {
    setGridSize(size);
    setSelectedIds(cameras.slice(0, size).map(c => c.id));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-200 text-sm font-bold">Connecting to Sentinel Camera Grid…</p>
        <p className="text-slate-400 text-xs mt-1">Ingesting live catalogue across 30 statewide feeds</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-lg font-black tracking-tight">Unified Multi-Camera Video Wall</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sentinel Grid Gateway · {cameras.filter(c => c.live).length} Live Streams · Monotonic PTS Synchronization
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
          {/* District Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDistrict}
              onChange={e => setFilterDistrict(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {districts.map(d => <option key={d} value={d} className="bg-slate-900">{d === 'ALL' ? 'All Districts' : d}</option>)}
            </select>
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden p-0.5">
            {([1, 4, 9, 16] as GridSize[]).map(size => (
              <button
                key={size}
                onClick={() => setGrid(size)}
                className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg ${
                  gridSize === size ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {size === 1 ? '1×1' : size === 4 ? '2×2' : size === 9 ? '3×3' : '4×4'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300 font-mono">HLS LIVE RELAY</span>
          </div>
        </div>
      </div>

      {/* Horizontal Camera Quick-Selector Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
            Feeds ({selectedIds.length}/{gridSize}):
          </span>
          {cameras.map(cam => {
            const isSelected = selectedIds.includes(cam.id);
            return (
              <button
                key={cam.id}
                onClick={() => toggleCamera(cam.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cam.live ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="font-bold">{cam.id.toUpperCase()}</span>
                <span className="text-slate-400 text-[10px] truncate max-w-[120px]">{cam.name.replace(/^\d+\s*/, '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Wall Grid Container */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Main Grid Slots */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className={`grid ${gridCols[gridSize]} gap-3`}>
            {Array.from({ length: gridSize }).map((_, i) => {
              const cam = activeGrid[i];
              if (!cam) return (
                <div
                  key={`empty-${i}`}
                  className="aspect-video bg-slate-900/90 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 p-4"
                >
                  <Camera className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-semibold">Slot {i + 1} Available</p>
                  <p className="text-[10px] text-slate-600">Select a camera from the feed ribbon</p>
                </div>
              );
              return (
                <div key={cam.id} className="relative rounded-xl overflow-hidden shadow-md group">
                  <VideoPlayer
                    camera={cam}
                    showOverlay
                    compact={gridSize >= 9}
                    onFullscreen={setFullscreenCam}
                  />
                </div>
              );
            })}
          </div>

          {/* Grid Footer Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-3">
              <span>Transport: <b>RTSP over TCP / HLS Relay</b></span>
              <span>•</span>
              <span>Gateway: <b>https://cctv.corp8.cloud</b></span>
            </div>
            <div>
              <span>Monotonic PTS Timing · Auto-reconnect backoff (2s → 30s)</span>
            </div>
          </div>
        </div>

        {/* Sidebar Camera Directory */}
        <div className="w-full xl:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '780px' }}>
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Feed Directory</p>
            <div className="mt-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchCam}
                onChange={e => setSearchCam(e.target.value)}
                placeholder="Search camera…"
                className="w-full bg-white text-xs pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.map(cam => {
              const isActive = selectedIds.includes(cam.id);
              return (
                <button
                  key={cam.id}
                  onClick={() => toggleCamera(cam.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all border ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                      : 'bg-slate-50/50 border-transparent text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cam.live ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <div className="truncate">
                        <p className="font-semibold text-xs truncate">{cam.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{cam.location}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase shrink-0 pl-1">{cam.codec}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fullscreen Single View Modal */}
      {fullscreenCam && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-between p-6 backdrop-blur-md"
          onClick={() => setFullscreenCam(null)}
        >
          <div className="flex items-center justify-between text-white mb-3" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-black">{fullscreenCam.name}</h3>
              <p className="text-xs text-slate-400">{fullscreenCam.location} · {fullscreenCam.district}</p>
            </div>
            <button
              onClick={() => setFullscreenCam(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              ✕ Close Preview
            </button>
          </div>
          <div className="flex-1 max-w-6xl w-full mx-auto flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <VideoPlayer camera={fullscreenCam} showOverlay />
          </div>
        </div>
      )}
    </div>
  );
};
