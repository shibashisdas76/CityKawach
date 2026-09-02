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
  // VMS & Model 2 icons
  MonitorPlay,
  Car,
  Globe,
  Cpu,
  Zap,
  HardDrive,
  Lock,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';
import { supabase } from '../../services/supabaseClient';

const registryNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camera Registry', href: '/cameras', icon: Video },
  { name: 'Add Camera', href: '/cameras/new', icon: PlusCircle },
  { name: 'Bulk Import', href: '/cameras/import', icon: Upload },
  { name: 'GIS Map', href: '/map', icon: MapPin },
  { name: 'Health Telemetry', href: '/health', icon: Activity },
  { name: 'Gap Intelligence', href: '/gap-analysis', icon: Layers },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
];

const vmsNavItems = [
  { name: 'VMS Overview', href: '/vms', icon: MonitorPlay },
  { name: 'Live Video Wall', href: '/vms/live', icon: Video },
  { name: 'ANPR Engine', href: '/vms/anpr', icon: Car },
  { name: 'Vehicle Tracking', href: '/vms/tracking', icon: Globe },
  { name: 'Alerts Hub', href: '/vms/alerts', icon: AlertTriangle },
  { name: 'Analytics Engine', href: '/vms/analytics', icon: Cpu },
  { name: 'Integration Hub', href: '/vms/integrations', icon: Zap },
  { name: 'Storage Tiers', href: '/vms/storage', icon: HardDrive },
  { name: 'Security', href: '/vms/security', icon: Lock },
];

const allNavigationItems = [...registryNavItems, ...vmsNavItems];

export const AppLayout: React.FC = () => {
  const { currentUser, setRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-[#F8FBFF] font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar Header */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/80 shadow-lg sticky top-0 z-40 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-extrabold text-white shadow-md shadow-cyan-500/20 text-base">
                G
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-extrabold tracking-tight text-white uppercase">STATE CCTV PLATFORM</h1>
                <p className="text-[10px] text-cyan-400 font-mono tracking-tight font-bold">MODEL 1 + MODEL 2 UNIFIED COMMAND</p>
              </div>
            </div>

            {/* Center: Desktop Navigation Bar */}
            <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-2">
              {/* Registry Section */}
              {registryNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 border border-blue-400/40'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
              {/* VMS divider */}
              <div className="w-px h-5 bg-blue-700/60 mx-1 shrink-0" />
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest whitespace-nowrap shrink-0">M2/M4</span>
              {/* VMS Section */}
              {vmsNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/vms'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-500/25 border border-cyan-400/40'
                        : 'text-cyan-200 hover:bg-cyan-900/30 hover:text-cyan-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
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
                className="xl:hidden p-2 text-slate-200 hover:text-white hover:bg-blue-900/60 rounded-lg transition"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Sub-navbar links for medium screens (between lg and xl) */}
          <div className="hidden lg:flex xl:hidden border-t border-blue-800/60 py-2 space-x-1 overflow-x-auto">
            {allNavigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 border border-blue-400/40'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-blue-950 border-b border-blue-900 px-4 py-3 space-y-1 shadow-lg text-white">
            <div className="flex items-center justify-between pb-2 border-b border-blue-800 mb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Navigation Menu</span>
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
            {allNavigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'text-slate-200 hover:bg-blue-900 hover:text-white'
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