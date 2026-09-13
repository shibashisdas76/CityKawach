import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Bookmark,
  Download,
  ShieldCheck,
  Calendar,
  Filter,
  Camera,
  HardDrive,
  FileCheck,
  CheckCircle2,
  Video,
  Layers
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { VmsCameraFeed, VideoRecordingChunk } from '../../types/model4.types';
import { SentinelCamera } from '../../types/camera.types';
import { VideoPlayer } from '../../components/vms/VideoPlayer';

export const TimelinePlaybackPage: React.FC = () => {
  const [cameras, setCameras] = useState<VmsCameraFeed[]>([]);
  const [selectedCam, setSelectedCam] = useState<VmsCameraFeed | null>(null);
  const [playbackData, setPlaybackData] = useState<{ available_chunks: number; storage_distribution: any; chunks: VideoRecordingChunk[] } | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  
  // Scrubber & Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(35); // 0 to 100%
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('14:35:20');
  
  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [officerName, setOfficerName] = useState('PI K.M. Jadeja');
  const [badgeNumber, setBadgeNumber] = useState('GJ-POL-8841');
  const [exportPurpose, setExportPurpose] = useState('Court Evidence Submission / FIR #2026/881');
  const [exportResult, setExportResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cams = await model4Service.getCameras();
      setCameras(cams);
      if (cams.length > 0) {
        setSelectedCam(cams[0]);
        loadChunks(cams[0].id);
      }
    };
    load();
  }, []);

  const loadChunks = async (camId: string, tier?: string) => {
    const data = await model4Service.getPlayback(camId, tier === 'ALL' ? undefined : tier);
    setPlaybackData(data);
  };

  const handleCameraChange = (cam: VmsCameraFeed) => {
    setSelectedCam(cam);
    loadChunks(cam.id, selectedTier);
  };

  const handleTierFilter = (tier: string) => {
    setSelectedTier(tier);
    if (selectedCam) loadChunks(selectedCam.id, tier);
  };

  const handleExport = async () => {
    if (!selectedCam) return;
    setExporting(true);
    const res = await model4Service.exportEvidenceVideo({
      camera_id: selectedCam.id,
      start_time: '2026-09-04T14:00:00Z',
      end_time: '2026-09-04T15:00:00Z',
      officer_name: officerName,
      badge_number: badgeNumber,
      purpose: exportPurpose
    });
    setExportResult(res);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 font-mono text-xs font-bold rounded-md border border-indigo-500/40 uppercase">
              MODEL 4 RECORDING ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">SYNCHRONIZED TIMELINE & SCRUBBER</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Timeline Playback & Evidentiary Archive
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Synchronized multi-feed playback across Hot (NVMe RAM), Warm (Ceph Object), and Cold (S3 Glacier) storage
            tiers. Features event bookmarks, variable speed control, and SHA-256 tamper-proof evidence export.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" />
            Export Signed Evidence
          </button>
        </div>
      </div>

      {/* Main Playback Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left 3 Cols: Video Preview & Interactive Timeline */}
        <div className="xl:col-span-3 space-y-4">
          {/* Active Feed Video Player */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative aspect-video flex items-center justify-center">
            {selectedCam ? (
              <VideoPlayer
                camera={{
                  id: selectedCam.id,
                  number: 1,
                  name: selectedCam.name,
                  location: `${selectedCam.district}, Gujarat`,
                  codec: selectedCam.codec || 'H.264',
                  live: selectedCam.live,
                  width: 1920,
                  height: 1080,
                  fps: selectedCam.fps || 25,
                  bitrate_kbps: selectedCam.bitrate_kbps || 2048,
                  bits_per_pixel: 24,
                  rtsp_url: selectedCam.rtsp_url,
                  webrtc_url: selectedCam.webrtc_url || '',
                  hls_live_url: selectedCam.hls_url,
                  hls_url: selectedCam.hls_url,
                  department: selectedCam.department,
                  district: selectedCam.district,
                }}
                showOverlay
              />
            ) : (
              <div className="text-center text-slate-500">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Select a camera to initiate playback</p>
              </div>
            )}

            {/* Live Playback Indicator Overlay */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white font-mono text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>TIME: <b>{currentTimeDisplay}</b></span>
              <span>•</span>
              <span>SPEED: <b>{playbackSpeed}x</b></span>
            </div>
          </div>

          {/* Interactive Timeline & Scrubber Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Scrubber Controls Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                </button>
                <button
                  onClick={() => {
                    setCurrentProgress(0);
                    setCurrentTimeDisplay('14:00:00');
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                  title="Jump to Start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 ml-2">
                  {[0.5, 1, 2, 4, 8].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        playbackSpeed === spd
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Storage:</span>
                {['ALL', 'HOT', 'WARM', 'COLD'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleTierFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedTier === t
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-semibold">
                <span>14:00:00 (Start)</span>
                <span className="text-blue-600 font-bold">Current: {currentTimeDisplay}</span>
                <span>15:00:00 (End)</span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentProgress}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setCurrentProgress(val);
                    const mins = Math.floor((val / 100) * 60);
                    const secs = Math.floor(((val / 100) * 3600) % 60);
                    setCurrentTimeDisplay(`14:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
                  }}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                {/* Event Bookmark Badges on timeline */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-rose-500 pointer-events-none rounded-full"
                  style={{ left: '25%' }}
                  title="ANPR Watchlist Match (14:15:00)"
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-amber-500 pointer-events-none rounded-full"
                  style={{ left: '60%' }}
                  title="Tripwire Breach Alarm (14:36:00)"
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-purple-500 pointer-events-none rounded-full"
                  style={{ left: '85%' }}
                  title="NAFIS Biometric Sighting (14:51:00)"
                />
              </div>

              {/* Bookmark Legend */}
              <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> ANPR Hit (14:15:00)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Tripwire Breach (14:36:00)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> NAFIS Match (14:51:00)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Camera Selector & Recording Chunks Ledger */}
        <div className="space-y-4">
          {/* Camera Selector List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col" style={{ maxHeight: '380px' }}>
            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Select Feed</span>
              <span className="text-blue-600 font-mono font-bold">{cameras.length} Available</span>
            </p>
            <div className="overflow-y-auto space-y-1 pr-1">
              {cameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => handleCameraChange(cam)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                    selectedCam?.id === cam.id
                      ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                      : 'bg-slate-50/70 border-transparent text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-semibold">{cam.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{cam.district}</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">{cam.codec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stored Video Chunks Ledger */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Recording Chunks</span>
              <HardDrive className="w-4 h-4 text-slate-400" />
            </p>

            <div className="space-y-2">
              {playbackData?.chunks.map(chunk => (
                <div
                  key={chunk.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{chunk.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        chunk.storage_tier === 'HOT'
                          ? 'bg-red-100 text-red-700'
                          : chunk.storage_tier === 'WARM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {chunk.storage_tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Size: <b>{chunk.size_mb} MB</b> · Duration: <b>{chunk.duration_sec / 60} mins</b>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate" title={chunk.sha256_hash}>
                    SHA: {chunk.sha256_hash.slice(0, 24)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evidentiary Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Signed Evidentiary Video Export</h3>
              </div>
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setExportResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {!exportResult ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Camera Feed</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedCam?.name} (${selectedCam?.id})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Officer Name</label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Badge Number</label>
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={e => setBadgeNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Purpose / Case Reference</label>
                  <textarea
                    rows={2}
                    value={exportPurpose}
                    onChange={e => setExportPurpose(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 text-[11px] leading-relaxed">
                  Export generates a tamper-proof MP4 video bundle stamped with state cryptographic signature and
                  records an immutable audit entry in the Gujarat Police evidentiary registry.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setExportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md transition flex items-center gap-2"
                  >
                    {exporting ? 'Generating SHA-256...' : 'Sign & Export Package'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="text-sm font-extrabold text-emerald-950">Evidence Export Verified & Signed</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">Committed to State Evidence Chain-of-Custody Ledger</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 font-mono space-y-1.5 text-[11px]">
                  <p>Export ID: <b>{exportResult.export_id}</b></p>
                  <p>Audit Log ID: <b>{exportResult.audit_log_id}</b></p>
                  <p className="text-[10px] break-all text-slate-600">SHA-256: <b>{exportResult.sha256_checksum}</b></p>
                  <p>Watermark: <b>{exportResult.watermark}</b></p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setExportModalOpen(false);
                      setExportResult(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
