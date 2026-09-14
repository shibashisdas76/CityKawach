import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  Server,
  Eye,
  CheckCircle2,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';
import { PipelineDiagnosticsModal } from '../common/PipelineDiagnosticsModal';

// Model 1: Statewide Master Camera Registry & GIS Sub-Items
const model1RegistryNavItems = [
  { name: 'Registry Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camera Inventory', href: '/cameras', icon: Video },
  { name: 'GIS Live Map', href: '/map', icon: MapPin },
  { name: 'Health Telemetry', href: '/health', icon: Activity },
  { name: 'VDI Gap Analysis', href: '/gap-analysis', icon: Layers },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Audit Ledger', href: '/audit-logs', icon: ShieldCheck },
];

// Model 2: Edge ANPR & Live Video Wall Sub-Items
const model2AnprNavItems = [
  { name: 'Live Video Wall', href: '/vms/live', icon: Video },
  { name: 'Edge ANPR Engine', href: '/vms/anpr', icon: Car },
  { name: 'Vehicle Tracking', href: '/vms/tracking', icon: Globe },
  { name: 'Watchlist & Alerts', href: '/vms/alerts', icon: AlertTriangle },
];

// Model 3: VMS Middleware & Multi-Vendor Federation Sub-Items
const model3FederationNavItems = [
  { name: 'Federation Hub', href: '/federation', icon: Layers },
  { name: 'Cross-VMS Video Wall', href: '/federation/wall', icon: Video },
  { name: 'Kafka Stream & CEP', href: '/federation/correlation', icon: Zap },
  { name: 'Unified Incident Hub', href: '/federation/incidents', icon: ShieldAlert },
  { name: 'Connector SDKs', href: '/federation/connectors', icon: Sliders },
  { name: 'Federated Reports', href: '/federation/reports', icon: FileSpreadsheet },
];

// Model 4: Consolidated Central VMS Platform Sub-Items
const model4VmsNavItems = [
  { name: 'VMS Overview', href: '/vms', icon: MonitorPlay },
  { name: 'Timeline Playback', href: '/vms/playback', icon: Film },
  { name: 'Multi-Task AI Suite', href: '/vms/ai-suite', icon: Sparkles },
  { name: 'Gov DB Gateways', href: '/vms/integrations', icon: Zap },
  { name: 'Tiered Storage', href: '/vms/storage', icon: HardDrive },
  { name: '80k Load Lab', href: '/vms/scalability', icon: Gauge },
  { name: 'Disaster Recovery', href: '/vms/dr', icon: RefreshCw },
  { name: 'Zero-Trust Security', href: '/vms/security', icon: Lock },
];

