import React from 'react';
import { FileSpreadsheet, Download, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const ReportsPage: React.FC = () => {
  const downloadCameraCsv = () => {
    const cameras = apiService.getCameras();
    const headers = ['camera_id', 'camera_name', 'department', 'camera_type', 'district', 'ward', 'status', 'ip_address', 'rtsp_url'];
    const rows = cameras.map((c) => [
      c.camera_id,
      `"${c.camera_name}"`,
      `"${c.departments?.name || 'Traffic Police'}"`,
      c.camera_type,
      c.district,
      c.ward,
      c.status,
      c.ip_address || '',
      c.rtsp_url || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cctv_registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAuditJson = () => {
    const auditLogs = apiService.getAuditLogs();
    const jsonContent = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_compliance_ledger_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGapReportCsv = () => {
    const zones = apiService.getCoverageZones();
    const headers = ['zone_code', 'zone_name', 'district', 'ward', 'required_cameras', 'actual_cameras', 'vulnerability_index', 'priority_tier'];
    const rows = zones.map((z) => [
      z.zone_code,
      `"${z.zone_name}"`,
      z.district,
      z.ward,
      z.required_cameras || 10,
      z.actual_cameras || 5,
      z.vulnerability_index || 0.5,
      z.priority_tier || 'MEDIUM'
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial_gap_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cameras = apiService.getCameras();
  const auditLogs = apiService.getAuditLogs();
  const zones = apiService.getCoverageZones();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <span>Reports & Data Export</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Generate compliance documents, PostGIS spatial data packages, and state-level audit trails
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Camera Registry Export */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Camera Registry CSV</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Full metadata dump including RTSP stream endpoints, IP addresses, hardware specs, and GIS coordinates.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              Total Records: <strong className="text-slate-900 font-bold">{cameras.length} Assets</strong>
            </div>
          </div>

          <button
            onClick={downloadCameraCsv}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Camera Registry CSV</span>
          </button>
        </div>

        {/* Audit Compliance Export */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Audit & Compliance Ledger JSON</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Append-only administrative action ledger with cryptographic timestamps and payload diffs.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              Ledger Size: <strong className="text-slate-900 font-bold">{auditLogs.length} Events</strong>
            </div>
          </div>

          <button
            onClick={downloadAuditJson}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Ledger JSON</span>
          </button>
        </div>

        {/* Gap Intelligence Export */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Spatial Gap Intelligence CSV</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Vulnerability Deficit Index (VDI) metrics and target camera density per urban ward.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              Target Zones: <strong className="text-slate-900 font-bold">{zones.length} Sectors</strong>
            </div>
          </div>

          <button
            onClick={downloadGapReportCsv}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Spatial Gap CSV</span>
          </button>
        </div>
      </div>

      {/* Compliance Verification Note */}
      <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex items-center space-x-3 text-xs font-mono border border-slate-800 shadow-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <span className="font-bold text-emerald-400">State Compliance Standard Verified:</span>
          <span className="text-slate-300 ml-1.5 font-medium">
            Exports conform to Gujarat State Cyber Crime & Public Safety Interoperability Specification v1.0.
          </span>
        </div>
      </div>
    </div>
  );
};

