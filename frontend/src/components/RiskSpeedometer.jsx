import React from 'react';

/**
 * RiskSpeedometer
 * Semi-circular radial gauge rendering credit default probability with animated needle,
 * color-coded risk bands (Safe -> Moderate -> Elevated), and credit score tier indicators.
 */
export default function RiskSpeedometer({ probability = 0, riskLevel = 'Low' }) {
  // Clamp probability between 0 and 100
  const prob = Math.min(100, Math.max(0, probability));

  // Needle angle: -90 degrees at 0%, 0 degrees at 50%, +90 degrees at 100%
  const needleAngle = -90 + (prob / 100) * 180;

  // Arc calculations (Radius = 105, Center = 150, 140)
  // Arc length for 180 degrees = PI * R ≈ 329.87
  const arcRadius = 100;
  const arcCircumference = Math.PI * arcRadius;
  const progressStrokeDashoffset = arcCircumference * (1 - prob / 100);

  // Dynamic color selection based on risk level
  const getTheme = () => {
    if (prob < 35) {
      return {
        badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        text: 'text-emerald-400',
        glow: 'rgba(16, 185, 129, 0.4)',
        tier: 'Tier A • Prime Quality',
        tierDesc: 'Low likelihood of default within 12-month horizon',
      };
    }
    if (prob < 65) {
      return {
        badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        text: 'text-amber-400',
        glow: 'rgba(245, 158, 11, 0.4)',
        tier: 'Tier B • Moderate / Near-Prime',
        tierDesc: 'Substantial debt load; counter-terms recommended',
      };
    }
    return {
      badge: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      text: 'text-rose-400',
      glow: 'rgba(244, 63, 94, 0.4)',
      tier: 'Tier D • High Risk / Subprime',
      tierDesc: 'Elevated probability of default requires mitigation',
    };
  };

  const theme = getTheme();

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG Container */}
      <div className="relative w-full max-w-[280px] h-[160px] flex items-center justify-center">
        <svg
          viewBox="0 0 300 175"
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            {/* Color spectrum gradient across the semi-circle */}
            <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#22c55e" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Glowing filter for needle */}
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.5" />
            </filter>

            {/* Subtle track shadow */}
            <filter id="trackShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track Arc (Dark Slate) */}
          <path
            d="M 50,140 A 100,100 0 0,1 250,140"
            fill="none"
            stroke="#1e293b"
            strokeWidth="18"
            strokeLinecap="round"
            filter="url(#trackShadow)"
          />

          {/* Active Gradient Filled Arc */}
          <path
            d="M 50,140 A 100,100 0 0,1 250,140"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={arcCircumference}
            strokeDashoffset={progressStrokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />

          {/* Tick Marks: 0%, 25%, 50%, 75%, 100% */}
          {/* 0% Tick */}
          <line x1="36" y1="140" x2="44" y2="140" stroke="#64748b" strokeWidth="2" />
          <text x="24" y="144" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="end">
            0%
          </text>

          {/* 50% Tick (Cutoff Threshold) */}
          <line x1="150" y1="26" x2="150" y2="34" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="150" y="20" fill="#f59e0b" fontSize="10" fontWeight="700" textAnchor="middle">
            50%
          </text>

          {/* 100% Tick */}
          <line x1="256" y1="140" x2="264" y2="140" stroke="#64748b" strokeWidth="2" />
          <text x="276" y="144" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="start">
            100%
          </text>

          {/* Needle Group with Pivot at (150, 140) */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: '150px 140px',
              transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            filter="url(#needleGlow)"
          >
            {/* Tapered needle pointer */}
            <polygon
              points="148,140 152,140 150.8,48 149.2,48"
              fill="#f8fafc"
            />
            {/* Needle tip accent */}
            <circle cx="150" cy="48" r="2.5" fill="#818cf8" />
          </g>

          {/* Center Hub Outer Ring */}
          <circle cx="150" cy="140" r="14" fill="#0f172a" stroke="#334155" strokeWidth="3" />
          {/* Center Hub Inner Accent */}
          <circle cx="150" cy="140" r="7" fill="#6366f1" />
          <circle cx="150" cy="140" r="3" fill="#ffffff" />
        </svg>

        {/* Digital Percentage Overlay (Positioned right above the bottom pivot) */}
        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <div className="text-2xl font-black font-mono tracking-tight text-white flex items-baseline gap-0.5">
            <span>{prob.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-sans">%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium -mt-0.5">
            Default Probability
          </span>
        </div>
      </div>

      {/* Credit Risk Tier Badge */}
      <div className="mt-3 flex flex-col items-center text-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${theme.badge}`}
        >
          {theme.tier}
        </span>
        <p className="mt-1.5 text-[11px] text-slate-400 max-w-xs">
          {theme.tierDesc}
        </p>
      </div>

      {/* Scale Legend Bar */}
      <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe (&lt;35%)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Caution (35-65%)
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Elevated (&gt;65%)
        </span>
      </div>
    </div>
  );
}
