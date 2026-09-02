import React, { useState } from 'react';
import { vmsService } from '../../services/vmsService';
import { IntegrationStatusCard } from '../../components/vms/IntegrationStatusCard';
import { IntegrationEndpoint } from '../../types/camera.types';
import { Loader2, Search, Fingerprint, Car, CheckCircle2, XCircle } from 'lucide-react';

export const IntegrationHubPage: React.FC = () => {
  const [integrations] = useState(vmsService.getIntegrations());
  const [activeTab, setActiveTab] = useState<'VAHAN' | 'AFIS'>('VAHAN');
  const [plateLookup, setPlateLookup] = useState('');
  const [vahanResult, setVahanResult] = useState<any>(null);
  const [vahanLoading, setVahanLoading] = useState(false);
  const [faceDesc, setFaceDesc] = useState('');
  const [faceResult, setFaceResult] = useState<{ name: string; id: string; status: string } | null | undefined>(undefined);
  const [faceLoading, setFaceLoading] = useState(false);

  const handleVahan = async () => {
    if (!plateLookup.trim()) return;
    setVahanLoading(true);
    setVahanResult(null);
    const r = await vmsService.lookupVahan(plateLookup.trim().toUpperCase());
    setVahanResult(r);
    setVahanLoading(false);
  };

  const handleFace = async () => {
    if (!faceDesc.trim()) return;
    setFaceLoading(true);
    setFaceResult(undefined);
    const r = await vmsService.lookupFace(faceDesc.trim());
    setFaceResult(r);
    setFaceLoading(false);
  };

  const connected = integrations.filter(i => i.status === 'CONNECTED').length;
  const degraded = integrations.filter(i => i.status === 'DEGRADED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-950 to-rose-950 rounded-2xl p-6 border border-pink-700/40">
        <h2 className="text-lg font-black text-white">Integration Hub</h2>
        <p className="text-xs text-pink-300 mt-1">
          Real-time connectivity status for all external government database integrations
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2">
            <p className="text-xl font-black text-emerald-300">{connected}</p>
            <p className="text-[10px] text-emerald-400">Connected</p>
          </div>
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2">
            <p className="text-xl font-black text-amber-300">{degraded}</p>
            <p className="text-[10px] text-amber-400">Degraded</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2">
            <p className="text-xl font-black text-white">{integrations.length}</p>
            <p className="text-[10px] text-pink-300">Total Systems</p>
          </div>
        </div>
      </div>

      {/* Integration cards grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map(ep => (
            <IntegrationStatusCard key={ep.id} endpoint={ep} />
          ))}
        </div>
      </div>

      {/* Live Query Console */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Live Query Console</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VAHAN Lookup */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">VAHAN 4.0 Lookup</p>
                <p className="text-[10px] text-slate-400">Vehicle registration & owner details</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={plateLookup}
                onChange={e => setPlateLookup(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVahan()}
                placeholder="Enter plate e.g. GJ-01-AB-1234"
                className="flex-1 bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-600 focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
              <button
                onClick={handleVahan}
                disabled={vahanLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {vahanLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Query
              </button>
            </div>
            {vahanResult && (
              <div className={`rounded-xl border p-4 space-y-2 text-xs ${vahanResult.blacklisted ? 'bg-rose-950/40 border-rose-500/40' : 'bg-slate-800/60 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-white font-mono">{vahanResult.plate}</p>
                  {vahanResult.blacklisted && (
                    <span className="text-[10px] font-bold bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full">⚠ BLACKLISTED</span>
                  )}
                </div>
                {[
                  ['Owner', vahanResult.ownerName],
                  ['Vehicle Class', vahanResult.vehicleClass],
                  ['Fuel Type', vahanResult.fuelType],
                  ['Registration Date', vahanResult.registrationDate],
                  ['Insurance', vahanResult.insuranceValid ? '✓ Valid' : '✗ Expired'],
                  ['Fitness Certificate', vahanResult.fitnessValid ? '✓ Valid' : '✗ Expired'],
                  ['Pending Challans', `${vahanResult.challanCount}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${label === 'Insurance' && !vahanResult.insuranceValid ? 'text-rose-400' : 'text-slate-200'}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AFIS/NAFIS Face Query */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AFIS / NAFIS Query</p>
                <p className="text-[10px] text-slate-400">Biometric facial / fingerprint identification</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={faceDesc}
                onChange={e => setFaceDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFace()}
                placeholder="Subject description or ID…"
                className="flex-1 bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-600 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleFace}
                disabled={faceLoading}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {faceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </button>
            </div>
            {faceResult !== undefined && (
              <div className={`rounded-xl border p-4 ${faceResult === null ? 'bg-slate-800/60 border-slate-700' : faceResult.status === 'WANTED' ? 'bg-rose-950/40 border-rose-500/40' : 'bg-emerald-950/40 border-emerald-500/40'}`}>
                {faceResult === null ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <XCircle className="w-4 h-4" /> No biometric match found in AFIS/NAFIS database
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-white">{faceResult.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${faceResult.status === 'WANTED' ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {faceResult.status}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-1">
                      <span className="text-slate-400">Record ID</span>
                      <span className="font-mono text-slate-200">{faceResult.id}</span>
                    </div>
                    {faceResult.status === 'WANTED' && (
                      <div className="flex items-start gap-2 bg-rose-900/30 rounded-lg p-2 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-rose-300">Alert issued — coordinate with field units and eGujCop immediately</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sample queries */}
            <div className="mt-4">
              <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">Try a sample query:</p>
              <div className="flex gap-2 flex-wrap">
                {['Suspect near Nehru Bridge', 'Male 25-30 blue shirt', 'Face match from cam 6'].map(q => (
                  <button
                    key={q}
                    onClick={() => setFaceDesc(q)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-1 rounded-lg transition-colors border border-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration architecture note */}
      <div className="bg-blue-950/30 border border-blue-700/40 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-blue-300 mb-2">Integration Architecture</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { title: 'Protocol', value: 'REST + GraphQL over mTLS' },
            { title: 'Auth', value: 'OAuth 2.0 + API Key rotation' },
            { title: 'SLA', value: '99.9% uptime per integration' },
            { title: 'Audit', value: 'Every query logged to immutable ledger' },
          ].map(item => (
            <div key={item.title} className="bg-slate-900/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-medium">{item.title}</p>
              <p className="text-slate-200 font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
