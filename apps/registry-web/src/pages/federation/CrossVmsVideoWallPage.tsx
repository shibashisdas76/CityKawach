import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Grid,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Layers,
  Compass,
  Volume2,
  VolumeX,
  Camera,
  Activity,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Wifi
} from 'lucide-react';
import { federationService } from '../../services/federationService';
import { FederatedCamera, VmsPlatform, VmsVendor } from '../../types/federation.types';
import { VideoPlayer } from '../../components/vms/VideoPlayer';

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';

export const CrossVmsVideoWallPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialVmsFilter = searchParams.get('vms') || 'ALL';

  const [cameras, setCameras] = useState<FederatedCamera[]>([]);
  const [platforms, setPlatforms] = useState<VmsPlatform[]>([]);
  const [selectedVms, setSelectedVms] = useState<string>(initialVmsFilter);
  const [selectedLayout, setSelectedLayout] = useState<GridLayout>('3x3');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCamForPtz, setSelectedCamForPtz] = useState<FederatedCamera | null>(null);
  const [ptzState, setPtzState] = useState({ pan: 0, tilt: 0, zoom: 1 });
  const [fullscreenCam, setFullscreenCam] = useState<FederatedCamera | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cams, plats] = await Promise.all([
        federationService.getFederatedCameras(),
        federationService.getPlatforms()
      ]);
      setCameras(cams);
      setPlatforms(plats);
      if (cams.length > 0) {
        setSelectedCamForPtz(cams[0]);
      }
      setLoading(false);
    };
    load();
    const unsub = federationService.subscribe(async () => {
      const cams = await federationService.getFederatedCameras();
      setCameras(cams);
    });
    return () => unsub();
  }, []);

  const filteredCameras = cameras.filter(cam => {
    const matchesVms = selectedVms === 'ALL' || cam.sourceVmsId === selectedVms || cam.sourceVmsVendor === selectedVms;
    const matchesSearch = !searchQuery.trim() ||
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cam.vmsCameraCode && cam.vmsCameraCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesVms && matchesSearch;
  });

  const getTileCount = (layout: GridLayout): number => {
    switch (layout) {
      case '1x1': return 1;
      case '2x2': return 4;
      case '3x3': return 9;
      case '4x4': return 16;
    }
  };

  const displayedCameras = filteredCameras.slice(0, getTileCount(selectedLayout));

  const handlePtzAction = async (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ZOOM_IN' | 'ZOOM_OUT' | 'RESET') => {
    if (!selectedCamForPtz) return;
    let { pan, tilt, zoom } = ptzState;
    if (direction === 'UP') tilt = Math.min(90, tilt + 10);
    if (direction === 'DOWN') tilt = Math.max(-90, tilt - 10);
    if (direction === 'LEFT') pan = (pan - 10 + 360) % 360;
    if (direction === 'RIGHT') pan = (pan + 10) % 360;
    if (direction === 'ZOOM_IN') zoom = Math.min(10, zoom + 0.5);
    if (direction === 'ZOOM_OUT') zoom = Math.max(1, zoom - 0.5);
    if (direction === 'RESET') { pan = 0; tilt = 0; zoom = 1; }

    setPtzState({ pan, tilt, zoom });
    await federationService.sendPtzCommand(selectedCamForPtz.id, pan, tilt, zoom);
  };

  const vendorBadges: Record<string, { bg: string; text: string; border: string }> = {
    HIKVISION_HIKCENTRAL: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
    GENETEC_SECURITY_CENTER: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    DAHUA_DSS: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
    MILESTONE_XPROTECT: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
    HANWHA_WAVE: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
    ONVIF_GENERIC: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
              <Grid className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-black text-white">Cross-VMS Video Wall</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming live feeds federated from Milestone, Genetec, HikCentral, Dahua DSS, and Hanwha WAVE
          </p>
        </div>

        {/* Layout Switchers & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search camera or location…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 w-48 sm:w-60"
            />
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(['1x1', '2x2', '3x3', '4x4'] as GridLayout[]).map(layout => (
              <button
                key={layout}
                onClick={() => setSelectedLayout(layout)}
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg transition ${
                  selectedLayout === layout
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layout}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCameras([...cameras])}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Refresh Stream Sinks"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* VMS Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedVms('ALL')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border whitespace-nowrap transition ${
            selectedVms === 'ALL'
              ? 'bg-blue-600 text-white border-blue-400 shadow-md'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Federated VMS ({cameras.length})
        </button>

        {platforms.map(p => {
          const isSelected = selectedVms === p.id || selectedVms === p.vendor;
          const badge = vendorBadges[p.vendor] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
          return (
            <button
              key={p.id}
              onClick={() => setSelectedVms(p.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-cyan-400'}`} />
              <span>{p.name.split(' ')[0]} {p.name.split(' ')[1]}</span>
              <span className="text-[10px] opacity-75 font-mono">({p.syncedCamerasCount || 6})</span>
            </button>
          );
        })}
      </div>

      {/* Main Video Wall Grid + Sidebar PTZ Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Video Wall Tiles */}
        <div className="xl:col-span-3">
          <div
            className={`grid gap-3 ${
              selectedLayout === '1x1'
                ? 'grid-cols-1'
                : selectedLayout === '2x2'
                ? 'grid-cols-1 sm:grid-cols-2'
                : selectedLayout === '3x3'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {displayedCameras.map(cam => {
              const badge = vendorBadges[cam.sourceVmsVendor] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
              const isSelectedForPtz = selectedCamForPtz?.id === cam.id;

              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCamForPtz(cam)}
                  className={`relative group bg-slate-950 rounded-2xl overflow-hidden border transition-all cursor-pointer shadow-lg ${
                    isSelectedForPtz ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Provenance Badge Bar */}
                  <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${badge.bg} ${badge.text} border ${badge.border} backdrop-blur-md`}>
                      {cam.sourceVmsVendor.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-cyan-300 border border-white/10">
                      {cam.vmsCameraCode || cam.id}
                    </span>
                  </div>

                  {/* Video Player Component */}
                  <VideoPlayer
                    camera={{
                      id: cam.id,
                      number: cam.number || 1,
                      name: cam.name,
                      location: cam.location,
                      codec: cam.codec,
                      live: true,
                      width: 1920,
                      height: 1080,
                      fps: cam.fps || 25,
                      bitrate_kbps: cam.bitrate_kbps || 1500,
                      bits_per_pixel: 0.035,
                      rtsp_url: cam.rtsp_url,
                      webrtc_url: cam.webrtc_url,
                      hls_live_url: cam.hls_live_url || `/api/stream/${cam.id}/index.m3u8`,
                      hls_url: cam.hls_url,
                      district: cam.district,
                      department: cam.departmentName || cam.department,
                      ai_active: true
                    }}
                    compact={selectedLayout !== '1x1'}
                    onFullscreen={c => setFullscreenCam(cam)}
                  />

                  {/* Bottom Footer Info */}
                  <div className="bg-slate-900/90 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <p className="font-bold text-white text-[11px] truncate">{cam.location}</p>
                      <p className="text-[10px] text-slate-400 truncate">{cam.departmentName || cam.department}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        TCP
                      </span>
                      {cam.ptzCapable && (
                        <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">
                          PTZ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {displayedCameras.length === 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-white">No cameras match the current filter</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting "All Federated VMS" or adjusting your search query.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: PTZ Controller & Selected Camera Diagnostics */}
        <div className="space-y-4">
          {selectedCamForPtz ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono">PTZ & Telemetry Hub</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  {selectedCamForPtz.vmsCameraCode}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-white">{selectedCamForPtz.name}</p>
                <p className="text-[11px] text-slate-400">{selectedCamForPtz.location}</p>
                <p className="text-[10px] text-cyan-400 font-mono mt-1">
                  Source: {selectedCamForPtz.sourceVmsName}
                </p>
              </div>

              {/* PTZ D-PAD Controller */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">VMS PTZ Dispatcher</p>
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Up */}
                  <button
                    onClick={() => handlePtzAction('UP')}
                    className="absolute top-0 w-10 h-10 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-xs transition"
                  >
                    ▲
                  </button>
                  {/* Down */}
                  <button
                    onClick={() => handlePtzAction('DOWN')}
                    className="absolute bottom-0 w-10 h-10 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-xs transition"
                  >
                    ▼
                  </button>
                  {/* Left */}
                  <button
                    onClick={() => handlePtzAction('LEFT')}
                    className="absolute left-0 w-10 h-10 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-xs transition"
                  >
                    ◀
                  </button>
                  {/* Right */}
                  <button
                    onClick={() => handlePtzAction('RIGHT')}
                    className="absolute right-0 w-10 h-10 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-xs transition"
                  >
                    ▶
                  </button>
                  {/* Center Reset */}
                  <button
                    onClick={() => handlePtzAction('RESET')}
                    className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-mono text-[10px] font-black flex items-center justify-center shadow-lg transition"
                  >
                    HOME
                  </button>
                </div>

                {/* Zoom Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  <button
                    onClick={() => handlePtzAction('ZOOM_IN')}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded-xl border border-slate-700 transition"
                  >
                    Zoom + ({ptzState.zoom.toFixed(1)}x)
                  </button>
                  <button
                    onClick={() => handlePtzAction('ZOOM_OUT')}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded-xl border border-slate-700 transition"
                  >
                    Zoom -
                  </button>
                </div>
              </div>

              {/* Protocol Bridge Details */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stream Codec:</span>
                  <span className="font-mono text-cyan-300 uppercase">{selectedCamForPtz.codec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="font-mono text-slate-200">{selectedCamForPtz.resolution || '1080p'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Bitrate:</span>
                  <span className="font-mono text-slate-200">{selectedCamForPtz.bitrate_kbps} kbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RTSP Transport:</span>
                  <span className="font-mono text-emerald-400 font-bold">TCP (Forced)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clock Source:</span>
                  <span className="font-mono text-cyan-300">Monotonic PTS</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 font-mono">
                RTSP URI: <br />
                <span className="text-slate-400 break-all">{selectedCamForPtz.rtsp_url}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-center text-slate-400">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Select a camera tile</p>
              <p className="text-[11px] text-slate-500 mt-1">Click on any video tile to inspect telemetry and dispatch PTZ commands.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
