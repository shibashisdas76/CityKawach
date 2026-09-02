import React from 'react';

interface CrowdDensityMeterProps {
  value: number; // 0-1
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CrowdDensityMeter: React.FC<CrowdDensityMeterProps> = ({
  value, label = 'Crowd Density', size = 'md',
}) => {
  const pct = Math.round(value * 100);
  const color = value > 0.7 ? '#EF4444' : value > 0.4 ? '#F59E0B' : '#10B981';
  const label2 = value > 0.7 ? 'CRITICAL' : value > 0.4 ? 'HIGH' : value > 0.2 ? 'MEDIUM' : 'LOW';

  const sizes = { sm: 60, md: 88, lg: 110 };
  const r = sizes[size];
  const stroke = size === 'sm' ? 6 : 8;
  const circumference = 2 * Math.PI * (r - stroke);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={r * 2} height={r * 2} className="rotate-[-90deg]">
        <circle cx={r} cy={r} r={r - stroke} fill="none" stroke="#1E293B" strokeWidth={stroke} />
        <circle
          cx={r} cy={r} r={r - stroke} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
        <text
          x={r} y={r + 2}
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size === 'sm' ? 12 : 16} fontWeight="bold"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${r}px ${r}px` }}
        >
          {pct}%
        </text>
      </svg>
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        <p className="text-[10px] font-bold" style={{ color }}>{label2}</p>
      </div>
    </div>
  );
};
