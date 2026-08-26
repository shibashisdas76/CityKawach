import React, { useState, useEffect } from 'react';
import { Video, CheckCircle2, XCircle, AlertTriangle, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { SurveillanceAlertTab } from '../../components/alerts/SurveillanceAlertTab';
import { apiService } from '../../services/apiService';

export const DashboardPage: React.FC = () => {
  const [cameras, setCameras] = useState(apiService.getCameras());
  const [zones, setZones] = useState(apiService.getCoverageZones());

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setCameras(apiService.getCameras());
      setZones(apiService.getCoverageZones());
    });
    return () => unsubscribe();
  }, []);

  const totalCameras = cameras.length;
  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const offlineCount = cameras.filter((c) => c.status === 'OFFLINE').length;
  const maintenanceCount = cameras.filter((c) => c.status === 'MAINTENANCE').length;
  const unknownCount = totalCameras - onlineCount - offlineCount - maintenanceCount;

  const operationalPct = totalCameras > 0 ? Math.round((onlineCount / totalCameras) * 100) : 0;

  // Department distribution
  const departments = apiService.getDepartments();
  const departmentData = departments.map((d) => ({
    dept: d.name,
    cameras: cameras.filter((c) => c.department_id === d.id || c.departments?.name === d.name).length
  }));

  const statusData = [
    { name: 'Online', count: onlineCount, color: '#10B981' },
    { name: 'Offline', count: offlineCount, color: '#EF4444' },
    { name: 'Maintenance', count: maintenanceCount, color: '#F59E0B' },
    { name: 'Unknown', count: Math.max(0, unknownCount), color: '#6B7280' }
  ].filter((item) => item.count > 0);

  const criticalGapsCount = zones.filter((z) => (z.vulnerability_index || 0) > 0.4).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">State CCTV Infrastructure Overview</h2>
          <p className="text-xs text-slate-500">Real-time metadata consolidation across government entities</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-medium text-slate-600">Sync: Realtime Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Registered Assets</span>
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCameras}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across {departments.length} Departments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Operational</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{onlineCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">{operationalPct}% Operational Rate</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Critical Offline</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{offlineCount}</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Action Required</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">In Maintenance</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-2">{maintenanceCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled repairs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">VDI Gaps</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{criticalGapsCount}</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Priority Deficit Zones</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Department Asset Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <XAxis dataKey="dept" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="cameras" fill="#1E3E62" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Camera Health & Status Ratio
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Surveillance Alerts Tab */}
      <div className="mt-8">
        <SurveillanceAlertTab />
      </div>
    </div>
  );
};