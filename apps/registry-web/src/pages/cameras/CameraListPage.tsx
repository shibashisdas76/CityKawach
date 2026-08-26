import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';

const seedCameras = [
  { id: '1', camera_id: 'GJ-AHM-POL-001', name: 'Income Tax Circle PTZ', dept: 'Traffic Police', type: 'PTZ', district: 'Ahmedabad', ward: 'Navrangpura', status: 'ONLINE', resolution: '4K' },
  { id: '2', camera_id: 'GJ-AHM-POL-002', name: 'Nehru Bridge East', dept: 'Traffic Police', type: 'ANPR_SPECIAL', district: 'Ahmedabad', ward: 'Ellisbridge', status: 'ONLINE', resolution: '1080P' },
  { id: '3', camera_id: 'GJ-AHM-AMC-001', name: 'Kankaria Lake Gate 3', dept: 'Municipal Corp', type: 'FIXED_DOME', district: 'Ahmedabad', ward: 'Maninagar', status: 'ONLINE', resolution: '1080P' },
  { id: '4', camera_id: 'GJ-AHM-AMC-002', name: 'Kalupur Central Station', dept: 'Municipal Corp', type: 'PANORAMIC_360', district: 'Ahmedabad', ward: 'Kalupur', status: 'OFFLINE', resolution: '4K' },
  { id: '5', camera_id: 'GJ-GND-TRN-001', name: 'Gandhinagar Bus Bay 1', dept: 'Transport Dept', type: 'FIXED_BULLET', district: 'Gandhinagar', ward: 'Sector 11', status: 'MAINTENANCE', resolution: '1080P' },
];

export const CameraListPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = seedCameras.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.camera_id.toLowerCase().includes(search.toLowerCase()) ||
      c.ward.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">State CCTV Camera Registry</h2>
          <p className="text-xs text-slate-500">Authoritative database of registered surveillance assets</p>
        </div>
        <Link
          to="/cameras/new"
          className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Camera</span>
        </Link>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Camera ID, Junction, Ward, or Department..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-1.5 border border-slate-300 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filter</span>
        </button>
      </div>

      {/* Camera Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Camera ID</th>
              <th className="px-4 py-3">Asset Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">District / Ward</th>
              <th className="px-4 py-3">Resolution</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((cam) => (
              <tr key={cam.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-mono font-medium text-blue-700">{cam.camera_id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{cam.name}</td>
                <td className="px-4 py-3 text-slate-600">{cam.dept}</td>
                <td className="px-4 py-3 text-slate-600">{cam.type}</td>
                <td className="px-4 py-3 text-slate-600">{cam.district} ({cam.ward})</td>
                <td className="px-4 py-3 text-slate-600">{cam.resolution}</td>
                <td className="px-4 py-3">
                  <CameraStatusBadge status={cam.status as any} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};