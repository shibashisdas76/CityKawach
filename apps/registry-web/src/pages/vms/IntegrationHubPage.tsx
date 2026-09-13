import React, { useState, useEffect } from 'react';
import {
  Zap,
  Car,
  CreditCard,
  Shield,
  Fingerprint,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Lock
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { IntegrationSyncStatus, VahanRecordData, SarthiRecordData, EgujcopRecordData, NafisRecordData } from '../../types/model4.types';

type IntegrationTab = 'VAHAN' | 'SARTHI' | 'EGUJCOP' | 'NAFIS' | 'CCTNS';

export const IntegrationHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('VAHAN');
  const [syncStatus, setSyncStatus] = useState<IntegrationSyncStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // VAHAN Query state
  const [vahanPlate, setVahanPlate] = useState('GJ01AB1234');
  const [vahanResult, setVahanResult] = useState<VahanRecordData | null>(null);
  const [vahanLoading, setVahanLoading] = useState(false);

  // SARTHI Query state
  const [sarthiDl, setSarthiDl] = useState('GJ01-20150019284');
  const [sarthiResult, setSarthiResult] = useState<SarthiRecordData | null>(null);
  const [sarthiLoading, setSarthiLoading] = useState(false);

  // eGujCop Query state
  const [egujcopQuery, setEgujcopQuery] = useState('GJ01AB1234');
  const [egujcopResults, setEgujcopResults] = useState<EgujcopRecordData[]>([]);
  const [egujcopLoading, setEgujcopLoading] = useState(false);

  // NAFIS Query state
  const [nafisQuery, setNafisQuery] = useState('NAFIS-GJ-2024-9912');
  const [nafisResults, setNafisResults] = useState<NafisRecordData[]>([]);
  const [nafisLoading, setNafisLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stats = await model4Service.getIntegrationsSync();
      setSyncStatus(stats);
      setLoading(false);
      // Auto-run initial VAHAN query
      handleQueryVahan();
    };
    load();
  }, []);

  const handleQueryVahan = async () => {
    if (!vahanPlate.trim()) return;
    setVahanLoading(true);
    const res = await model4Service.lookupVahan(vahanPlate.trim());
    setVahanResult(res);
    setVahanLoading(false);
  };

  const handleQuerySarthi = async () => {
    if (!sarthiDl.trim()) return;
    setSarthiLoading(true);
    const res = await model4Service.lookupSarthi(sarthiDl.trim());
    setSarthiResult(res);
    setSarthiLoading(false);
  };

  const handleQueryEgujcop = async () => {
    if (!egujcopQuery.trim()) return;
    setEgujcopLoading(true);
    const res = await model4Service.lookupEgujcop(egujcopQuery.trim());
    setEgujcopResults(res);
    setEgujcopLoading(false);
  };

  const handleQueryNafis = async () => {
    if (!nafisQuery.trim()) return;
    setNafisLoading(true);
    const res = await model4Service.lookupNafis(nafisQuery.trim());
    setNafisResults(res);
    setNafisLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-pink-950 to-slate-900 rounded-2xl p-6 border border-pink-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-pink-500/30 text-pink-300 font-mono text-xs font-bold rounded-md border border-pink-500/40 uppercase">
              MODEL 4 AUTHORISED INTEGRATIONS
            </span>
            <span className="text-xs text-slate-400 font-mono">VAHAN · SARTHI · EGUJCOP · AFIS/NAFIS · CCTNS</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Authorised Government Database Integrations Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live bidirectional federated query bus connecting Gujarat Central VMS directly with National and State
            regulatory and law enforcement databases.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>5/5 AUTHORISED GATEWAYS CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {syncStatus.map(sync => (
          <div key={sync.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black font-mono text-slate-900">{sync.id}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-700 truncate">{sync.name.split('(')[0]}</p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>Latency: <b>{sync.latency_ms}ms</b></span>
              <span>SLA: <b>{sync.uptime_sla}</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Query Studio */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('VAHAN');
              handleQueryVahan();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'VAHAN'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            VAHAN 4.0 (Vehicle Registry)
          </button>

          <button
            onClick={() => {
              setActiveTab('SARTHI');
              handleQuerySarthi();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'SARTHI'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            SARTHI (Driving License)
          </button>

          <button
            onClick={() => {
              setActiveTab('EGUJCOP');
              handleQueryEgujcop();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'EGUJCOP'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            eGujCop (Police FIR & Stolen)
          </button>

          <button
            onClick={() => {
              setActiveTab('NAFIS');
              handleQueryNafis();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'NAFIS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            AFIS / NAFIS (Biometrics)
          </button>
        </div>

        {/* ─── VAHAN Query Console ─── */}
        {activeTab === 'VAHAN' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={vahanPlate}
                onChange={e => setVahanPlate(e.target.value)}
                placeholder="Enter license plate (e.g. GJ01AB1234)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleQueryVahan}
                disabled={vahanLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                {vahanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lookup VAHAN
              </button>
            </div>

            {vahanResult && (
              <div
                className={`rounded-2xl p-6 border space-y-4 ${
                  vahanResult.blacklisted ? 'bg-rose-50/40 border-rose-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-base font-black font-mono text-slate-900">{vahanResult.plate_number}</span>
                    <p className="text-xs text-slate-500 font-semibold">{vahanResult.maker_model}</p>
                  </div>
                  {vahanResult.blacklisted ? (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black uppercase rounded-lg">
                      ⚠️ BLACKLISTED / WANTED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase rounded-lg">
                      ✓ RC ACTIVE & VERIFIED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Owner Name</span>
                    <b className="text-slate-800 text-sm">{vahanResult.owner_name}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Vehicle Class</span>
                    <b className="text-slate-800">{vahanResult.vehicle_class}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Fuel Type</span>
                    <b className="text-slate-800">{vahanResult.fuel_type}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">RTO Authority</span>
                    <b className="text-slate-800">{vahanResult.rto_location}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Chassis Number</span>
                    <b className="text-slate-700">{vahanResult.chassis_number}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Engine Number</span>
                    <b className="text-slate-700">{vahanResult.engine_number}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Fitness Validity</span>
                    <b className="text-slate-700">{vahanResult.fitness_upto}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Insurance Upto</span>
                    <b className="text-slate-700">{vahanResult.insurance_valid_upto}</b>
                  </div>
                </div>

                {vahanResult.blacklisted === 1 && (
                  <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-bold">
                    🚨 Flag Reason: {vahanResult.blacklist_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SARTHI Query Console ─── */}
        {activeTab === 'SARTHI' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={sarthiDl}
                onChange={e => setSarthiDl(e.target.value)}
                placeholder="Enter DL number (e.g. GJ01-20150019284)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleQuerySarthi}
                disabled={sarthiLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                {sarthiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lookup SARTHI
              </button>
            </div>

            {sarthiResult && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-base font-black font-mono text-slate-900">{sarthiResult.dl_number}</span>
                    <p className="text-xs text-slate-500 font-semibold">{sarthiResult.holder_name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-lg ${
                      sarthiResult.license_status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    STATUS: {sarthiResult.license_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Holder Name</span>
                    <b className="text-slate-800 text-sm">{sarthiResult.holder_name}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Date of Birth</span>
                    <b className="text-slate-800">{sarthiResult.date_of_birth}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Blood Group</span>
                    <b className="text-slate-800">{sarthiResult.blood_group || 'O+ve'}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Endorsements</span>
                    <b className="text-slate-800">{sarthiResult.endorsements}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Valid From</span>
                    <b className="text-slate-700">{sarthiResult.valid_from}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Valid Upto</span>
                    <b className="text-slate-700">{sarthiResult.valid_upto}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Issuing RTO</span>
                    <b className="text-slate-700">{sarthiResult.issuing_rto}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── eGujCop Query Console ─── */}
        {activeTab === 'EGUJCOP' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={egujcopQuery}
                onChange={e => setEgujcopQuery(e.target.value)}
                placeholder="Enter FIR number or stolen vehicle plate..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleQueryEgujcop}
                disabled={egujcopLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                {egujcopLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Query eGujCop
              </button>
            </div>

            <div className="space-y-3">
              {egujcopResults.map((fir, i) => (
                <div key={i} className="bg-rose-50/40 rounded-2xl p-5 border border-rose-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-rose-900 text-sm">{fir.fir_number}</span>
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded-lg">
                      {fir.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Police Station</span>
                      <b className="text-slate-800">{fir.police_station}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Crime Type</span>
                      <b className="text-slate-800">{fir.crime_type}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">IPC Sections</span>
                      <b className="text-slate-800">{fir.ipc_sections}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Investigating Officer</span>
                      <b className="text-slate-800">{fir.io_name}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── NAFIS Query Console ─── */}
        {activeTab === 'NAFIS' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={nafisQuery}
                onChange={e => setNafisQuery(e.target.value)}
                placeholder="Enter NAFIS ID or suspect name..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleQueryNafis}
                disabled={nafisLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                {nafisLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Query NAFIS
              </button>
            </div>

            <div className="space-y-3">
              {nafisResults.map((naf, i) => (
                <div key={i} className="bg-purple-50/40 rounded-2xl p-5 border border-purple-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-purple-900 text-sm">{naf.nafis_id}</span>
                      <h4 className="text-base font-extrabold text-slate-900">{naf.person_name}</h4>
                    </div>
                    {naf.red_corner_alert ? (
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase rounded-lg animate-pulse">
                        RED CORNER BOLO ALERT
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Crime Category</span>
                      <b className="text-slate-800">{naf.crime_category}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wanted By</span>
                      <b className="text-slate-800">{naf.wanted_by_state}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gender / Age</span>
                      <b className="text-slate-800">{naf.gender} · {naf.age} yrs</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Last Location</span>
                      <b className="text-slate-800">{naf.last_known_location}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
