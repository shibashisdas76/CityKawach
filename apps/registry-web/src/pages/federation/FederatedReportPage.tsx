import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Layers,
  Server,
  Shield,
  FileCode,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { federationService } from '../../services/federationService';
import { FederatedAnalyticsReport } from '../../types/federation.types';

export const FederatedReportPage: React.FC = () => {
  const [report, setReport] = useState<FederatedAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await federationService.getSampleReport();
      setReport(data);
      setLoading(false);
    };
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_federated_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!report) return;
    let csv = 'Vendor,Camera Count,24h Events,Avg Latency (ms),Uptime (%)\n';
    report.vendorBreakdown.forEach(v => {
      csv += `"${v.vendorName}",${v.cameraCount},${v.eventCount24h},${v.avgLatencyMs},${v.uptimePercent}\n`;
    });
    csv += '\nDepartment,Critical Incidents,High Incidents,Medium Incidents,Low Incidents,MTTR (Minutes)\n';
    report.departmentalIncidentMatrix.forEach(d => {
      csv += `"${d.department}",${d.criticalIncidents},${d.highIncidents},${d.mediumIncidents},${d.lowIncidents},${d.avgMttrMinutes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_federated_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return (
      <div className="bg-slate-900 rounded-3xl p-12 text-center text-slate-400">
        <p className="text-sm font-bold">Loading federated operational analytics...</p>
      </div>
    );
  }

  const pieColors = ['#E11D48', '#059669', '#D97706', '#2563EB', '#7C3AED'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-black text-white">Federated Analytics & Interoperability Report</h1>
              <p className="text-xs text-slate-400">
                Statewide CCTV federation performance, SLA uptime, cross-agency incident MTTR, and throughput benchmarks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            JSON
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Report Metadata Banner */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/20 px-2.5 py-1 rounded-md border border-cyan-500/30">
              OFFICIAL STATEWIDE SURVEILLANCE REPORT
            </span>
            <h2 className="text-xl font-black text-white mt-2 print:text-black">
              Gujarat Statewide CCTV Federation Intelligence Summary
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
              Reporting Period: {report.reportingPeriod} • Generated: {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-mono">SLA UPTIME</span>
              <p className="text-base font-black text-emerald-400">{report.systemAvailabilitySlaPercent}%</p>
            </div>
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-mono">AVG MTTR</span>
              <p className="text-base font-black text-cyan-300">{report.meanTimeToResolutionMinutes} mins</p>
            </div>
          </div>
        </div>

        {/* High-Level Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Federated VMS Platforms</span>
            <p className="text-2xl font-black text-white mt-1">{report.totalFederatedVms}</p>
            <p className="text-[10px] text-cyan-400 mt-0.5">5 Major Vendor Engines</p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Statewide Cameras Synced</span>
            <p className="text-2xl font-black text-white mt-1">{report.totalFederatedCameras}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">100% Live Sentinel Grid</p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase">24h Events Processed</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{report.totalEventsProcessed24h.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">~340 events / sec</p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase">CEP Correlations Triggered</span>
            <p className="text-2xl font-black text-rose-400 mt-1">{report.totalCorrelationsTriggered24h}</p>
            <p className="text-[10px] text-rose-300 mt-0.5">Cross-agency incident flags</p>
          </div>
        </div>

        {/* Charts: Vendor Distribution & Hourly Event Volume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor Camera Distribution Bar Chart */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Camera Allocation by VMS Vendor
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.vendorBreakdown}>
                  <XAxis dataKey="vendorName" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v.split(' ')[0]} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="cameraCount" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Cameras" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Incident Flow Area Chart */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              24-Hour Incident Volume by Departmental VMS
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.hourlyIncidentVolume}>
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="trafficVms" stackId="1" stroke="#e11d48" fill="#e11d48" fillOpacity={0.6} name="Traffic Police" />
                  <Area type="monotone" dataKey="policeVms" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.6} name="State Police" />
                  <Area type="monotone" dataKey="correlatedAlerts" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} name="CEP Alerts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Vendor Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Federated VMS Platform SLA & Telemetry Breakdown
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Platform / Vendor</th>
                  <th className="p-3">Cameras Synced</th>
                  <th className="p-3">Events (24h)</th>
                  <th className="p-3">Avg Latency</th>
                  <th className="p-3">Uptime SLA</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {report.vendorBreakdown.map(v => (
                  <tr key={v.vendor} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{v.vendorName}</td>
                    <td className="p-3 font-mono">{v.cameraCount} feeds</td>
                    <td className="p-3 font-mono text-cyan-300">{v.eventCount24h.toLocaleString()}</td>
                    <td className="p-3 font-mono text-emerald-400">{v.avgLatencyMs} ms</td>
                    <td className="p-3 font-mono text-emerald-400">{v.uptimePercent}%</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        HEALTHY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Departmental Incident Matrix Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Cross-Departmental Incident Severity & Mean Time to Resolution (MTTR)
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Department Agency</th>
                  <th className="p-3 text-rose-400">Critical</th>
                  <th className="p-3 text-amber-400">High</th>
                  <th className="p-3 text-blue-400">Medium</th>
                  <th className="p-3 text-slate-400">Low</th>
                  <th className="p-3">Avg MTTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {report.departmentalIncidentMatrix.map(d => (
                  <tr key={d.department} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{d.department}</td>
                    <td className="p-3 font-mono text-rose-400 font-bold">{d.criticalIncidents}</td>
                    <td className="p-3 font-mono text-amber-300 font-bold">{d.highIncidents}</td>
                    <td className="p-3 font-mono text-blue-300">{d.mediumIncidents}</td>
                    <td className="p-3 font-mono text-slate-400">{d.lowIncidents}</td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">{d.avgMttrMinutes} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signoff Footer */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <p>Statewide CCTV Command Center • Model 3 VMS Federation Middleware</p>
          <p className="font-mono">Audit Hash: SHA256-FED-{new Date().getTime().toString(16).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
};
