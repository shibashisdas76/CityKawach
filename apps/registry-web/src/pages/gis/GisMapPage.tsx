import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import { apiService } from '../../services/apiService';
import { vmsService } from '../../services/vmsService';
import { Camera, SentinelCamera } from '../../types/camera.types';
import { Video, Layers, Radio, ExternalLink, Activity, Car } from 'lucide-react';
import { VideoPlayer } from '../../components/vms/VideoPlayer';

// Custom status marker icon creator
const customMarker = (status: string) => {
  const color = status === 'ONLINE' ? '#10B981' : status === 'OFFLINE' ? '#EF4444' : '#F59E0B';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const liveStreamMarker = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:#3B82F6;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;"><div style="background-color:#EF4444;width:6px;height:6px;border-radius:50%;"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const gapZonePolygon: [number, number][] = [
  [22.98, 72.49],
  [22.98, 72.52],
  [23.01, 72.52],
  [23.01, 72.49],
];

// Helper component to center map on target camera when camId query param is present
const MapFlyTo: React.FC<{ targetLat?: number; targetLng?: number }> = ({ targetLat, targetLng }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLat !== undefined && targetLng !== undefined) {
      map.flyTo([targetLat, targetLng], 14, { duration: 1.5 });
    }
  }, [targetLat, targetLng, map]);
  return null;
};

export const GisMapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const camIdParam = searchParams.get('camId');

  const [cameras, setCameras] = useState<Camera[]>(apiService.getCameras());
  const [sentinelCams, setSentinelCams] = useState<SentinelCamera[]>([]);
  const [showLiveLayer, setShowLiveLayer] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [targetCam, setTargetCam] = useState<Camera | null>(null);
  const [previewCam, setPreviewCam] = useState<SentinelCamera | null>(null);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setCameras(apiService.getCameras());
    });
    const loadSentinel = async () => {
      const liveCams = await vmsService.loadCatalogue();
      setSentinelCams(liveCams);
    };
    loadSentinel();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (camIdParam) {
      const found = cameras.find((c) => c.id === camIdParam || c.camera_id === camIdParam);
      if (found) setTargetCam(found);
    }
  }, [camIdParam, cameras]);

  const departments = apiService.getDepartments();

  const filteredCameras = cameras.filter((c) => {
    if (selectedDept !== 'ALL' && c.department_id !== selectedDept && c.departments?.name !== selectedDept) {
      return false;
    }
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Map Header Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Geospatial CCTV Infrastructure & Live Stream Map</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            PostGIS Urban Inventory (<span className="font-bold text-slate-700">{filteredCameras.length}</span> Assets) + Live Sentinel Grid Relay (<span className="font-bold text-blue-600">{sentinelCams.length}</span> Feeds)
          </p>
        </div>
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Live Layer Toggle */}
          <button
            onClick={() => setShowLiveLayer(!showLiveLayer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              showLiveLayer
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Model 2 Live Streams ({sentinelCams.length})</span>
          </button>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600 uppercase text-[10px] tracking-wider">Dept:</label>
            <select
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 font-semibold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600 uppercase text-[10px] tracking-wider">Status:</label>
            <select
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 font-semibold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">ONLINE (Green)</option>
              <option value="OFFLINE">OFFLINE (Red)</option>
              <option value="MAINTENANCE">MAINTENANCE (Amber)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaflet Canvas */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative">
        <MapContainer center={[23.0225, 72.5714]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFlyTo targetLat={targetCam?.latitude} targetLng={targetCam?.longitude} />

          {/* Gap Zone Polygon Layer */}
          <Polygon
            positions={gapZonePolygon}
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.2 }}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <p className="font-bold text-rose-600">Critical Coverage Gap Zone</p>
                <p className="text-slate-700 font-medium">Sarkhej Ward Corridor</p>
                <p className="text-slate-500 font-mono text-[11px]">Vulnerability Deficit: 83%</p>
              </div>
            </Popup>
          </Polygon>

          {/* Model 1 Registry Cameras */}
          {filteredCameras.map((cam) => (
            <Marker key={cam.id} position={[cam.latitude, cam.longitude]} icon={customMarker(cam.status)}>
              <Popup>
                <div className="text-xs space-y-1.5 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] font-bold text-blue-600">{cam.camera_id}</p>
                    <CameraStatusBadge status={cam.status} />
                  </div>
                  <p className="font-bold text-slate-900">{cam.camera_name}</p>
                  <p className="text-slate-600 font-medium">Dept: {cam.departments?.name || 'Surveillance'}</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    Lat: {cam.latitude.toFixed(4)}, Lng: {cam.longitude.toFixed(4)}
                  </p>
                  <div className="pt-2 border-t border-slate-200/80 flex gap-2">
                    <Link
                      to={`/cameras/${cam.id}`}
                      className="flex-1 text-center py-1.5 px-2 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition shadow-sm"
                    >
                      View Metadata
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Model 2 Live Sentinel Feeds Layer */}
          {showLiveLayer && sentinelCams.map((scam, i) => {
            // Use real enriched Gujarat GPS coordinates
            const camLat = scam.latitude || 23.03 + (i % 6) * 0.02;
            const camLng = scam.longitude || 72.58 + (i % 5) * 0.03;
            return (
              <Marker key={`live-${scam.id}`} position={[camLat, camLng]} icon={liveStreamMarker()}>
                <Popup>
                  <div className="text-xs space-y-2 font-sans min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-black text-slate-900 font-mono">{scam.id.toUpperCase()}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        HLS LIVE
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{scam.name}</p>
                    <p className="text-slate-500 text-[11px]">{scam.location}</p>
                    <div className="bg-slate-50 rounded-lg p-2 text-[10px] space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">District:</span><span className="font-semibold text-slate-700">{scam.district || 'Gujarat'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Department:</span><span className="font-semibold text-slate-700">{scam.department}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Codec:</span><span className="font-mono uppercase font-bold text-blue-600">{scam.codec}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">GPS:</span><span className="font-mono text-slate-600 font-semibold">{camLat.toFixed(4)}, {camLng.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">AI Edge Analytics:</span><span className="font-bold text-emerald-600">✓ ACTIVE (YOLO)</span></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setPreviewCam(scam)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs text-center flex items-center justify-center gap-1"
                      >
                        <Video className="w-3 h-3" />
                        <span>Live Stream</span>
                      </button>
                      <Link
                        to="/vms/live"
                        className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition text-center"
                      >
                        Video Wall
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Live Preview Modal from Map Pin */}
        {previewCam && (
          <div
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewCam(null)}
          >
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 max-w-2xl w-full text-white shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{previewCam.name}</h3>
                  <p className="text-[11px] text-slate-400">{previewCam.location} · {previewCam.department}</p>
                </div>
                <button
                  onClick={() => setPreviewCam(null)}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md aspect-video">
                <VideoPlayer camera={previewCam} showOverlay />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};