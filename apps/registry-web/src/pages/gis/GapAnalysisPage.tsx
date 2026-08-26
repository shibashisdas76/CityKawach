import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CoverageZone } from '../../types/camera.types';
import { ShieldAlert, RefreshCw, Calculator } from 'lucide-react';

export const GapAnalysisPage: React.FC = () => {
  const [zones, setZones] = useState<CoverageZone[]>(apiService.getCoverageZones());
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setZones(apiService.getCoverageZones());
    });
    return () => unsubscribe();
  }, []);

  const handleRecalculateGaps = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      apiService.recalculateGaps();
      setIsRecalculating(false);
    }, 400);
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold font-mono">LOW DEFICIT</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-md bg-blue-100/80 text-blue-800 text-[10px] font-extrabold font-mono">MEDIUM DEFICIT</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-md bg-amber-100/80 text-amber-800 text-[10px] font-extrabold font-mono">HIGH DEFICIT</span>;
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-md bg-rose-100/80 text-rose-800 text-[10px] font-extrabold font-mono shadow-sm shadow-rose-500/20">CRITICAL GAP</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-extrabold font-mono">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200/80 p-6 rounded-2xl shadow-saasable gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <span>Coverage Gap & Vulnerability Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Spatial analysis calculating Vulnerability Deficit Index (VDI) per urban ward.
          </p>
        </div>

        <button
          onClick={handleRecalculateGaps}
          disabled={isRecalculating}
          className="px-4.5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition flex items-center space-x-2 shadow-md shadow-indigo-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>Recalculate Zone Gaps</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl space-y-2 text-xs font-mono shadow-saasable">
        <div className="flex items-center space-x-2 text-indigo-600 font-extrabold uppercase text-[11px] tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>Vulnerability Deficit Index Formula</span>
        </div>
        <p className="text-slate-600 font-semibold">
          VDI = Clamp(1.0 - (Actual Cameras / Required Cameras), 0.0, 1.0)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zones.map((zone: CoverageZone) => {
          const req = zone.required_cameras || 10;
          const actual = zone.actual_cameras || 5;
          const vdi = zone.vulnerability_index || 0.5;

          return (
            <div key={zone.id} className="saasable-card p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-mono font-extrabold text-indigo-600 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">{zone.zone_code}</span>
                  {getTierBadge(zone.priority_tier)}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{zone.zone_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">{zone.ward}, {zone.district}</div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold">Vulnerability Index (VDI)</span>
                    <span className="font-extrabold text-slate-900">{(vdi * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                      style={{ width: `${vdi * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">REQUIRED</span>
                    <span className="text-slate-900 font-extrabold mt-0.5 block">{req}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">INSTALLED</span>
                    <span className="text-emerald-600 font-extrabold mt-0.5 block">{actual}</span>
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

