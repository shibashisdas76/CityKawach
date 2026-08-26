import React from 'react';
import { Video, CheckCircle2, XCircle, AlertTriangle, Building, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { SurveillanceAlertTab } from '../../components/alerts/SurveillanceAlertTab'; // <-- New Import

const statusData = [
  { name: 'Online', count: 68, color: '#10B981' },
  { name: 'Offline', count: 8, color: '#EF4444' },
  { name: 'Maintenance', count: 4, color: '#F59E0B' },
];

const departmentData = [
  { dept: 'Traffic Police', cameras: 35 },
  { dept: 'Municipal Corp', cameras: 22 },
  { dept: 'Transport Dept', cameras: 15 },
  { dept: 'Civil Hospital', cameras: 8 },
];

export const DashboardPage: React.FC = () => {
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
            <span className="text-xs font-semibold">Total Cameras</span>
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">80</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 Departments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Operational</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">68</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">85% Operational</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Critical Offline</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">8</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Action Required</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">In Maintenance</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-2">4</p>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled repairs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Coverage Deficit</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">42%</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">3 High-Priority Gaps</p>
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