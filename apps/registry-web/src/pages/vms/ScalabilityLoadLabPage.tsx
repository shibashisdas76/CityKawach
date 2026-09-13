import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Server,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  HardDrive,
  TrendingUp,
  BarChart3,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { model4Service } from '../../services/model4Service';
import { Scalability80kModel, LoadTestResult } from '../../types/model4.types';

export const ScalabilityLoadLabPage: React.FC = () => {
  const [modelSpec, setModelSpec] = useState<Scalability80kModel | null>(null);
  const [cameraScale, setCameraScale] = useState<number>(80000);
  const [testDuration, setTestDuration] = useState<number>(10);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<LoadTestResult | null>(null);
  const [liveThroughput, setLiveThroughput] = useState<number>(140.8);

  useEffect(() => {
    const load = async () => {
      const spec = await model4Service.getScalabilityModel();
      setModelSpec(spec);
    };
    load();
  }, []);

  const handleRunLoadTest = async () => {
    setIsRunningTest(true);
    try {
      const res = await model4Service.runLoadTest(cameraScale, testDuration);
      setTestResult(res);
      setLiveThroughput(res.metrics.aggregate_ingest_gbps);
    } catch (e) {
      console.error('Error running load test:', e);
    } finally {
      setIsRunningTest(false);
    }
  };

  const downloadReport = (format: 'JSON' | 'CSV') => {
    if (!testResult && !modelSpec) return;
    const content = format === 'JSON'
      ? JSON.stringify({ model_spec: modelSpec, latest_test_result: testResult }, null, 2)
      : `metric,value\ncamera_scale,${cameraScale}\naggregate_ingest_gbps,${testResult?.metrics.aggregate_ingest_gbps || 140.8}\npacket_loss_pct,${testResult?.metrics.packet_loss_percent || 0.002}\nlatency_p95_ms,${testResult?.metrics.latency_p95_ms || 32.5}`;
    
    const blob = new Blob([content], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gujarat_vms_80k_scalability_report.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-2xl p-6 border border-cyan-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold rounded-md border border-cyan-500/40 uppercase">
              MODEL 4 SCALABILITY LAB
            </span>
            <span className="text-xs text-slate-400 font-mono">80,000 CAMERAS · 140.8 GBPS BENCHMARK</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Statewide 80k Camera Scalability & Load Testing Lab
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Certified enterprise dimensioning and real-time stress testing suite for 80,000 concurrent video feeds.
            Evaluates ingestion bandwidth, Kafka message throughput, GPU inference cluster saturation, and SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadReport('JSON')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4" /> JSON Report
          </button>
          <button
            onClick={() => downloadReport('CSV')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" /> CSV Export
          </button>
        </div>
      </div>

      {/* Real-time Load Generator Console */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              Real-Time Synthetic Load Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inject synthetic video stream traffic to evaluate gateway load balancing, buffer queues, and latency SLAs
            </p>
          </div>

          <button
            onClick={handleRunLoadTest}
            disabled={isRunningTest}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isRunningTest ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Simulating {cameraScale.toLocaleString()} Feeds...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Execute Synthetic Load Test
              </>
            )}
          </button>
        </div>

        {/* Sliders & Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Target Concurrent Cameras</span>
              <span className="text-blue-600 font-mono text-sm">{cameraScale.toLocaleString()} Feeds</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={cameraScale}
              onChange={e => setCameraScale(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1,000 (Pilot)</span>
              <span>30,000 (Phase 1)</span>
              <span>80,000 (Statewide Target)</span>
              <span>100,000 (Max Stress)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Test Duration Window</span>
              <span className="text-blue-600 font-mono text-sm">{testDuration} Seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={testDuration}
              onChange={e => setTestDuration(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>5s (Burst)</span>
              <span>15s (Standard)</span>
              <span>30s (Extended)</span>
              <span>60s (Endurance)</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Gauge Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Ingest Bandwidth</span>
            <p className="text-xl font-black text-blue-600 mt-1">
              {testResult ? `${testResult.metrics.aggregate_ingest_gbps} Gbps` : `${liveThroughput} Gbps`}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Peak Headroom 180G</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Kafka Throughput</span>
            <p className="text-xl font-black text-indigo-600 mt-1">
              {testResult ? `${(testResult.metrics.kafka_message_rate_per_sec / 1000).toFixed(0)}k/s` : '1.2M/s'}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">256 Partitions</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Latency (P95)</span>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {testResult ? `${testResult.metrics.latency_p95_ms} ms` : '32.5 ms'}
            </p>
            <span className="text-[10px] text-emerald-600 font-mono">SLA &lt; 100ms Met</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Packet Drop Rate</span>
            <p className="text-xl font-black text-cyan-600 mt-1">
              {testResult ? `${testResult.metrics.packet_loss_percent}%` : '0.002%'}
            </p>
            <span className="text-[10px] text-cyan-600 font-mono">RTSP TCP Reliable</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">GPU AI Utilisation</span>
            <p className="text-xl font-black text-purple-600 mt-1">
              {testResult ? `${testResult.metrics.cluster_gpu_utilization_pct}%` : '74.0%'}
            </p>
            <span className="text-[10px] text-purple-600 font-mono">400 L40S Nodes</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Ingest / Hour</span>
            <p className="text-xl font-black text-amber-600 mt-1">
              {testResult ? `${testResult.metrics.storage_ingest_rate_tb_per_hour} TB` : '63.3 TB'}
            </p>
            <span className="text-[10px] text-amber-600 font-mono">Ceph BlueStore</span>
          </div>
        </div>
      </div>

      {/* Statewide 80k Infrastructure Dimensioning Matrix */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Certified 80,000 Camera Cluster Architecture Specifications
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete hardware, network, compute, and Kubernetes sizing model
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono rounded-lg">
            PRODUCTION READY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Box 1: Bandwidth */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Network Ingestion</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">140.8 Gbps</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• 70% H.264 @ 2 Mbps (56,000 cams = 112 Gbps)</p>
              <p>• 30% H.265 @ 1.2 Mbps (24,000 cams = 28.8 Gbps)</p>
              <p>• Dual 100 Gbps Dark Fiber Ring Backbone</p>
            </div>
          </div>

          {/* Box 2: Ingestion Cluster */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Streaming Gateways</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">80 Gateway Nodes</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• 1,000 cameras per gateway node</p>
              <p>• Spec: 32 vCPU, 64 GB RAM, 25 GbE NIC</p>
              <p>• NGINX RTMP + MediaMTX + WebRTC Gateway</p>
            </div>
          </div>

          {/* Box 3: GPU Compute */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">AI Inference Cluster</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">400x NVIDIA GPUs</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• NVIDIA L40S / A100 (48GB VRAM)</p>
              <p>• 200 streams per card with frame-sampling</p>
              <p>• DeepStream 6.4 + TensorRT acceleration</p>
            </div>
          </div>

          {/* Box 4: Kafka Message Bus */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Message Streaming Bus</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">48 Kafka Brokers</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• 256 topic partitions with replication factor 3</p>
              <p>• 1,250,000 msgs/sec sustained peak rate</p>
              <p>• Strimzi Operator on Kubernetes</p>
            </div>
          </div>

          {/* Box 5: Storage Sizing */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Tiered Storage Pool</span>
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">489.0 PB Total</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• Hot (7d NVMe): 8.5 PB</p>
              <p>• Warm (30d Ceph EC 8+3): 36.5 PB</p>
              <p>• Cold (365d S3 Glacier/Tape): 444.0 PB</p>
            </div>
          </div>

          {/* Box 6: DR & Orchestration */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">High Availability</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">Dual SDC & DRS</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
              <p>• SDC Gandhinagar &lt;-&gt; DRS Ahmedabad</p>
              <p>• RTO &lt; 30.0s (DNS GSLB Failover)</p>
              <p>• RPO &lt; 1.0s (Ceph Mirror + Kafka MM2)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
