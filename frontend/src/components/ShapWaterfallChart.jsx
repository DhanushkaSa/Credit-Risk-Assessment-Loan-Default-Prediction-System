import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Info,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

/**
 * ShapWaterfallChart
 * Renders an interactive Explainable AI (XAI) feature attribution chart.
 * Features a diverging bar waterfall visualization, impact magnitude meters,
 * view toggles (Visual Waterfall vs Detailed Cards), and net attribution summary.
 */
export default function ShapWaterfallChart({
  explanation,
  formatFeatureName,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'risk' | 'mitigating'
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'cards'

  const riskFactors = explanation?.top_risk_factors || [];
  const positiveFactors = explanation?.top_positive_factors || [];

  // Combine and annotate factors
  const allFactors = [
    ...riskFactors.map((f) => ({
      ...f,
      type: 'risk',
      absImpact: Math.abs(Number(f.impact_value) || 0),
    })),
    ...positiveFactors.map((f) => ({
      ...f,
      type: 'mitigating',
      absImpact: Math.abs(Number(f.impact_value) || 0),
    })),
  ].sort((a, b) => b.absImpact - a.absImpact);

  // Maximum impact for proportional bar scaling
  const maxAbsImpact = Math.max(
    ...allFactors.map((f) => f.absImpact),
    0.01
  );

  // Filter based on selected tab
  const displayedFactors = allFactors.filter((factor) => {
    if (activeTab === 'risk') return factor.type === 'risk';
    if (activeTab === 'mitigating') return factor.type === 'mitigating';
    return true;
  });

  // Calculate Net Attribution Impact (Sum of SHAP values)
  const totalRiskImpact = riskFactors.reduce(
    (sum, f) => sum + (Number(f.impact_value) || 0),
    0
  );
  const totalPositiveImpact = positiveFactors.reduce(
    (sum, f) => sum + (Number(f.impact_value) || 0),
    0
  );
  const netImpact = totalRiskImpact + totalPositiveImpact;

  return (
    <div className="space-y-4">
      {/* Header Toolbar: Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Drivers ({allFactors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'risk'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-rose-400" />
            Adverse ({riskFactors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mitigating')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'mitigating'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            Protective ({positiveFactors.length})
          </button>
        </div>

        {/* View Mode Toggle: Bar Chart vs Cards */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'chart'
                ? 'bg-slate-800 text-indigo-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visual Waterfall Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Visual Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-slate-800 text-indigo-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Detailed Card View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">List Cards</span>
          </button>
        </div>
      </div>

      {/* Main Content: Chart View or Card View */}
      {viewMode === 'chart' ? (
        <div className="space-y-3.5">
          {/* Axis Legend Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-sans">
              <span className="w-2 h-2 rounded bg-emerald-500" /> Protective (Reduces Risk)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-sans">
              <span className="w-2 h-2 rounded bg-rose-500" /> Adverse (Escalates Risk)
            </span>
          </div>

          {/* Diverging Waterfall Bars */}
          <div className="space-y-2.5">
            {displayedFactors.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/40 rounded-xl">
                No factors match the selected filter.
              </p>
            ) : (
              displayedFactors.map((item, idx) => {
                const isRisk = item.type === 'risk';
                const formattedVal =
                  typeof item.impact_value === 'number'
                    ? item.impact_value.toFixed(2)
                    : item.impact_value;
                const sign = isRisk ? '+' : '';
                const barWidth = Math.max(
                  8,
                  Math.min(100, (item.absImpact / maxAbsImpact) * 100)
                );

                return (
                  <div
                    key={`factor-${idx}`}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      isRisk
                        ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30 hover:border-rose-800/60'
                        : 'bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/30 hover:border-emerald-800/60'
                    }`}
                  >
                    {/* Header: Name & Numerical Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isRisk ? (
                          <TrendingUp className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {formatFeatureName ? formatFeatureName(item.feature) : item.feature}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border shadow-sm ${
                            isRisk
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-rose-950/50'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-emerald-950/50'
                          }`}
                        >
                          {sign}
                          {formattedVal}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Waterfall Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/60">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isRisk
                              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">
                          {isRisk
                            ? 'Pushes prediction toward Default'
                            : 'Strengthens creditworthiness'}
                        </span>
                        <span className="font-mono text-slate-500 shrink-0">
                          {barWidth.toFixed(0)}% Relative Impact
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
          /* Cards View Mode */
          <div className="space-y-4">
            {/* Risk Factors */}
            {(activeTab === 'all' || activeTab === 'risk') && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Key Factors Escalating Default Risk</span>
                </div>
                <div className="space-y-2">
                  {riskFactors.map((item, idx) => (
                    <div
                      key={`card-risk-${idx}`}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-300">
                          {formatFeatureName ? formatFeatureName(item.feature) : item.feature}
                        </span>
                        <span className="font-mono font-bold text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded text-[11px] border border-rose-800/60">
                          +{typeof item.impact_value === 'number' ? item.impact_value.toFixed(2) : item.impact_value}
                        </span>
                      </div>
                      <span className="text-rose-300/80 text-[11px]">
                        {item.description || 'Increased Default Risk'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigating Factors */}
            {(activeTab === 'all' || activeTab === 'mitigating') && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Protective Factors Reducing Default Risk</span>
                </div>
                <div className="space-y-2">
                  {positiveFactors.map((item, idx) => (
                    <div
                      key={`card-pos-${idx}`}
                      className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-300">
                          {formatFeatureName ? formatFeatureName(item.feature) : item.feature}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded text-[11px] border border-emerald-800/60">
                          {typeof item.impact_value === 'number' ? item.impact_value.toFixed(2) : item.impact_value}
                        </span>
                      </div>
                      <span className="text-emerald-300/80 text-[11px]">
                        {item.description || 'Decreased Default Risk'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Net Attribution Summary Footer */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Net Feature Attribution Balance:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono font-bold px-2.5 py-0.5 rounded-md border text-xs ${
              netImpact > 0
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/70'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70'
            }`}
          >
            {netImpact > 0 ? `+${netImpact.toFixed(2)} (Net Adverse)` : `${netImpact.toFixed(2)} (Net Protective)`}
          </span>
        </div>
      </div>
    </div>
  );
}
