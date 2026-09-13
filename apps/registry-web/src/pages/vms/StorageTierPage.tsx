import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Flame,
  Snowflake,
  Wind,
  Clock,
  Server,
  Calculator,
  Database,
  Layers,
  ShieldCheck,
  Download,
  RotateCcw,
  Play
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { StorageTierSpec } from '../../types/model4.types';

export const StorageTierPage: React.FC = () => {
  const [storageData, setStorageData] = useState<{ storage_architecture: string; tiers: StorageTierSpec[] } | null>(null);
  
  // Sizing Calculator state
  const [calcCams, setCalcCams] = useState<number>(80000);
  const [calcH264Pct, setCalcH264Pct] = useState<number>(70);
  const [calcHotDays, setCalcHotDays] = useState<number>(7);
  const [calcWarmDays, setCalcWarmDays] = useState<number>(30);
  const [calcColdDays, setCalcColdDays] = useState<number>(365);
  const [calcResult, setCalcResult] = useState<any>(null);

  const loadData = async () => {
    const data = await model4Service.getStorageMetrics();
    setStorageData(data);
    runCalculator(calcCams, calcH264Pct, calcHotDays, calcWarmDays, calcColdDays);
  };

  useEffect(() => {
    loadData();
  }, []);

  const runCalculator = async (cams: number, h264: number, hot: number, warm: number, cold: number) => {
    const res = await model4Service.calculateStorage({
      camera_count: cams,
      h264_pct: h264,
      days_hot: hot,
      days_warm: warm,
      days_cold: cold
    });
    setCalcResult(res);
  };

  const handleRecalculate = () => {
    runCalculator(calcCams, calcH264Pct, calcHotDays, calcWarmDays, calcColdDays);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 border border-amber-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-amber-500/30 text-amber-300 font-mono text-xs font-bold rounded-md border border-amber-500/40 uppercase">
              MODEL 4 TIERED STORAGE
            </span>
            <span className="text-xs text-slate-400 font-mono">HOT (NVME) · WARM (CEPH) · COLD (S3 WORM)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Distributed Tiered Storage & S3 Archive Architecture
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Multi-tier distributed object storage architecture powered by Ceph BlueStore and immutable AWS S3 Glacier WORM
            compliance. Includes real-time capacity monitoring and 80,000 camera retention sizing calculator.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-amber-300">
            TOTAL POOL: 16.45 PB
          </div>
        </div>
      </div>

      {/* Tier Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {storageData?.tiers.map(tier => {
          const isHot = tier.tier === 'HOT';
          const isWarm = tier.tier === 'WARM';
          return (
            <div
              key={tier.tier}
              className={`bg-white rounded-2xl p-6 border shadow-sm space-y-4 ${
                isHot ? 'border-red-200' : isWarm ? 'border-amber-200' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                      isHot ? 'bg-red-600' : isWarm ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                  >
                    {isHot ? <Flame className="w-5 h-5" /> : isWarm ? <Wind className="w-5 h-5" /> : <Snowflake className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{tier.tier} TIER</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{tier.retention_period}</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {tier.usage_pct}% Used
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHot ? 'bg-red-500' : isWarm ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${tier.usage_pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>Used: <b>{tier.used_capacity_tb} TB</b></span>
                  <span>Total: <b>{tier.total_capacity_tb} TB</b></span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Technology:</span>
                  <span className="text-slate-800 font-bold text-right truncate max-w-[160px]">{tier.technology}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chunk Count:</span>
                  <span className="text-slate-800 font-bold">{tier.chunk_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Encryption:</span>
                  <span className="text-emerald-700 font-bold">{tier.encryption}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Sizing Calculator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              Statewide Camera Retention & Capacity Sizing Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculate exact network throughput and multi-tier storage demands for custom deployment parameters
            </p>
          </div>

          <button
            onClick={handleRecalculate}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Recalculate
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Cameras:</span>
              <b className="text-amber-600 font-mono">{calcCams.toLocaleString()}</b>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={calcCams}
              onChange={e => {
                const val = Number(e.target.value);
                setCalcCams(val);
                runCalculator(val, calcH264Pct, calcHotDays, calcWarmDays, calcColdDays);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>H.264 vs H.265 Ratio:</span>
              <b className="text-amber-600 font-mono">{calcH264Pct}% H.264</b>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={calcH264Pct}
              onChange={e => {
                const val = Number(e.target.value);
                setCalcH264Pct(val);
                runCalculator(calcCams, val, calcHotDays, calcWarmDays, calcColdDays);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Hot Retention (NVMe):</span>
              <b className="text-red-600 font-mono">{calcHotDays} Days</b>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={calcHotDays}
              onChange={e => {
                const val = Number(e.target.value);
                setCalcHotDays(val);
                runCalculator(calcCams, calcH264Pct, val, calcWarmDays, calcColdDays);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Cold Retention (S3 WORM):</span>
              <b className="text-blue-600 font-mono">{calcColdDays} Days</b>
            </div>
            <input
              type="range"
              min="30"
              max="730"
              step="30"
              value={calcColdDays}
              onChange={e => {
                const val = Number(e.target.value);
                setCalcColdDays(val);
                runCalculator(calcCams, calcH264Pct, calcHotDays, calcWarmDays, val);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Sizing Output Cards */}
        {calcResult && (
          <div className="bg-slate-900 rounded-2xl p-5 text-white grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Ingest Bandwidth</span>
              <p className="text-lg font-black text-cyan-400 mt-1">{calcResult.bandwidth_gbps} Gbps</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Daily Ingest</span>
              <p className="text-lg font-black text-white mt-1">{calcResult.daily_ingest_tb} TB/day</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Hot Tier Pool</span>
              <p className="text-lg font-black text-red-400 mt-1">{calcResult.hot_tier_tb} TB</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Warm Tier Pool</span>
              <p className="text-lg font-black text-amber-400 mt-1">{calcResult.warm_tier_tb} TB</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Cold Archive</span>
              <p className="text-lg font-black text-blue-400 mt-1">{(calcResult.cold_tier_tb / 1024).toFixed(1)} PB</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Storage</span>
              <p className="text-lg font-black text-emerald-400 mt-1">{calcResult.total_storage_pb} PB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
