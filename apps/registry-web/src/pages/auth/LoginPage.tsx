import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Building, Mail, Lock, LogIn, AlertCircle, CheckCircle2, UserCheck, KeyRound } from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';
import { UserRole } from '@shared/types/cctv-metadata.contract';

const DEMO_DEPARTMENTS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Ahmedabad Traffic Police Surveillance' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Ahmedabad Municipal Corporation (AMC)' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'GSRTC Transport & Highway Dept' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Surat City Police Control' }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState<'admin' | 'department'>('admin');
  const [email, setEmail] = useState('superadmin@gujarat.gov.in');
  const [password, setPassword] = useState('admin123');
  const [departmentId, setDepartmentId] = useState(DEMO_DEPARTMENTS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/vms';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const selectedRole: UserRole = loginType === 'admin' ? 'SUPER_ADMIN' : 'DEPARTMENT_ADMIN';
      const success = await login(email, password, selectedRole, loginType === 'department' ? departmentId : undefined);

      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check official credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickUser = (profileEmail: string, role: 'admin' | 'department') => {
    const profile = DEMO_PROFILES[profileEmail];
    if (profile) {
      setEmail(profile.email);
      setPassword('admin123');
      setLoginType(role);
      if (profile.departmentId) {
        setDepartmentId(profile.departmentId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFF] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/80 overflow-hidden relative z-10 border border-slate-200/80 transition-all">

        {/* Header Section */}
        <div className="p-8 text-center border-b border-slate-100 relative bg-gradient-to-b from-blue-50/40 to-transparent">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">CITYKAWACH COMMAND PORTAL</h1>
          <p className="text-blue-600 text-xs mt-1 font-bold tracking-wider uppercase font-mono">
            CityKawach CCTV Integration &amp; Central VMS Platform
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Model 1 • Model 2 • Model 3 • Model 4 Unified
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Login Type Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setLoginType('admin');
                setEmail('superadmin@gujarat.gov.in');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center transition-all ${
                loginType === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mr-2" />
              State Authority (Super Admin)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('department');
                setEmail('ahmedabad.police@gujarat.gov.in');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center transition-all ${
                loginType === 'department'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5 mr-2" />
              Department Node
            </button>
          </div>

          {/* Quick Demo Access Badges */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Quick Select Authorized Profile
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickUser('superadmin@gujarat.gov.in', 'admin')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition text-[11px]"
              >
                <div className="font-bold text-slate-900">Super Admin</div>
                <div className="text-[10px] text-slate-500 font-mono">superadmin@gujarat.gov.in</div>
              </button>
              <button
                type="button"
                onClick={() => setQuickUser('ahmedabad.police@gujarat.gov.in', 'department')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition text-[11px]"
              >
                <div className="font-bold text-slate-900">Ahmedabad Police</div>
                <div className="text-[10px] text-slate-500 font-mono">ahmedabad.police@...</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start text-rose-700 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Conditional Department Dropdown */}
            {loginType === 'department' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                  Department Node
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-blue-600" />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all text-slate-900 font-semibold"
                  >
                    {DEMO_DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id} className="bg-white text-slate-900">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-blue-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@gujarat.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                Secure Access Key / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-blue-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-3 text-xs tracking-wide uppercase font-mono"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2 text-blue-100" />
                  Authenticate & Enter Command Center
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
              <span>TLS 1.3 Encrypted</span>
            </span>
            <span>Sentinel Portal Grid v4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};