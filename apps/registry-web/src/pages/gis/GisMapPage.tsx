import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CameraStatusBadge } from '@/components/cameras/CameraStatusBadge';
import { MOCK_CAMERAS, MOCK_DEPARTMENTS } from '@/services/mockData';
import { Camera } from '@/types/camera.types';

// Custom status marker icon creator
const customMarker = (status: string) => {
  const color = status === 'ONLINE' ? '#10B981' : status === 'OFFLINE' ? '#EF4444' : '#F59E0B';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
      map.flyTo([targetLat, targetLng], 15, { duration: 1.5 });
    }
  }, [targetLat, targetLng, map]);
  return null;
};

export const GisMapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const camIdParam = searchParams.get('camId');

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [targetCam, setTargetCam] = useState<Camera | null>(null);

  useEffect(() => {
    if (camIdParam) {
      const found = MOCK_CAMERAS.find((c) => c.id === camIdParam || c.camera_id === camIdParam);
      if (found) setTargetCam(found);
    }
  }, [camIdParam]);

  const filteredCameras = MOCK_CAMERAS.filter((c) => {
    if (selectedDept !== 'ALL' && c.department_id !== selectedDept && c.departments?.name !== selectedDept) {
      return false;
    }
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Map Header Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Geospatial CCTV Infrastructure Map</h2>
          <p className="text-xs text-slate-500">PostGIS Coordinates & Urban Coverage Analysis ({filteredCameras.length} Assets)</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Dept Layer:</label>
            <select
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {MOCK_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Status:</label>
            <select
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
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
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
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
                <p className="text-slate-700">Sarkhej Ward Corridor</p>
                <p className="text-slate-500 font-mono text-[11px]">Vulnerability Deficit: 83%</p>
              </div>
            </Popup>
          </Polygon>

          {/* Camera Status Markers */}
          {filteredCameras.map((cam) => (
            <Marker key={cam.id} position={[cam.latitude, cam.longitude]} icon={customMarker(cam.status)}>
              <Popup>
                <div className="text-xs space-y-1.5 font-sans min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] font-bold text-blue-700">{cam.camera_id}</p>
                    <CameraStatusBadge status={cam.status} />
                  </div>
                  <p className="font-bold text-slate-900">{cam.camera_name}</p>
                  <p className="text-slate-600">Dept: {cam.departments?.name || 'Surveillance'}</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    Lat: {cam.latitude.toFixed(4)}, Lng: {cam.longitude.toFixed(4)}
                  </p>
                  <div className="pt-2 border-t border-slate-200">
                    <Link
                      to={`/cameras/${cam.id}`}
                      className="block text-center py-1 px-2 rounded bg-blue-700 text-white font-semibold text-[11px] hover:bg-blue-800 transition"
                    >
                      View Specs & Telemetry
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};