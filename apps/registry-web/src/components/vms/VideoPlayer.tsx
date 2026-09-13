/**
 * VideoPlayer — HLS live stream player with overlay support.
 * Follows Sentinel integration guidelines:
 * - Reconnects with exponential backoff
 * - Uses HLS.js for H.264/H.265 streams
 * - Does NOT rely on CAP_PROP_FPS or wall-clock timing
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { SentinelCamera } from '../../types/camera.types';
import { vmsService } from '../../services/vmsService';
import { Maximize2, Minimize2, Wifi, WifiOff, Loader2, Activity } from 'lucide-react';

interface VideoPlayerProps {
  camera: SentinelCamera;
  showOverlay?: boolean;
  compact?: boolean;
  onFullscreen?: (cam: SentinelCamera) => void;
}

type PlayerStatus = 'loading' | 'playing' | 'error' | 'reconnecting';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  camera, showOverlay = true, compact = false, onFullscreen,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hlsUrl = vmsService.getHlsUrl(camera);

  const destroyHls = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    setStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 20,
        liveSyncDurationCount: 2,
        xhrSetup: (xhr) => {
          xhr.timeout = 10000;
        },
      });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryRef.current = 0;
        video.play().then(() => setStatus('playing')).catch(() => setStatus('playing'));
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setStatus('playing');
      });

      video.onplaying = () => setStatus('playing');
      video.onloadeddata = () => setStatus('playing');

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          const backoff = Math.min(2000 * Math.pow(2, retryRef.current), 30000);
          retryRef.current += 1;
          setStatus('reconnecting');
          retryTimerRef.current = setTimeout(initPlayer, backoff);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = hlsUrl;
      video.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [hlsUrl, destroyHls]);

  useEffect(() => {
    initPlayer();
    return destroyHls;
  }, [initPlayer, destroyHls]);

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen(camera);
    } else {
      setIsFullscreen(f => !f);
    }
  };

  const density = camera.analytics?.crowdDensity ?? 0;
  const densityColor = density > 0.7 ? '#EF4444' : density > 0.4 ? '#F59E0B' : '#10B981';

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden group ${isFullscreen ? 'fixed inset-4 z-[999] rounded-2xl' : 'w-full'}`}
      style={{ aspectRatio: compact ? '16/9' : '16/9' }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {/* Loading / error overlay */}
      {status !== 'playing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-2">
          {status === 'loading' && <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />}
          {status === 'reconnecting' && <WifiOff className="w-8 h-8 text-amber-400 animate-pulse" />}
          {status === 'error' && <WifiOff className="w-8 h-8 text-rose-400" />}
          <span className="text-xs text-slate-300 font-mono">
            {status === 'loading' ? 'Connecting…' : status === 'reconnecting' ? `Reconnecting (attempt ${retryRef.current})` : 'Stream unavailable'}
          </span>
        </div>
      )}

      {/* HLS live badge */}
      {status === 'playing' && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">LIVE</span>
        </div>
      )}

      {/* AI overlays */}
      {showOverlay && status === 'playing' && (
        <>
          {/* Camera info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-white text-[10px] font-bold leading-tight truncate">{camera.location}</p>
            {!compact && (
              <div className="flex items-center gap-2 mt-1">
                {camera.ai_active && (
                  <span className="flex items-center gap-1 text-[9px] text-cyan-300 font-mono">
                    <Activity className="w-2.5 h-2.5" />AI ACTIVE
                  </span>
                )}
                <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: densityColor }}>
                  ▣ Density {Math.round(density * 100)}%
                </span>
                <span className="text-[9px] text-slate-300 font-mono">
                  🚗 {camera.analytics?.vehicleCount ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Crowd density bar */}
          <div className="absolute top-2 right-2 w-1.5 h-16 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000"
              style={{ height: `${density * 100}%`, backgroundColor: densityColor }}
            />
          </div>

          {/* Fullscreen btn */}
          <button
            onClick={handleFullscreen}
            className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1 rounded-md text-white"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* ANPR badge */}
          {camera.ai_active && (
            <div className="absolute top-2 left-12 bg-blue-600/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
              ANPR
            </div>
          )}
        </>
      )}

      {/* Fullscreen close */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-lg hover:bg-black"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
