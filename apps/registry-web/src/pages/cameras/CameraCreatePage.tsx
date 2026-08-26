import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_DEPARTMENTS, MOCK_CAMERAS, MOCK_AUDIT_LOGS } from '../../services/supabaseClient';
import { Camera, CameraType, CameraStatus } from '../../types/camera.types';
import {
  ArrowLeft,
  Video,
  MapPin,
  Server,
  CheckCircle2,
  PlusCircle,
  Building2,
  Radio
} from 'lucide-react';

const pinIcon = L.divIcon({
  html: `
    <div style="background-color:#1E3E62;width:24px;height:24px;border-radius:50%;border:3px solid #60A5FA;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>
  `,
  className: 'mini-map-picker-pin',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const LocationPickerMarker: React.FC<{
  position: [number, number];
  onLocationChange: (lat: number, lng: number) => void;
}> = ({ position, onLocationChange }) => {
  useMapEvents({
    click(e) {
      onLocationChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
    }
  });

  return <Marker position={position} icon={pinIcon} />;
};

const cameraSchema = z.object({
  camera_id: z.string().min(3, 'Camera ID must be at least 3 characters (e.g. GJ-AHM-POL-010)'),
  camera_name: z.string().min(5, 'Name must be at least 5 characters'),
  department_id: z.string().min(1, 'Please select a department'),
  camera_type: z.enum(['FIXED_BULLET', 'FIXED_DOME', 'PTZ', 'ANPR_SPECIAL', 'THERMAL', 'PANORAMIC_360']),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'UNKNOWN']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  ward: z.string().min(1, 'Ward is required'),
  pin_code: z.string().min(6, 'Pin code required'),
  ip_address: z.string().optional(),
  resolution: z.string().default('1080P'),
  rtsp_url: z.string().optional()
});

type CameraFormData = z.infer<typeof cameraSchema>;

export const CameraCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CameraFormData>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      camera_id: `GJ-AHM-POL-00${MOCK_CAMERAS.length + 1}`,
      camera_name: '',
      department_id: MOCK_DEPARTMENTS[0].id,
      camera_type: 'PTZ',
      status: 'ONLINE',
      latitude: 23.0225,
      longitude: 72.5714,
      address: 'SG Highway Junction',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      ward: 'Navrangpura',
      pin_code: '380015',
      ip_address: '10.120.10.15',
      resolution: '1080P',
      rtsp_url: 'rtsp://admin:pass@10.120.10.15:554/live/ch0'
    }
  });

  const watchLat = watch('latitude');
  const watchLng = watch('longitude');

  const onSubmit = (data: CameraFormData) => {
    const selectedDeptObj = MOCK_DEPARTMENTS.find(d => d.id === data.department_id);

    const newCam: Camera = {
      id: `c-${Date.now()}`,
      camera_id: data.camera_id,
      camera_name: data.camera_name,
      department_id: data.department_id,
      departments: { name: selectedDeptObj?.name || 'Traffic Police', code: selectedDeptObj?.code || 'DEPT-AMD' },
      camera_type: data.camera_type as CameraType,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      district: data.district,
      city: data.city,
      ward: data.ward,
      pin_code: data.pin_code,
      status: data.status as CameraStatus,
      connectivity_type: 'FIBER_OPTIC',
      storage_type: 'CENTRAL_NVR',
      resolution: data.resolution,
      ip_address: data.ip_address,
      rtsp_url: data.rtsp_url,
      retention_days: 30,
      installation_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    MOCK_CAMERAS.unshift(newCam);

    MOCK_AUDIT_LOGS.unshift({
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'user_001',
      actorName: 'State Admin Officer',
      actorRole: 'STATE_ADMIN',
      action: 'REGISTER_CAMERA',
      targetEntity: 'cameras',
      targetId: newCam.camera_id,
      ipAddress: '127.0.0.1',
      metadataDiff: { camera_id: newCam.camera_id, camera_name: newCam.camera_name, status: newCam.status }
    });

    alert(`Camera ${newCam.camera_id} registered successfully!`);
    navigate('/cameras');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/cameras"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Camera Registry</span>
        </Link>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
          Camera Registration Wizard
        </span>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-2 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <span>Register New CCTV Surveillance Asset</span>
        </h2>
        <p className="text-xs text-slate-500">
          Add authoritative surveillance hardware metadata to the state central repository.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition ${currentStep === 1
              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
          >
            <span>1. Identity & Dept</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition ${currentStep === 2
              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
          >
            <span>2. Location & GIS Map</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition ${currentStep === 3
              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
              : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
          >
            <span>3. Technical Specs</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Step 1: Asset Identification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">CAMERA ID (Unique Code)</label>
                <input
                  type="text"
                  {...register('camera_id')}
                  className="w-full px-3 py-2 bg-slate-50 font-mono text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                />
                {errors.camera_id && <p className="text-rose-600 text-[10px] mt-1">{errors.camera_id.message}</p>}
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">ASSET NAME / LOCATION DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="e.g. Income Tax Circle PTZ"
                  {...register('camera_name')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                />
                {errors.camera_name && <p className="text-rose-600 text-[10px] mt-1">{errors.camera_name.message}</p>}
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">DEPARTMENT ASSIGNMENT</label>
                <select
                  {...register('department_id')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                >
                  {MOCK_DEPARTMENTS.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">CAMERA HARDWARE TYPE</label>
                <select
                  {...register('camera_type')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                >
                  <option value="PTZ">PTZ (Pan-Tilt-Zoom)</option>
                  <option value="ANPR_SPECIAL">ANPR Special</option>
                  <option value="FIXED_BULLET">Fixed Bullet</option>
                  <option value="FIXED_DOME">Fixed Dome</option>
                  <option value="THERMAL">Thermal Camera</option>
                  <option value="PANORAMIC_360">Panoramic 360°</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition"
              >
                Next: GIS Location →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Step 2: GIS Location Coordinates</span>
            </h3>

            <div className="h-64 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
              <MapContainer
                center={[watchLat, watchLng]}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerMarker
                  position={[watchLat, watchLng]}
                  onLocationChange={(lat, lng) => {
                    setValue('latitude', lat);
                    setValue('longitude', lng);
                  }}
                />
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-600 mb-1">LATITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">LONGITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  {...register('longitude', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">CITY / DISTRICT</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">STREET ADDRESS</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">WARD</label>
                <input
                  type="text"
                  {...register('ward')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">PIN CODE</label>
                <input
                  type="text"
                  {...register('pin_code')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition"
              >
                Next: Technical Specs →
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Step 3: Network & RTSP Integration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-600 mb-1">IP ADDRESS</label>
                <input
                  type="text"
                  placeholder="10.120.10.15"
                  {...register('ip_address')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">RESOLUTION</label>
                <select
                  {...register('resolution')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg"
                >
                  <option value="4K">4K (3840x2160)</option>
                  <option value="1080P">1080P Full HD</option>
                  <option value="720P">720P HD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium text-xs mb-1 flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>RTSP STREAM URL TEMPLATE</span>
              </label>
              <input
                type="text"
                {...register('rtsp_url')}
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center space-x-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Registration</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
