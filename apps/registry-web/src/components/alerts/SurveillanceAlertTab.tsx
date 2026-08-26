import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient'; // Ensure path is correct for their app

interface CriticalAlert {
    id: string;
    camera_id: string;
    camera_name: string;
    alert_type: string;
    timestamp: string;
    resolved: boolean;
}

export const SurveillanceAlertTab: React.FC = () => {
    const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioContextReady = useRef(false);

    // 1. Voice Synthesis Helper
    const triggerVoiceAlert = (cameraName: string, alertType: string) => {
        if (!audioContextReady.current || !window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(
            `Critical Alert. ${alertType} detected at ${cameraName}.`
        );
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    // 2. Enable Audio Interaction
    const handleEnableAudio = () => {
        setAudioEnabled(true);
        audioContextReady.current = true;

        // Play a silent utterance to unlock the API in some strict browsers
        const silentUtterance = new SpeechSynthesisUtterance("Audio alerts enabled.");
        silentUtterance.volume = 0.5;
        window.speechSynthesis.speak(silentUtterance);
    };

    // 3. Supabase Real-Time Listener
    useEffect(() => {
        // This assumes your analytics team is writing to an 'active_alerts' table
        const channel = supabase
            .channel('critical_alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'active_alerts' },
                (payload) => {
                    const newAlert = payload.new as CriticalAlert;

                    setAlerts((prev) => [newAlert, ...prev]);
                    triggerVoiceAlert(newAlert.camera_name, newAlert.alert_type);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markResolved = (id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        // Here your teammate would also run a Supabase UPDATE to mark it resolved in the DB
    };

    return (
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-700 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center text-rose-500">
                    <AlertOctagon className="w-6 h-6 mr-2" />
                    Critical Surveillance Alerts
                </h2>

                <button
                    onClick={handleEnableAudio}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition ${audioEnabled
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                >
                    {audioEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    {audioEnabled ? 'Voice Alerts Active' : 'Enable Voice Alerts'}
                </button>
            </div>

            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No critical events detected. Sector is secure.</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-lg flex justify-between items-center animate-pulse">
                            <div>
                                <p className="text-rose-400 font-bold uppercase tracking-wider text-sm">
                                    {alert.alert_type}
                                </p>
                                <p className="text-lg font-semibold text-slate-100">{alert.camera_name}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">
                                    ID: {alert.camera_id} | {new Date(alert.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <button
                                onClick={() => markResolved(alert.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-semibold border border-slate-600 transition"
                            >
                                Acknowledge
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};