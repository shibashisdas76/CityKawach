import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, MapPin, Eye, Upload } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Top Action Bar Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Camera Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative database of registered surveillance assets (<span className="font-semibold text-slate-700">{filtered.length}</span> of {cameras.length} items)
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Link
            to="/cameras/import"
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk CSV Import</span>
          </Link>
          <Link
            to="/cameras/new"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Camera</span>
          </Link>
        </div>
      </div>

      {/* Filter Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Camera ID, Junction, Ward, or District..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 font-semibold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
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
            className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 font-semibold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
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

      {/* Modern SaaS Camera Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Camera ID</th>
                <th className="px-5 py-3.5">Asset Name</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">District / Ward</th>
                <th className="px-5 py-3.5">AI Features</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No camera assets matched your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((cam) => (
                  <tr key={cam.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                      <Link to={`/cameras/${cam.id}`} className="hover:underline">
                        {cam.camera_id}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{cam.camera_name}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{cam.departments?.name || 'Traffic Police'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px] font-semibold">{cam.camera_type}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {cam.district} {cam.ward ? `(${cam.ward})` : ''}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {(cam.ai_capabilities || ['ANPR']).map((ai) => (
                          <span key={ai} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-mono font-semibold border border-blue-100">
                            {ai}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <CameraStatusBadge status={cam.status as any} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <Link
                        to={`/cameras/${cam.id}`}
                        className="inline-flex p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/map?camId=${cam.id}`}
                        className="inline-flex p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                        title="Locate on Map"
                      >
                        <MapPin className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(cam.id, cam.camera_name)}
                        className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Camera"
                      >
                        <Trash2 className="w-4 h-4" />
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