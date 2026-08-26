import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, Volume2, VolumeX, CheckCircle, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { CriticalAlert } from '../../types/camera.types';
import { Link } from 'react-router-dom';

export const SurveillanceAlertTab: React.FC = () => {
    const [alerts, setAlerts] = useState<CriticalAlert[]>(apiService.getActiveAlerts());
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioContextReady = useRef(false);

    useEffect(() => {
        const unsubscribe = apiService.subscribe(() => {
            setAlerts(apiService.getActiveAlerts());
        });
        return () => unsubscribe();
    }, []);

    // Voice Synthesis Helper
    const triggerVoiceAlert = (cameraName: string, alertType: string) => {
        if (!audioContextReady.current || !window.speechSynthesis) return;

        const readableType = alertType.replace(/_/g, ' ').toLowerCase();
        const utterance = new SpeechSynthesisUtterance(
            `Attention. ${readableType} detected at ${cameraName}.`
        );
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    const handleEnableAudio = () => {
        setAudioEnabled(true);
        audioContextReady.current = true;

        if (window.speechSynthesis) {
            const silentUtterance = new SpeechSynthesisUtterance("Surveillance AI voice alerts initialized.");
            silentUtterance.volume = 0.8;
            window.speechSynthesis.speak(silentUtterance);
        }
    };

    const handleSimulateAiEvent = (type: CriticalAlert['alert_type']) => {
        const cameras = apiService.getCameras();
        const randomCam = cameras[Math.floor(Math.random() * cameras.length)];

        let details = 'Confidence score: 0.92';
        let severity: CriticalAlert['severity'] = 'HIGH';

        if (type === 'ANPR_WATCHLIST_MATCH') {
            details = `Matched Plate: GJ-${Math.floor(Math.random() * 89 + 10)}-XY-${Math.floor(Math.random() * 8999 + 1000)}`;
            severity = 'CRITICAL';
        } else if (type === 'CROWD_SURGE_DETECTED') {
            details = `Estimated Crowd: ${Math.floor(Math.random() * 15 + 8)} people/m²`;
            severity = 'HIGH';
        } else if (type === 'UNAUTHORIZED_INTRUSION') {
            details = 'Perimeter Zone 3 Tripwire Breach';
            severity = 'HIGH';
        } else if (type === 'FIRE_SMOKE_HAZARD') {
            details = 'Thermal Spike: 78°C detected';
            severity = 'CRITICAL';
        }

        const created = apiService.triggerAiAlert({
            camera_id: randomCam.camera_id,
            camera_name: randomCam.camera_name,
            alert_type: type,
            severity,
            confidence_score: 0.95,
            bounding_box_details: details
        });

        if (audioEnabled) {
            triggerVoiceAlert(created.camera_name, created.alert_type);
        }
    };

    const markResolved = (id: string) => {
        apiService.acknowledgeAlert(id);
    };

    return (
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-700 min-h-[480px] shadow-lg space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center text-rose-500">
                        <AlertOctagon className="w-5 h-5 mr-2 animate-pulse" />
                        AI Computer Vision Real-Time Detection Feed
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Live streaming events ingested from AI/ML analytics pipeline
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleEnableAudio}
                        className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${audioEnabled
                                ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-500/50'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                    >
                        {audioEnabled ? <Volume2 className="w-3.5 h-3.5 mr-1.5" /> : <VolumeX className="w-3.5 h-3.5 mr-1.5" />}
                        {audioEnabled ? 'Voice Alerts Active' : 'Enable Voice Alerts'}
                    </button>
                </div>
            </div>

            {/* AI Simulator Action Bar */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 font-bold">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <span>Pipeline Tester: Simulate Computer Vision Ingestion Event</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        onClick={() => handleSimulateAiEvent('ANPR_WATCHLIST_MATCH')}
                        className="px-3 py-1.5 rounded bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 text-xs font-mono font-medium border border-blue-700/50 flex items-center space-x-1 transition"
                    >
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span>ANPR Plate Match</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('CROWD_SURGE_DETECTED')}
                        className="px-3 py-1.5 rounded bg-amber-900/50 hover:bg-amber-800/60 text-amber-300 text-xs font-mono font-medium border border-amber-700/50 flex items-center space-x-1 transition"
                    >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Crowd Density Surge</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('UNAUTHORIZED_INTRUSION')}
                        className="px-3 py-1.5 rounded bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 text-xs font-mono font-medium border border-indigo-700/50 flex items-center space-x-1 transition"
                    >
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span>Intrusion Tripwire</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('FIRE_SMOKE_HAZARD')}
                        className="px-3 py-1.5 rounded bg-rose-900/50 hover:bg-rose-800/60 text-rose-300 text-xs font-mono font-medium border border-rose-700/50 flex items-center space-x-1 transition"
                    >
                        <Zap className="w-3 h-3 text-rose-400" />
                        <span>Thermal Fire Anomaly</span>
                    </button>
                </div>
            </div>

            {/* Alert Cards Container */}
            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p className="text-xs font-medium">No critical events detected. All surveillance sectors operational.</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition shadow-md ${alert.severity === 'CRITICAL'
                                    ? 'bg-rose-950/40 border-rose-800/60 text-slate-100'
                                    : 'bg-amber-950/30 border-amber-800/50 text-slate-100'
                                }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${alert.severity === 'CRITICAL'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-amber-600 text-white'
                                            }`}
                                    >
                                        {alert.alert_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                <p className="text-sm font-bold text-slate-100">{alert.camera_name}</p>
                                <p className="text-xs font-mono text-slate-300 flex items-center space-x-2">
                                    <span>ID: {alert.camera_id}</span>
                                    {alert.bounding_box_details && (
                                        <span className="text-emerald-400 font-semibold">• {alert.bounding_box_details}</span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-auto">
                                <Link
                                    to={`/cameras/${alert.camera_id}`}
                                    className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition"
                                >
                                    Inspect Stream
                                </Link>
                                <button
                                    onClick={() => markResolved(alert.id)}
                                    className="bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 px-3 py-1.5 rounded text-xs font-semibold border border-emerald-600/50 transition flex items-center space-x-1"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Acknowledge</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};