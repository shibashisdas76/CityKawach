import React, { useState } from 'react';
import { MOCK_AUDIT_LOGS } from '../../services/supabaseClient';
import { FileSpreadsheet, Lock, Clock, Code, X } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = MOCK_AUDIT_LOGS.filter((log: any) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-2 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Audit & Compliance Immutable Ledger</span>
          </h2>
          <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Append-Only Active</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Tamper-evident administrative action log recording camera registration, status modifications, and bulk import events.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-slate-600 font-medium">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="INITIALIZE_SCHEMA">INITIALIZE_SCHEMA</option>
            <option value="REGISTER_CAMERA">REGISTER_CAMERA</option>
            <option value="BULK_CSV_IMPORT">BULK_CSV_IMPORT</option>
          </select>
        </div>

        <span className="text-slate-500">Total Audit Records: <strong className="text-slate-900">{filteredLogs.length}</strong></span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">JSON Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] font-mono text-blue-700">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-800 border border-slate-200 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {log.targetEntity} / <span className="text-slate-900 font-bold">{log.targetId}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded bg-slate-100 text-blue-700 hover:bg-blue-50 transition text-[11px] font-bold inline-flex items-center space-x-1 border border-slate-200"
                      >
                        <Code className="w-3 h-3" />
                        <span>View Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Audit Payload Diff</h3>
                  <div className="text-[10px] font-mono text-slate-500">{selectedLog.action} • {selectedLog.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="text-slate-500">ACTOR:</div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div>Name: <span className="text-slate-900 font-bold">{selectedLog.actorName}</span></div>
                <div>Role: <span className="text-blue-700 font-bold">{selectedLog.actorRole}</span></div>
              </div>

              <div className="text-slate-500 pt-2">JSON PAYLOAD:</div>
              <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 overflow-x-auto text-xs">
                {JSON.stringify(selectedLog.metadataDiff, null, 2)}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono text-xs border border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
