import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders,
  Code2,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  PlusCircle,
  FileCode,
  Layers,
  Server,
  Terminal,
  Cpu,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { federationService } from '../../services/federationService';
import { VmsPlatform, VmsPluginSpec, VmsComplianceTestReport } from '../../types/federation.types';

export const ConnectorFrameworkPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const autoTestVms = searchParams.get('test');

  const [platforms, setPlatforms] = useState<VmsPlatform[]>([]);
  const [pluginSpecs, setPluginSpecs] = useState<VmsPluginSpec | null>(null);
  const [selectedVmsForTest, setSelectedVmsForTest] = useState<string>('vms-traffic-hikcentral');
  const [testReport, setTestReport] = useState<VmsComplianceTestReport | null>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'SANDBOX' | 'ONBOARD' | 'SDK_DOCS'>('SANDBOX');
  const [copiedCode, setCopiedCode] = useState(false);

  // Onboard form state
  const [newVms, setNewVms] = useState({
    id: 'vms-custom-axis',
    name: 'State Border Security VMS (Axis)',
    vendor: 'ONVIF_GENERIC',
    vendorName: 'Axis Camera Station Pro',
    departmentId: 'dept-border-police',
    departmentName: 'Border & Coastal Security Force',
    district: 'Kutch & Banaskantha',
    protocol: 'Axis VAPIX REST + ONVIF Profile S',
    apiBaseUrl: 'https://border-vms.gujarat.gov.in/vapix',
    capabilities: {
      ptzControl: true,
      liveStreaming: true,
      playbackStreaming: true,
      edgeAnalyticsPassthrough: true,
      alarmTriggering: true,
      twoWayAudio: false,
      bookmarking: true
    },
    colorTheme: '#0284C7'
  });
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(null);

  // Schema validator state
  const [schemaInput, setSchemaInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string; errors?: string[] } | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [plats, specs] = await Promise.all([
        federationService.getPlatforms(),
        federationService.getPluginSpecs()
      ]);
      setPlatforms(plats);
      setPluginSpecs(specs);
      setSchemaInput(JSON.stringify(specs.samplePluginConfig, null, 2));

      if (autoTestVms) {
        setSelectedVmsForTest(autoTestVms);
        runTest(autoTestVms);
      } else if (plats.length > 0) {
        setSelectedVmsForTest(plats[0].id);
      }
    };
    load();
  }, [autoTestVms]);

  const runTest = async (vmsId: string) => {
    setRunningTest(true);
    setTestReport(null);
    const report = await federationService.runComplianceTest(vmsId);
    setTestReport(report);
    setRunningTest(false);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await federationService.onboardPlatform(newVms);
    if (res.success) {
      setOnboardingSuccess(res.message);
      const updated = await federationService.getPlatforms();
      setPlatforms(updated);
      setSelectedVmsForTest(newVms.id);
      setTimeout(() => setOnboardingSuccess(null), 4000);
    }
  };

  const handleValidateSchema = async () => {
    setValidating(true);
    try {
      const parsed = JSON.parse(schemaInput);
      const res = await federationService.validatePluginJson(parsed);
      setValidationResult(res);
    } catch (e: any) {
      setValidationResult({ valid: false, errors: [`JSON Parse Error: ${e.message}`] });
    }
    setValidating(false);
  };

  const handleCopySampleCode = () => {
    if (pluginSpecs) {
      navigator.clipboard.writeText(JSON.stringify(pluginSpecs.samplePluginConfig, null, 2));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            VMS CONNECTOR & PLUGIN FRAMEWORK
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Extensible Connector SDK & Sandbox
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Pluggable adapter interface, automated compliance test suite, and JSON schema validator for onboarding future departmental CCTV and VMS systems.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 shrink-0">
          {(['SANDBOX', 'ONBOARD', 'SDK_DOCS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'SANDBOX' ? 'Compliance Test Runner' : tab === 'ONBOARD' ? 'Onboarding Wizard' : 'SDK Specifications'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs Content */}
      {activeTab === 'SANDBOX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Runner Controls */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-black text-white">Select VMS Platform to Test</h2>
              <p className="text-xs text-slate-400 mt-1">Execute live 5-point handshake and telemetry verification</p>
            </div>

            <div className="space-y-2">
              {platforms.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedVmsForTest(p.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                    selectedVmsForTest === p.id
                      ? 'bg-purple-950/40 border-purple-500 text-white ring-2 ring-purple-500/20'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.vendor}</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {p.latencyMs}ms
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => runTest(selectedVmsForTest)}
              disabled={runningTest}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-lg transition"
            >
              {runningTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              {runningTest ? 'Executing Handshake Test Suite…' : 'Run Full Compliance Test Suite'}
            </button>
          </div>

          {/* Test Report Display */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Compliance & Handshake Report</h2>
                <p className="text-xs text-slate-400 mt-0.5">Verification results for authentication, catalogue sync, stream relay, alarms, and PTZ</p>
              </div>

              {testReport && (
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  ✓ {testReport.overallCompliance} COMPLIANT
                </span>
              )}
            </div>

            {testReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">TESTED TARGET</span>
                    <p className="font-bold text-white mt-0.5">{testReport.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">ROUNDTRIP LATENCY</span>
                    <p className="font-black text-cyan-300 mt-0.5 font-mono">{testReport.latencyMs} ms</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">TIME COMPLETED</span>
                    <p className="font-mono text-slate-300 mt-0.5">{new Date(testReport.testedAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Test Steps */}
                <div className="space-y-2.5">
                  {testReport.steps.map((s, idx) => (
                    <div
                      key={s.step}
                      className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <div>
                          <p className="font-bold text-white">{idx + 1}. {s.step}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.details}</p>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] font-bold text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 shrink-0">
                        {s.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
                <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No test suite executed yet</p>
                <p className="text-xs text-slate-500 mt-1">Select a VMS platform from the left column and click "Run Full Compliance Test Suite".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ONBOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Onboarding Form */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-black text-white">VMS Platform Registration Wizard</h2>
              <p className="text-xs text-slate-400 mt-1">Onboard a new departmental VMS endpoint into the Model 3 federation bus</p>
            </div>

            {onboardingSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {onboardingSuccess}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Unique Identifier</label>
                  <input
                    type="text"
                    required
                    value={newVms.id}
                    onChange={e => setNewVms({ ...newVms, id: e.target.value })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Vendor Standard</label>
                  <select
                    value={newVms.vendor}
                    onChange={e => setNewVms({ ...newVms, vendor: e.target.value as any })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700"
                  >
                    <option value="ONVIF_GENERIC">Generic ONVIF Profile S/G/T</option>
                    <option value="MILESTONE_XPROTECT">Milestone XProtect</option>
                    <option value="GENETEC_SECURITY_CENTER">Genetec Security Center</option>
                    <option value="HIKVISION_HIKCENTRAL">Hikvision HikCentral</option>
                    <option value="DAHUA_DSS">Dahua DSS Pro</option>
                    <option value="HANWHA_WAVE">Hanwha WAVE (Nx Witness)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={newVms.name}
                  onChange={e => setNewVms({ ...newVms, name: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newVms.departmentName}
                    onChange={e => setNewVms({ ...newVms, departmentName: e.target.value })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">District / Jurisdiction</label>
                  <input
                    type="text"
                    required
                    value={newVms.district}
                    onChange={e => setNewVms({ ...newVms, district: e.target.value })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">API Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={newVms.apiBaseUrl}
                  onChange={e => setNewVms({ ...newVms, apiBaseUrl: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Register & Initialize VMS Adapter
                </button>
              </div>
            </form>
          </div>

          {/* Live Schema Validator */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">JSON Plugin Schema Validator</h2>
                <p className="text-xs text-slate-400 mt-0.5">Test third-party VMS plugin configuration manifests</p>
              </div>

              <button
                onClick={handleCopySampleCode}
                className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 font-mono"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Sample'}
              </button>
            </div>

            <textarea
              rows={12}
              value={schemaInput}
              onChange={e => setSchemaInput(e.target.value)}
              className="w-full bg-slate-950 text-cyan-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:border-cyan-400"
            />

            <button
              onClick={handleValidateSchema}
              disabled={validating}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition"
            >
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5 text-cyan-400" />}
              Validate Against Model 3 SDK Contract
            </button>

            {validationResult && (
              <div className={`p-4 rounded-xl border text-xs ${
                validationResult.valid
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                {validationResult.valid ? (
                  <p className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {validationResult.message}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" /> Validation Failed:
                    </p>
                    {validationResult.errors?.map(err => (
                      <p key={err} className="text-[11px] font-mono pl-6">• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SDK_DOCS' && pluginSpecs && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 text-white">
          <div className="pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/20 px-2.5 py-1 rounded-md border border-cyan-500/30">
              SDK v{pluginSpecs.frameworkVersion}
            </span>
            <h2 className="text-lg font-black text-white mt-2">Model 3 Adapter Architecture & SDK Guide</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Standardized connector interface allowing system integrators and third-party vendors to publish cameras, telemetry, and alarms into the Gujarat state federation bus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-cyan-300 uppercase tracking-wider font-mono">Supported Protocol Standards</h3>
              <div className="space-y-2">
                {pluginSpecs.standardProtocols.map(proto => (
                  <div key={proto} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 font-mono text-slate-200">
                    • {proto}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-amber-300 uppercase tracking-wider font-mono">Lifecycle Hooks</h3>
              <div className="space-y-2">
                {pluginSpecs.lifecycleHooks.map(hook => (
                  <div key={hook} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 font-mono text-amber-200">
                    <code>{hook}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