export const AppLayout: React.FC = () => {
  const { currentUser, setRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Detect active model based on current pathname
  const pathname = location.pathname;
  let activeModel = 'model4';
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/cameras') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/health') ||
    pathname.startsWith('/gap-analysis') ||
    pathname.startsWith('/departments') ||
    pathname.startsWith('/audit-logs')
  ) {
    activeModel = 'model1';
  } else if (
    pathname === '/vms/live' ||
    pathname === '/vms/anpr' ||
    pathname === '/vms/tracking' ||
    pathname === '/vms/alerts' ||
    pathname.startsWith('/viewer')
  ) {
    activeModel = 'model2';
  } else if (pathname.startsWith('/federation')) {
    activeModel = 'model3';
  } else {
    activeModel = 'model4';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC] font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ── TOP LEVEL REAL-TIME INTERCONNECTION PIPELINE RIBBON ── */}
      <div className="bg-slate-950 border-b border-cyan-900/60 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-[1760px] mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Real-Time Interconnection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-emerald-400 font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              4-MODEL DATAFLOW: FULLY CONNECTED
            </div>
            
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-cyan-300/90">
              <span className="bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded text-blue-300">
                M1: 36 Cams (GIS Sync)
              </span>
              <span className="text-slate-600">➔</span>
              <span className="bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded text-cyan-300">
                M2: 30 RTSP / YOLOv8 ANPR
              </span>
              <span className="text-slate-600">➔</span>
              <span className="bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded text-purple-300">
                M3: Kafka &amp; 4 CEP Rules
              </span>
              <span className="text-slate-600">➔</span>
              <span className="bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded text-indigo-300">
                M4: Multi-Task AI &amp; Gov DBs
              </span>
            </div>
          </div>

          {/* Right: Diagnostics Trigger & Stream Health */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiagnosticsOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold transition shadow-sm border border-cyan-400/40"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pipeline Diagnostics &amp; Topology</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Latency: <span className="text-emerald-400 font-bold">28ms</span> | RPO &lt; 1s
            </span>
          </div>

        </div>
      </div>

      {/* ── MAIN HEADER: 4-MODEL SELECTOR & USER TOOLS ── */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shadow-xl sticky top-0 z-40 text-white">
        <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Statewide Brand Logo */}
            <NavLink to="/vms" className="flex items-center space-x-3 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/25 text-lg group-hover:scale-105 transition-transform">
                V4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                    STATEWIDE CCTV PLATFORM
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1.5 py-0.5 rounded">
                    CONSOLIDATED
                  </span>
                </div>
                <p className="text-[10px] text-cyan-400 font-mono tracking-tight font-bold">GUJARAT POLICE SURVEILLANCE &amp; FORENSICS</p>
              </div>
            </NavLink>

            {/* Center: Master 4-Model Switcher Tabs */}
            <nav className="hidden xl:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
              
              {/* Model 1 Tab */}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeModel === 'model1'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 border border-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Database className="w-3.5 h-3.5 text-blue-300" />
                <span>MODEL 1: Registry &amp; GIS</span>
              </NavLink>

              {/* Model 2 Tab */}
              <NavLink
                to="/vms/live"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeModel === 'model2'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/30 border border-cyan-400/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Video className="w-3.5 h-3.5 text-cyan-300" />
                <span>MODEL 2: Video Wall &amp; ANPR</span>
              </NavLink>

              {/* Model 3 Tab */}
              <NavLink
                to="/federation"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeModel === 'model3'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/30 border border-purple-400/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Layers className="w-3.5 h-3.5 text-purple-300" />
                <span>MODEL 3: Federation &amp; CEP</span>
              </NavLink>

              {/* Model 4 Tab */}
              <NavLink
                to="/vms"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeModel === 'model4'
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 border border-emerald-400/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-300" />
                <span>MODEL 4: Central VMS Platform</span>
              </NavLink>

            </nav>

            {/* Right: Actions, Role Selector & User Tools */}
            <div className="flex items-center space-x-3">
              {/* Role Selector */}
              <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <label className="text-[10px] font-bold text-slate-300 uppercase font-mono">Role:</label>
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
              <div className="flex items-center space-x-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-700 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="truncate max-w-[120px] font-bold hidden sm:inline">{currentUser.fullName}</span>
                <span className="text-[10px] font-mono text-cyan-300 font-medium hidden md:inline">({currentUser.badgeNumber})</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-slate-300 hover:text-white hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-800"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold hidden md:inline">Logout</span>
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* ── ACTIVE MODEL SUB-NAVIGATION BAR ── */}
          <div className="border-t border-slate-800/80 py-1.5 flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] font-extrabold font-mono uppercase px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 shrink-0">
              {activeModel === 'model1' && 'M1 REGISTRY & GIS TOOLS'}
              {activeModel === 'model2' && 'M2 LIVE EDGE & ANPR TOOLS'}
              {activeModel === 'model3' && 'M3 FEDERATION & CEP TOOLS'}
              {activeModel === 'model4' && 'M4 CENTRAL VMS SUITE'}
            </span>

            <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

            {/* Model 1 Sub-Items */}
            {activeModel === 'model1' &&
              model1RegistryNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}

            {/* Model 2 Sub-Items */}
            {activeModel === 'model2' &&
              model2AnprNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}

            {/* Model 3 Sub-Items */}
            {activeModel === 'model3' &&
              model3FederationNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}

            {/* Model 4 Sub-Items */}
            {activeModel === 'model4' &&
              model4VmsNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/vms'}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
          <div className="xl:hidden bg-slate-950 border-b border-cyan-800 px-4 py-3 space-y-3 shadow-2xl text-white max-h-[80vh] overflow-y-auto">
            
            {/* Quick Switcher */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-blue-900/60 border border-blue-700 text-xs font-bold text-center"
              >
                M1: Registry &amp; GIS
              </NavLink>
              <NavLink
                to="/vms/live"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-cyan-900/60 border border-cyan-700 text-xs font-bold text-center"
              >
                M2: Video Wall &amp; ANPR
              </NavLink>
              <NavLink
                to="/federation"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-purple-900/60 border border-purple-700 text-xs font-bold text-center"
              >
                M3: Federation &amp; CEP
              </NavLink>
              <NavLink
                to="/vms"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-emerald-900/60 border border-emerald-700 text-xs font-bold text-center"
              >
                M4: Central VMS
              </NavLink>
            </div>

            {/* Model 4 */}
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">M4 Central VMS Platform</div>
            {model4VmsNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Model 3 */}
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider pt-2 font-mono border-t border-slate-800">M3 Federation &amp; CEP</div>
            {model3FederationNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Model 2 */}
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pt-2 font-mono border-t border-slate-800">M2 Edge ANPR &amp; Video Wall</div>
            {model2AnprNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Model 1 */}
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider pt-2 font-mono border-t border-slate-800">M1 Statewide Camera Registry</div>
            {model1RegistryNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}

          </div>
        )}
      </header>

      {/* ── MAIN PAGE CONTENT OUTLET ── */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto p-4 sm:p-5 lg:p-6">
        <Outlet />
      </main>

      {/* ── UNIFIED 4-MODEL PIPELINE DIAGNOSTICS MODAL ── */}
      <PipelineDiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </div>
  );
};