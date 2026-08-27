import React from 'react';

interface Props {
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN';
}

export const CameraStatusBadge: React.FC<Props> = ({ status }) => {
    const badgeStyles = {
        ONLINE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500',
        OFFLINE: 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500',
        MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500',
        UNKNOWN: 'bg-slate-100 text-slate-700 border-slate-200/80 dot-slate-400',
    };

    const dotColors = {
        ONLINE: 'bg-emerald-500',
        OFFLINE: 'bg-rose-500',
        MAINTENANCE: 'bg-amber-500',
        UNKNOWN: 'bg-slate-400',
    };

    const currentStyle = badgeStyles[status] || badgeStyles.UNKNOWN;
    const currentDot = dotColors[status] || dotColors.UNKNOWN;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${currentStyle}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
            {status}
        </span>
    );
};