import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, MapPin, Eye } from 'lucide-react';
import { CameraStatusBadge } from '../../components/cameras/CameraStatusBadge';
import { apiService } from '../../services/apiService';
import { Camera } from '../../types/camera.types';

export const CameraListPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>(apiService.getCameras());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setCameras(apiService.getCameras());
    });
    return () => unsubscribe();
  }, []);

  const departments = apiService.getDepartments();

  const filtered = cameras.filter((c) => {
    const matchesSearch =
      c.camera_name.toLowerCase().includes(search.toLowerCase()) ||
      c.camera_id.toLowerCase().includes(search.toLowerCase()) ||
      (c.ward && c.ward.toLowerCase().includes(search.toLowerCase())) ||
      (c.district && c.district.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      deptFilter === 'ALL' || c.department_id === deptFilter || c.departments?.name === deptFilter;

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove camera '${name}'?`)) {
      apiService.deleteCamera(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">State CCTV Camera Registry</h2>
          <p className="text-xs text-slate-500">
            Authoritative database of registered surveillance assets ({filtered.length} of {cameras.length} items)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/cameras/import"
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            <span>Bulk CSV Import</span>
          </Link>
          <Link
            to="/cameras/new"
            className="inline-flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Camera</span>
          </Link>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Camera ID, Junction, Ward, or District..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-medium"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ONLINE">ONLINE</option>
            <option value="OFFLINE">OFFLINE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>

      {/* Camera Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Camera ID</th>
                <th className="px-4 py-3">Asset Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">District / Ward</th>
                <th className="px-4 py-3">AI Features</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No camera assets matched your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((cam) => (
                  <tr key={cam.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">
                      <Link to={`/cameras/${cam.id}`} className="hover:underline">
                        {cam.camera_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cam.camera_name}</td>
                    <td className="px-4 py-3 text-slate-600">{cam.departments?.name || 'Traffic Police'}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{cam.camera_type}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {cam.district} {cam.ward ? `(${cam.ward})` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(cam.ai_capabilities || ['ANPR']).map((ai) => (
                          <span key={ai} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-mono font-semibold border border-blue-200">
                            {ai}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CameraStatusBadge status={cam.status as any} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link
                        to={`/cameras/${cam.id}`}
                        className="inline-flex p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/map?camId=${cam.id}`}
                        className="inline-flex p-1.5 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-100"
                        title="Locate on Map"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(cam.id, cam.camera_name)}
                        className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete Camera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};