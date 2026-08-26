import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  UserCheck,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';
import { supabase } from '../../services/supabaseClient';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camera Registry', href: '/cameras', icon: Video },
  { name: 'Add Camera', href: '/cameras/new', icon: PlusCircle },
  { name: 'Bulk Import', href: '/cameras/import', icon: Upload },
];

const intelligenceNavigation = [
  { name: 'GIS Command Map', href: '/map', icon: MapPin },
  { name: 'Health Telemetry', href: '/health', icon: Activity },
  { name: 'Gap Intelligence', href: '/gap-analysis', icon: Layers },
];

const managementNavigation = [
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Reports & Export', href: '/reports', icon: FileSpreadsheet },
  { name: 'Audit Trail', href: '/audit-logs', icon: ShieldCheck },
];

export const AppLayout: React.FC = () => {
  const { currentUser, setRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* SaasAble Admin Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0 select-none shadow-2xl z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3.5 bg-slate-950">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-600/35 text-base border border-indigo-400/30">
            G
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-wider text-white uppercase font-sans">STATE CCTV REGISTRY</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-tight font-bold">SAASABLE COMMAND v1.0</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3.5 space-y-6 overflow-y-auto">
          {/* Main Group */}
          <div>
            <div className="px-3 pb-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              Core Registry
            </div>
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30 scale-[1.01]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Intelligence Group */}
          <div>
            <div className="px-3 pb-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              GIS & Telemetry
            </div>
            <div className="space-y-1">
              {intelligenceNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30 scale-[1.01]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Governance Group */}
          <div>
            <div className="px-3 pb-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              Governance
            </div>
            <div className="space-y-1">
              {managementNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30 scale-[1.01]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer Node Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-200 truncate">State Grid Connected</p>
              <p className="text-[10px] text-indigo-400 font-mono truncate font-semibold">Ahmedabad Regional Grid</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container with Attractive Ambient Mesh Background */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/80 bg-grid-pattern relative">
        {/* SaasAble Top Navbar Header */}
        <header className="h-16 backdrop-blur-md bg-white/90 border-b border-slate-200/80 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-slate-800 tracking-tight">Gujarat Integrated Public Safety Infrastructure Portal</span>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Active Role Selector Badge */}
            <div className="flex items-center space-x-2 bg-slate-100/90 hover:bg-slate-200/70 px-3.5 py-1.5 rounded-xl border border-slate-200 transition">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Role:</label>
              <select
                value={currentUser.role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="text-xs font-mono font-bold bg-transparent text-indigo-700 focus:outline-none cursor-pointer"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="STATE_ADMIN">STATE_ADMIN</option>
                <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl shadow-md border border-slate-800 text-xs font-semibold">
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                {currentUser.fullName.charAt(0)}
              </div>
              <span className="truncate max-w-[160px] font-extrabold">{currentUser.fullName}</span>
              <span className="text-[10px] font-mono text-indigo-300 font-bold">({currentUser.badgeNumber})</span>
            </div>

            {/* Logout Button */}
            <div className="h-6 w-px bg-slate-200 mx-0.5" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all font-semibold border border-transparent hover:border-rose-200"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-extrabold hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};