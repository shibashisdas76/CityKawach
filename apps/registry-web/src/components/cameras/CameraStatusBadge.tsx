import React from 'react';

interface Props {
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN';
}

export const CameraStatusBadge: React.FC<Props> = ({ status }) => {
    const badgeStyles = {
        ONLINE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        OFFLINE: 'bg-rose-100 text-rose-800 border-rose-300',
        MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-300',
        UNKNOWN: 'bg-slate-100 text-slate-800 border-slate-300',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyles[status] || badgeStyles.UNKNOWN
                }`}
        >
            {status}
        </span>
    );
};