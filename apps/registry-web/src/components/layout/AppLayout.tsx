import React, { useState } from 'react';
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
  LogOut,
  Menu,
  X,
  // VMS & Model 4 icons
  MonitorPlay,
  Film,
  Sparkles,
  Car,
  Globe,
  Cpu,
  Zap,
  HardDrive,
  Lock,
  AlertTriangle,
  Radio,
  Gauge,
  RefreshCw,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';
import { supabase } from '../../services/supabaseClient';

const model4VmsNavItems = [
  { name: 'VMS Overview', href: '/vms', icon: MonitorPlay },
  { name: 'Live Wall', href: '/vms/live', icon: Video },
  { name: 'Playback & Evidence', href: '/vms/playback', icon: Film },
  { name: 'AI Vision Suite', href: '/vms/ai-suite', icon: Sparkles },
  { name: 'Vehicle Tracking', href: '/vms/tracking', icon: Globe },
  { name: 'Gov Integrations', href: '/vms/integrations', icon: Zap },
  { name: 'Storage Tiers', href: '/vms/storage', icon: HardDrive },
  { name: '80k Load Lab', href: '/vms/scalability', icon: Gauge },
  { name: 'Disaster Recovery', href: '/vms/dr', icon: RefreshCw },
  { name: 'Zero-Trust Security', href: '/vms/security', icon: Lock },
];

const federationNavItems = [
  { name: 'Federation Hub', href: '/federation', icon: Layers },
  { name: 'Cross-VMS Wall', href: '/federation/wall', icon: Video },
  { name: 'Correlation', href: '/federation/correlation', icon: Zap },
  { name: 'Incidents', href: '/federation/incidents', icon: ShieldAlert },
  { name: 'Connectors', href: '/federation/connectors', icon: Sliders },
  { name: 'Reports', href: '/federation/reports', icon: FileSpreadsheet },
];

const registryNavItems = [
  { name: 'Registry Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camera Inventory', href: '/cameras', icon: Video },
  { name: 'GIS Map', href: '/map', icon: MapPin },
  { name: 'Health Telemetry', href: '/health', icon: Activity },
  { name: 'Gap Intelligence', href: '/gap-analysis', icon: Layers },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
];

const allNavigationItems = [...model4VmsNavItems, ...federationNavItems, ...registryNavItems];

export const AppLayout: React.FC = () => {
  const { currentUser, setRole, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF] font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar Header */}
      <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 border-b border-cyan-800/60 shadow-xl sticky top-0 z-40 text-white">
        <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Logo & Title */}
            <NavLink to="/vms" className="flex items-center space-x-3 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/25 text-lg group-hover:scale-105 transition-transform">
                V4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                    CENTRAL VMS PLATFORM
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1.5 py-0.5 rounded">
                    MODEL 4
                  </span>
                </div>
                <p className="text-[10px] text-cyan-400 font-mono tracking-tight font-bold">STATEWIDE CONSOLIDATED CCTV COMMAND</p>
              </div>
            </NavLink>

            {/* Center: Desktop Navigation Bar */}
            <nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto py-1">
              {/* Model 4 Central VMS Navigation */}
              <div className="flex items-center bg-cyan-950/50 p-1 rounded-xl border border-cyan-600/40 shadow-inner">
                {model4VmsNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/vms'}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/30 border border-cyan-300/40'
                          : 'text-cyan-200 hover:bg-cyan-900/40 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>

              {/* Quick Links: M3 Federation & M1 Registry */}
              <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 ml-2">
                <NavLink
                  to="/federation"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:bg-purple-950/60 hover:text-white'
                    }`
                  }
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>M3 Federation</span>
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-blue-600 text-white font-bold' : 'text-blue-300 hover:bg-blue-950/60 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>M1 Registry</span>
                </NavLink>
              </div>
            </nav>

            {/* Right: Actions & User Tools */}
            <div className="flex items-center space-x-3">
              {/* Role Selector */}
              <div className="hidden lg:flex items-center space-x-1.5 bg-blue-950/80 hover:bg-blue-900/90 px-3 py-1.5 rounded-lg border border-blue-700/60 transition">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <label className="text-[10px] font-bold text-cyan-200 uppercase font-mono">Role:</label>
                <select
                  value={currentUser.role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="text-xs font-semibold bg-transparent text-white focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="STATE_ADMIN">STATE_ADMIN</option>
                  <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              {/* User Profile Pill */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-700/60 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="truncate max-w-[120px] font-bold hidden sm:inline">{currentUser.fullName}</span>
                <span className="text-[10px] font-mono text-cyan-300 font-medium hidden md:inline">({currentUser.badgeNumber})</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-slate-200 hover:text-white hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-800/80"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold hidden md:inline">Logout</span>
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="2xl:hidden p-2 text-slate-200 hover:text-white hover:bg-blue-900/60 rounded-lg transition"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Sub-navbar links for medium/large screens (below 2xl) */}
          <div className="hidden xl:flex 2xl:hidden border-t border-cyan-800/50 py-2 space-x-1 overflow-x-auto">
            {model4VmsNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/vms'}
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-500/25 border border-cyan-400/40'
                      : 'text-cyan-200 hover:bg-cyan-900/40 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <div className="h-6 w-px bg-cyan-700/50 mx-1 self-center" />
            <NavLink
              to="/federation"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 hover:bg-purple-900/40 whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>M3 Federation</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-300 hover:bg-blue-900/40 whitespace-nowrap"
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>M1 Registry</span>
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="2xl:hidden bg-slate-950 border-b border-cyan-800 px-4 py-3 space-y-1 shadow-2xl text-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-800/80 mb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">MODEL 4 CENTRAL VMS</span>
              <div className="flex items-center space-x-1.5 bg-blue-900/80 px-2.5 py-1 rounded-lg border border-blue-700">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={currentUser.role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="text-xs font-semibold bg-transparent text-white focus:outline-none [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="STATE_ADMIN">STATE_ADMIN</option>
                  <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
            </div>
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-2 pt-1 font-mono">Central VMS Operations</div>
            {model4VmsNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white font-bold shadow-md'
                      : 'text-slate-200 hover:bg-cyan-900/40 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 pt-3 font-mono border-t border-slate-800 mt-2">M3 Multi-Vendor Federation</div>
            {federationNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-2 pt-3 font-mono border-t border-slate-800 mt-2">M1 State Camera Registry</div>
            {registryNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'text-blue-200 hover:bg-blue-900/40 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Page Content Outlet */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};