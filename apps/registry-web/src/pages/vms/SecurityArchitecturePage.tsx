import React, { useState } from 'react';
import { vmsService } from '../../services/vmsService';
import { Shield, Lock, Network, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Users, Key, Server, Eye } from 'lucide-react';

const RBAC_MATRIX = [
  { role: 'SUPER_ADMIN', perms: ['Live View', 'Playback', 'PTZ Control', 'Config', 'User Mgmt', 'Export', 'ANPR Query', 'Analytics', 'DR Control'] },
  { role: 'STATE_ADMIN', perms: ['Live View', 'Playback', 'Config', 'Export', 'ANPR Query', 'Analytics'] },
  { role: 'DEPARTMENT_ADMIN', perms: ['Live View', 'Playback', 'Export', 'ANPR Query', 'Analytics'] },
  { role: 'OPERATOR', perms: ['Live View', 'Playback', 'PTZ Control', 'ANPR Query'] },
  { role: 'VIEWER', perms: ['Live View'] },
];

const ALL_PERMS = ['Live View', 'Playback', 'PTZ Control', 'Config', 'User Mgmt', 'Export', 'ANPR Query', 'Analytics', 'DR Control'];

export const SecurityArchitecturePage: React.FC = () => {
  const drNodes = vmsService.getDrNodes();
  const [activeFailoverTest, setActiveFailoverTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runFailoverTest = async () => {
    setActiveFailoverTest(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 2500));
    setTestResult('✓ Failover simulation complete. Secondary site (Surat GSWAN) took over in 47 seconds. RPO: 8 minutes. RTO: 52 seconds.');
    setActiveFailoverTest(false);
  };

  const networkZones = [
    { name: 'Camera OT Zone', desc: 'RTSP/RTP ingest only · No direct Internet · VLAN isolated', level: 'RESTRICTED', color: 'border-red-500/50 bg-red-950/20' },
    { name: 'AI Processing Zone', desc: 'GPU cluster for inference · No external egress', level: 'RESTRICTED', color: 'border-orange-500/50 bg-orange-950/20' },
    { name: 'VMS Core Zone', desc: 'VMS servers, DB, Kafka · Internal only · mTLS', level: 'SECURE', color: 'border-amber-500/50 bg-amber-950/20' },
    { name: 'Integration DMZ', desc: 'VAHAN/SARTHI/eGujCop API gateway · Firewall-controlled', level: 'CONTROLLED', color: 'border-blue-500/50 bg-blue-950/20' },
    { name: 'Operator Access Zone', desc: 'Web consoles, RBAC auth · MFA enforced · VPN required', level: 'MANAGED', color: 'border-emerald-500/50 bg-emerald-950/20' },
    { name: 'Public Internet', desc: 'No direct access to any VMS zone · DDoS protection at perimeter', level: 'BLOCKED', color: 'border-slate-500/50 bg-slate-800/20' },
  ];

  const encryptionPolicies = [
    { scope: 'Video Streams (In Transit)', algo: 'TLS 1.3 / SRTP', status: 'ACTIVE' },
    { scope: 'Video at Rest (Hot Tier)', algo: 'AES-256-GCM', status: 'ACTIVE' },
    { scope: 'Video at Rest (Cold Tier)', algo: 'AES-256 + HMAC', status: 'ACTIVE' },
    { scope: 'API Communications', algo: 'mTLS + OAuth 2.0', status: 'ACTIVE' },
    { scope: 'Database (PostgreSQL)', algo: 'TDE (Transparent Data Encryption)', status: 'ACTIVE' },
    { scope: 'Audit Logs', algo: 'Immutable ledger + SHA-256 chaining', status: 'ACTIVE' },
    { scope: 'Backup Tapes', algo: 'AES-256 + offline key escrow', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 to-rose-950 rounded-2xl p-6 border border-red-700/40">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-red-300" />
          <h2 className="text-lg font-black text-white">Security Architecture</h2>
        </div>
        <p className="text-xs text-red-300">
          RBAC, encryption, network segmentation, cybersecurity controls, and disaster recovery
        </p>
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Security Controls', value: '47', color: 'text-emerald-300' },
            { label: 'Vulnerabilities', value: '0 Critical', color: 'text-emerald-300' },
            { label: 'Last Pentest', value: 'Aug 2026', color: 'text-white' },
            { label: 'Compliance', value: 'NDSA + ISO27001', color: 'text-white' },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-xl px-4 py-2">
              <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-red-300 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">RBAC Permission Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/60">
                <th className="text-left px-4 py-2.5 text-slate-400 font-semibold w-36">Role</th>
                {ALL_PERMS.map(p => (
                  <th key={p} className="px-2 py-2.5 text-slate-400 font-semibold text-center whitespace-nowrap">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {RBAC_MATRIX.map(row => (
                <tr key={row.role} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-white text-[11px]">{row.role}</span>
                  </td>
                  {ALL_PERMS.map(p => (
                    <td key={p} className="px-2 py-2.5 text-center">
                      {row.perms.includes(p)
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        : <XCircle className="w-3.5 h-3.5 text-slate-700 mx-auto" />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Network Segmentation */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Network Segmentation</h3>
          </div>
          <div className="space-y-2">
            {networkZones.map(zone => (
              <div key={zone.name} className={`rounded-xl border p-3 ${zone.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-white">{zone.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    zone.level === 'RESTRICTED' ? 'bg-red-500/30 text-red-300' :
                    zone.level === 'SECURE' ? 'bg-amber-500/20 text-amber-300' :
                    zone.level === 'CONTROLLED' ? 'bg-blue-500/20 text-blue-300' :
                    zone.level === 'MANAGED' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{zone.level}</span>
                </div>
                <p className="text-[10px] text-slate-400">{zone.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Encryption Policies */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Encryption Policies</h3>
          </div>
          <div className="space-y-2">
            {encryptionPolicies.map(policy => (
              <div key={policy.scope} className="flex items-center justify-between py-2 border-b border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{policy.scope}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{policy.algo}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          {/* MFA + VPN */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1 bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-center">
              <Key className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">MFA Enforced</p>
              <p className="text-[10px] text-slate-400">TOTP + Hardware Token</p>
            </div>
            <div className="flex-1 bg-violet-950/40 border border-violet-500/30 rounded-xl p-3 text-center">
              <Shield className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Zero Trust VPN</p>
              <p className="text-[10px] text-slate-400">WireGuard + cert auth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disaster Recovery */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Disaster Recovery & Redundancy</h3>
          </div>
          <button
            onClick={runFailoverTest}
            disabled={activeFailoverTest}
            className="flex items-center gap-2 bg-cyan-700/30 hover:bg-cyan-700/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {activeFailoverTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {activeFailoverTest ? 'Simulating…' : 'Run DR Test'}
          </button>
        </div>

        {testResult && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">{testResult}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {drNodes.map(node => (
            <div
              key={node.id}
              className={`rounded-xl border p-4 ${
                node.status === 'ACTIVE' ? 'border-emerald-500/40 bg-emerald-950/20' :
                node.status === 'STANDBY' ? 'border-blue-500/30 bg-blue-950/20' :
                'border-red-500/40 bg-red-950/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{node.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  node.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-300' :
                  node.status === 'STANDBY' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-red-500/30 text-red-300'
                }`}>{node.status}</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">{node.location}</p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">RPO</span>
                  <span className="text-slate-200 font-bold">{node.rpoMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RTO</span>
                  <span className="text-slate-200 font-bold">{node.rtoMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Test</span>
                  <span className="text-slate-200 font-mono">{new Date(node.lastFailoverTest).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
