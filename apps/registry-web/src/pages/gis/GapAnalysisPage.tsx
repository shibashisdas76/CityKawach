import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CoverageZone } from '../../types/camera.types';
import { ShieldAlert, RefreshCw, Calculator, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export const GapAnalysisPage: React.FC = () => {
  const [zones, setZones] = useState<CoverageZone[]>(apiService.getCoverageZones());
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setZones(apiService.getCoverageZones());
    });
    return () => unsubscribe();
  }, []);

  const handleRecalculateGaps = async () => {
    setIsRecalculating(true);
    await apiService.recalculateGaps();
    setZones(apiService.getCoverageZones());
    setIsRecalculating(false);
  };

  const handleExportReport = () => {
    const headers = ['Zone Code', 'Zone Name', 'Ward', 'District', 'Required Cameras', 'Installed Cameras', 'VDI %', 'Priority Deficit Tier'];
    const rows = zones.map(z => [
      z.zone_code,
      `"${z.zone_name}"`,
      `"${z.ward}"`,
      z.district,
      z.required_cameras || 10,
      z.actual_cameras || 0,
      `${((z.vulnerability_index || 0) * 100).toFixed(0)}%`,
      z.priority_tier || 'NORMAL'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gujarat_CCTV_VDI_Gap_Analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">LOW DEFICIT</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">MEDIUM DEFICIT</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold font-mono">HIGH DEFICIT</span>;
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">CRITICAL GAP</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold font-mono">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span>Gap Intelligence & VDI Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Spatial analysis calculating Vulnerability Deficit Index (VDI) per urban ward and critical zone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center space-x-1.5 border border-slate-300 shadow-xs"
          >
            {exported ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Exported CSV</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export VDI Report</span>
              </>
            )}
          </button>

          <button
            onClick={handleRecalculateGaps}
            disabled={isRecalculating}
            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center space-x-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Zone Gaps</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl space-y-2 text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-2 text-blue-600 font-bold uppercase text-[11px] tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>Vulnerability Deficit Index Formula</span>
        </div>
        <p className="text-slate-600 font-semibold">
          VDI = Clamp(1.0 - (Actual Installed Cameras / Required Target Density), 0.0, 1.0)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zones.map((zone: CoverageZone) => {
          const req = zone.required_cameras || 10;
          const actual = zone.actual_cameras || 5;
          const vdi = zone.vulnerability_index || 0.5;

          return (
            <div key={zone.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-mono font-bold text-blue-600 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-100">{zone.zone_code}</span>
                  {getTierBadge(zone.priority_tier)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{zone.zone_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">{zone.ward}, {zone.district}</div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold">Vulnerability Index (VDI)</span>
                    <span className="font-bold text-slate-900">{(vdi * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: `${vdi * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">REQUIRED</span>
                    <span className="text-slate-900 font-bold mt-0.5 block">{req}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">INSTALLED</span>
                    <span className="text-emerald-600 font-bold mt-0.5 block">{actual}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
