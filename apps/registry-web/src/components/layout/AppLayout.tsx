import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  MapPin,
  Activity,
  Layers,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  PlusCircle,
  Upload,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camera Registry', href: '/cameras', icon: Video },
  { name: 'Add Camera', href: '/cameras/new', icon: PlusCircle },
  { name: 'Bulk Import', href: '/cameras/import', icon: Upload },
  { name: 'GIS Command Map', href: '/map', icon: MapPin },
  { name: 'Health Telemetry', href: '/health', icon: Activity },
  { name: 'Gap Intelligence', href: '/gap-analysis', icon: Layers },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Reports & Export', href: '/reports', icon: FileSpreadsheet },
  { name: 'Audit Trail', href: '/audit-logs', icon: ShieldCheck },
];

export const AppLayout: React.FC = () => {
  const { currentUser, setRole } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-[#1E3E62]">
        <div className="p-5 border-b border-[#1E3E62] flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
            G
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">STATE CCTV REGISTRY</h1>
            <p className="text-[10px] text-slate-400 font-mono">COMMAND & CONTROL v1.0</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${isActive
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-slate-300 hover:bg-[#1E3E62] hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E3E62] bg-[#081220]">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-medium text-slate-200">State Node Connected</p>
              <p className="text-[10px] text-slate-400">Ahmedabad Regional Grid</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center space-x-2">
            <span>Gujarat Integrated Public Safety Infrastructure Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <label className="text-[11px] font-bold text-slate-600">Active Role:</label>
              <select
                value={currentUser.role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="text-xs font-mono font-bold bg-transparent text-blue-700 focus:outline-none cursor-pointer"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="STATE_ADMIN">STATE_ADMIN</option>
                <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <span className="text-xs text-slate-700 font-medium">
              {currentUser.fullName} ({currentUser.badgeNumber})
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};