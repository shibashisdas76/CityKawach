import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Network,
  Users,
  Key,
  Server,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  HardDrive,
  Activity,
  Layers
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { SecurityAuditStatus } from '../../types/model4.types';

export const SecurityArchitecturePage: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityAuditStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await model4Service.getSecurityAudit();
      setSecurityData(data);
    } catch (e) {
      console.error('Error loading security audit:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const networkVlans = [
    { vlan: 100, name: 'Streaming Ingestion VLAN', cidr: '10.100.0.0/16', access: 'RTSP/TCP & HLS Only', level: 'RESTRICTED', color: 'border-red-500/40 bg-red-950/20 text-red-300' },
    { vlan: 200, name: 'GPU AI Inference Private Subnet', cidr: '10.200.0.0/16', access: 'DeepStream / TensorRT (Air-Gapped)', level: 'AIR-GAPPED', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300' },
    { vlan: 300, name: 'Command Center & VMS Core', cidr: '10.300.0.0/16', access: 'mTLS 1.3 / RBAC Authenticated', level: 'SECURE', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300' },
    { vlan: 400, name: 'Government DB Gateway DMZ', cidr: '10.400.0.0/16', access: 'IPsec VPN / Dedicated Leased Line', level: 'ISOLATED DMZ', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' }
  ];

  const rbacMatrix = [
    { role: 'SUPER_ADMIN', desc: 'Chief Secretary / State CISO', perms: ['Full Ingest Access', 'Synchronized Playback', 'PTZ Control', 'Multi-Task AI', 'Gov DB Lookups', 'DR Failover Execution', 'Security Ledger Audit'] },
    { role: 'STATE_ADMIN', desc: 'State Police HQ / Transport HQ', perms: ['Cross-Department Feeds', 'Synchronized Playback', 'PTZ Control', 'Multi-Task AI', 'Gov DB Lookups', 'Evidentiary Video Export'] },
    { role: 'DEPARTMENT_ADMIN', desc: 'District SP / Municipal Commissioner', perms: ['Department Camera Feeds', 'Local Playback', 'PTZ Control', 'ANPR & Crowd Analytics', 'Local Alert Triage'] },
    { role: 'OPERATOR', desc: 'Command Room Duty Officer', perms: ['Live Video Wall', 'Vehicle Trajectory Search', 'Alert Interception', 'PTZ Control'] },
    { role: 'VIEWER', desc: 'Auditor / External Liaison', perms: ['Live Stream Preview (Watermarked)', 'Read-Only Reports'] }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-6 border border-slate-700/60 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold rounded-md border border-cyan-500/40 uppercase">
              MODEL 4 ZERO-TRUST GOVERNANCE
            </span>
            <span className="text-xs text-slate-400 font-mono">TLS 1.3 · AES-256-GCM · RBAC · EVIDENCE CHAIN</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Zero-Trust Cybersecurity & Cryptographic Governance
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Multi-tier network segmentation, end-to-end payload encryption with State Key Management Service (KMS),
            and tamper-proof SHA-256 chain-of-custody evidentiary logging.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>ZERO-TRUST STATUS: COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Network Segmentation Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              Statewide Network Segmentation & VLAN Isolation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict firewall boundary enforcement preventing lateral movement between camera feeds, AI compute, and core registries
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200">
            4 Isolated VLANs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {networkVlans.map(v => (
            <div key={v.vlan} className={`rounded-2xl p-4 border space-y-2 ${v.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black">VLAN {v.vlan}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 uppercase">
                  {v.level}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white">{v.name}</h4>
              <p className="text-xs font-mono text-slate-300">{v.cidr}</p>
              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 font-mono">
                Access: <b>{v.access}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Role-Based Access Control (RBAC) Policy Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular permission boundaries enforcing principle of least privilege across all command operations
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rbacMatrix.map(r => (
            <div key={r.role} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-mono text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {r.role}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{r.desc}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {r.perms.map(p => (
                  <span
                    key={p}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidentiary Audit Trail Ledger */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              State Evidentiary Export & Security Audit Trail Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable chain-of-custody logging with cryptographic SHA-256 checksums
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg">
            TAMPER-PROOF LEDGER
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {securityData?.recent_audit_trail && securityData.recent_audit_trail.length > 0 ? (
            securityData.recent_audit_trail.map(a => (
              <div key={a.id} className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-400">{a.action_type}</span>
                  <span className="text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-200">{a.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Actor: <b>{a.actor_name} ({a.actor_role})</b></span>
                  {a.sha256_checksum && <span className="text-emerald-400 truncate max-w-[280px]">SHA: {a.sha256_checksum}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-4 text-center text-slate-400">
              <p>Evidentiary actions, failover simulations, and anomaly resolutions are logged here in real time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
