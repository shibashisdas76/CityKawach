import React, { useState, useEffect } from 'react';
import { Video, CheckCircle2, XCircle, AlertTriangle, Layers, ArrowUpRight, Activity } from 'lucide-react';
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
    { name: 'Offline', count: offlineCount, color: '#F43F5E' },
    { name: 'Maintenance', count: maintenanceCount, color: '#F59E0B' },
    { name: 'Unknown', count: Math.max(0, unknownCount), color: '#64748B' }
  ].filter((item) => item.count > 0);

  const criticalGapsCount = zones.filter((z) => (z.vulnerability_index || 0) > 0.4).length;

  return (
    <div className="space-y-6">
      {/* Dashboard Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider font-mono">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>State Operations Dashboard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">Dashboard Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Welcome back! Here's what's happening today across your surveillance grid.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Realtime Sync Active</span>
        </div>
      </div>

      {/* Modern SaaS KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assets</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Video className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCameras}</p>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center">
              <span>Across {departments.length} Dept Entities</span>
            </p>
          </div>
        </div>

        {/* Operational */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{onlineCount}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{operationalPct}% Operational Rate</span>
            </p>
          </div>
        </div>

        {/* Critical Offline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Offline</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-rose-600 tracking-tight">{offlineCount}</p>
            <p className="text-xs font-semibold text-rose-500 mt-1">Requires Field Inspection</p>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Maintenance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-amber-600 tracking-tight">{maintenanceCount}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Scheduled Service</p>
          </div>
        </div>

        {/* VDI Gaps */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">VDI Deficit</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-purple-600 tracking-tight">{criticalGapsCount}</p>
            <p className="text-xs font-semibold text-rose-500 mt-1">Priority Surveillance Zones</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Department Asset Distribution</h3>
              <p className="text-xs text-slate-500">Camera volume deployed per state government entity</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <XAxis dataKey="dept" fontSize={11} stroke="#94A3B8" tick={{ fill: '#64748B', fontWeight: 600 }} />
                <YAxis fontSize={11} stroke="#94A3B8" tick={{ fill: '#64748B', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value} Cameras`, 'Deployed']}
                />
                <Bar dataKey="cameras" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Camera Health & Operational Status</h3>
              <p className="text-xs text-slate-500">Ratio breakdown of online, offline, and maintenance streams</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, count }) => `${name}: ${count}`}
                  labelLine={{ stroke: '#94A3B8', strokeWidth: 1.5 }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  formatter={(value: any, name: any) => [`${value} Cameras`, `${name} Status`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Surveillance Alerts Feed Section */}
      <div className="pt-2">
        <SurveillanceAlertTab />
      </div>
    </div>
  );
};