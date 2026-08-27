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
        <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-lg font-bold flex items-center text-rose-600 tracking-tight">
                        <AlertOctagon className="w-5 h-5 mr-2 animate-pulse text-rose-500" />
                        AI Computer Vision Real-Time Detection Feed
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Live streaming events ingested from edge AI/ML analytics pipeline
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleEnableAudio}
                        className={`flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${audioEnabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                            }`}
                    >
                        {audioEnabled ? <Volume2 className="w-3.5 h-3.5 mr-2 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 mr-2" />}
                        {audioEnabled ? 'Voice Alerts Active' : 'Enable Voice Alerts'}
                    </button>
                </div>
            </div>

            {/* AI Simulator Action Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>Pipeline Tester: Simulate Computer Vision Event</span>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                        onClick={() => handleSimulateAiEvent('ANPR_WATCHLIST_MATCH')}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-indigo-700 text-xs font-mono font-semibold border border-indigo-200 shadow-sm flex items-center space-x-1.5 transition"
                    >
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ANPR Plate Match</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('CROWD_SURGE_DETECTED')}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-amber-700 text-xs font-mono font-semibold border border-amber-200 shadow-sm flex items-center space-x-1.5 transition"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Crowd Density Surge</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('UNAUTHORIZED_INTRUSION')}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-700 text-xs font-mono font-semibold border border-blue-200 shadow-sm flex items-center space-x-1.5 transition"
                    >
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        <span>Intrusion Tripwire</span>
                    </button>
                    <button
                        onClick={() => handleSimulateAiEvent('FIRE_SMOKE_HAZARD')}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-rose-700 text-xs font-mono font-semibold border border-rose-200 shadow-sm flex items-center space-x-1.5 transition"
                    >
                        <Zap className="w-3.5 h-3.5 text-rose-600" />
                        <span>Thermal Fire Anomaly</span>
                    </button>
                </div>
            </div>

            {/* Alert Cards Container */}
            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-200/60">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs font-semibold text-slate-600">No critical events detected. All surveillance sectors operational.</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition shadow-sm ${alert.severity === 'CRITICAL'
                                    ? 'bg-rose-50/50 border-rose-200 text-slate-900'
                                    : 'bg-amber-50/50 border-amber-200 text-slate-900'
                                }`}
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center space-x-2.5">
                                    <span
                                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${alert.severity === 'CRITICAL'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-amber-500 text-white'
                                            }`}
                                    >
                                        {alert.alert_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                <p className="text-sm font-bold text-slate-900 tracking-tight">{alert.camera_name}</p>
                                <p className="text-xs font-mono text-slate-600 flex items-center space-x-2">
                                    <span>ID: {alert.camera_id}</span>
                                    {alert.bounding_box_details && (
                                        <span className="text-emerald-600 font-semibold">• {alert.bounding_box_details}</span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                                <Link
                                    to={`/cameras/${alert.camera_id}`}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 shadow-sm transition"
                                >
                                    Inspect Stream
                                </Link>
                                <button
                                    onClick={() => markResolved(alert.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                                >
                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
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
