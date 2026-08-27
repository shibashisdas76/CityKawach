import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { FileSpreadsheet, Lock, Clock, Code, X } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState(apiService.getAuditLogs());
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setLogs(apiService.getAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log: any) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Audit Logs</span>
          </h2>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-semibold flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Append-Only Active</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Tamper-evident administrative action log recording camera registration, status modifications, and bulk import events.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 text-slate-900 font-semibold border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
          >
            <option value="ALL">All Actions</option>
            <option value="INITIALIZE_SCHEMA">INITIALIZE_SCHEMA</option>
            <option value="REGISTER_CAMERA">REGISTER_CAMERA</option>
            <option value="BULK_CSV_IMPORT">BULK_CSV_IMPORT</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">Total Audit Records: <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong></span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80 font-bold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">JSON Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-blue-50/20 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      <div className="flex items-center space-x-2 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] font-mono text-blue-600 font-bold">{log.actorRole}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {log.targetEntity} / <span className="text-slate-900 font-bold">{log.targetId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition text-[11px] font-semibold inline-flex items-center space-x-1.5 border border-slate-200 shadow-sm"
                      >
                        <Code className="w-3.5 h-3.5 text-blue-600" />
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <Code className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight">Audit Payload Diff</h3>
                  <div className="text-[10px] font-mono text-slate-500 font-semibold">{selectedLog.action} • {selectedLog.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">ACTOR DETAILS:</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div>Name: <span className="text-slate-900 font-bold">{selectedLog.actorName}</span></div>
                <div>Role: <span className="text-blue-600 font-bold">{selectedLog.actorRole}</span></div>
              </div>

              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider pt-2">JSON PAYLOAD:</div>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 overflow-x-auto text-xs font-mono shadow-inner">
                {JSON.stringify(selectedLog.metadataDiff, null, 2)}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono text-xs font-bold transition"
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

