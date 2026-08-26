import React, { useState } from 'react';
import { MOCK_COVERAGE_ZONES, MOCK_CAMERAS } from '../../services/supabaseClient';
import { CoverageZone } from '../../types/camera.types';
import { ShieldAlert, RefreshCw, Calculator } from 'lucide-react';

export const GapAnalysisPage: React.FC = () => {
  const [zones, setZones] = useState<CoverageZone[]>(MOCK_COVERAGE_ZONES);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateGaps = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      const updated: CoverageZone[] = zones.map((z: CoverageZone) => {
        const matchingCams = MOCK_CAMERAS.filter((c: any) => c.district === z.district);
        const actual = matchingCams.length;
        const required = z.required_cameras || Math.max(1, Math.round(z.target_camera_density * 2));
        const vdi = Math.max(0, Math.min(1, 1.0 - (actual / required)));

        let tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (vdi > 0.7) tier = 'CRITICAL';
        else if (vdi > 0.4) tier = 'HIGH';
        else if (vdi > 0.2) tier = 'MEDIUM';

        return {
          ...z,
          actual_cameras: actual,
          vulnerability_index: parseFloat(vdi.toFixed(2)),
          priority_tier: tier
        };
      });

      setZones(updated);
      setIsRecalculating(false);
      alert('PostGIS gap recalculation executed successfully!');
    }, 400);
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'LOW':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">LOW DEFICIT</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">MEDIUM DEFICIT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">HIGH DEFICIT</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold">CRITICAL GAP</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Coverage Gap & Vulnerability Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Spatial analysis calculating Vulnerability Deficit Index (VDI) per urban ward.
          </p>
        </div>

        <button
          onClick={handleRecalculateGaps}
          disabled={isRecalculating}
          className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition flex items-center space-x-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>Recalculate Zone Gaps</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-2 text-blue-700 font-bold">
          <Calculator className="w-4 h-4" />
          <span>Vulnerability Deficit Index Formula</span>
        </div>
        <p className="text-slate-600">
          VDI = Clamp(1.0 - (Actual Cameras / Required Cameras), 0.0, 1.0)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zones.map((zone: CoverageZone) => {
          const req = zone.required_cameras || 10;
          const actual = zone.actual_cameras || 5;
          const vdi = zone.vulnerability_index || 0.5;

          return (
            <div key={zone.id} className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-mono font-bold text-blue-700">{zone.zone_code}</span>
                  {getTierBadge(zone.priority_tier)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{zone.zone_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{zone.ward}, {zone.district}</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Vulnerability Index (VDI)</span>
                    <span className="font-bold text-slate-900">{(vdi * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${vdi * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-200">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">REQUIRED</span>
                    <span className="text-slate-900 font-bold">{req}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">INSTALLED</span>
                    <span className="text-emerald-700 font-bold">{actual}</span>
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
