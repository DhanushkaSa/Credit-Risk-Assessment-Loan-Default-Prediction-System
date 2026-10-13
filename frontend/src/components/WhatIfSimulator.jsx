import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Sliders,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * WhatIfSimulator
 * Interactive Sensitivity & Counter-Offer Engine.
 * Allows underwriters to dynamically manipulate loan amount, interest rate,
 * income, and credit grade to immediately see live model inference deltas
 * and generate policy counter-offers.
 */
export default function WhatIfSimulator({
  initialFormData,
  baselineResult,
  onApplyTerms,
  apiUrl = 'http://127.0.0.1:8000/predict',
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Simulated state initialized from active form data
  const [simState, setSimState] = useState({
    loan_amnt: initialFormData?.loan_amnt || 12000,
    loan_int_rate: initialFormData?.loan_int_rate || 11.5,
    person_income: initialFormData?.person_income || 65000,
    loan_grade: initialFormData?.loan_grade || 'B',
  });

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  // Sync with new baseline when applicant changes
  useEffect(() => {
    if (initialFormData) {
      setSimState({
        loan_amnt: initialFormData.loan_amnt,
        loan_int_rate: initialFormData.loan_int_rate,
        person_income: initialFormData.person_income,
        loan_grade: initialFormData.loan_grade,
      });
      setSimResult(null);
    }
  }, [initialFormData]);

  // Calculated simulated Loan-to-Income ratio (clamped between 0.01 and 1.0)
  const simLtiRatio = Math.min(
    1.0,
    Math.max(
      0.01,
      parseFloat(
        ((simState.loan_amnt || 1000) / (simState.person_income || 10000)).toFixed(
          3
        )
      )
    )
  );

  // Parse baseline probability number
  const baselineProb = baselineResult?.default_probability
    ? parseFloat(baselineResult.default_probability.replace('%', ''))
    : 0;

  // Live inference evaluation
  const runSimulation = useCallback(
    async (candidateState) => {
      setLoading(true);
      try {
        const payload = {
          ...initialFormData,
          loan_amnt: Number(candidateState.loan_amnt),
          loan_int_rate: Number(candidateState.loan_int_rate),
          person_income: Number(candidateState.person_income),
          loan_grade: candidateState.loan_grade,
          loan_percent_income: Math.min(
            1.0,
            Math.max(
              0.01,
              parseFloat(
                (
                  Number(candidateState.loan_amnt) /
                  Number(candidateState.person_income)
                ).toFixed(3)
              )
            )
          ),
        };

        const res = await axios.post(apiUrl, payload);
        setSimResult(res.data);
      } catch (err) {
        console.error('Simulation calculation failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [initialFormData, apiUrl]
  );

  // Debounced model invocation on slider changes
  const handleSliderChange = (field, value) => {
    const updated = { ...simState, [field]: value };
    setSimState(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSimulation(updated);
    }, 280);
  };

  // Reset to original form values
  const handleResetToBaseline = () => {
    if (!initialFormData) return;
    const reset = {
      loan_amnt: initialFormData.loan_amnt,
      loan_int_rate: initialFormData.loan_int_rate,
      person_income: initialFormData.person_income,
      loan_grade: initialFormData.loan_grade,
    };
    setSimState(reset);
    setSimResult(null);
  };

  // Quick Counter-Offer Scenarios
  // Scenario 1: Cap loan amount to safe LTI (e.g. 25% of income)
  const safeLoanAmnt = Math.max(
    1000,
    Math.round(((simState.person_income || 60000) * 0.25) / 500) * 500
  );

  // Scenario 2: Moderate counter (35% of income)
  const moderateLoanAmnt = Math.max(
    1000,
    Math.round(((simState.person_income || 60000) * 0.35) / 500) * 500
  );

  const applyPresetScenario = (candidateTerms) => {
    setSimState((prev) => {
      const merged = { ...prev, ...candidateTerms };
      runSimulation(merged);
      return merged;
    });
  };

  // Delta calculations
  const simProb = simResult?.default_probability
    ? parseFloat(simResult.default_probability.replace('%', ''))
    : baselineProb;

  const probDelta = simResult ? simProb - baselineProb : 0;
  const isRiskReduced = probDelta < -0.05;
  const isRiskEscalated = probDelta > 0.05;

  return (
    <div className="mt-8 bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
      {/* Simulator Header / Collapsible Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4.5 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight">
                "What-If" Sensitivity Simulator & Counter-Offers
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Interactive Restructuring
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate adjustments to loan amount, interest rate, and income to explore approval thresholds in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-cyan-400 flex items-center gap-1.5 font-mono animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
            </span>
          )}
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 sm:p-7 space-y-7">
          {/* Top Comparison Banner: Baseline vs Simulated Scenario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Baseline Snapshot */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Baseline Application
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-semibold text-slate-200">
                  {baselineResult?.risk_level || 'Evaluated'} Risk
                </span>
                <span className="text-xl font-bold font-mono text-slate-100">
                  {baselineResult?.default_probability || `${baselineProb.toFixed(1)}%`}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                <span>Requested: ${(initialFormData?.loan_amnt || 0).toLocaleString()}</span>
                <span>LTI: {(((initialFormData?.loan_percent_income || 0) * 100).toFixed(0))}%</span>
              </div>
            </div>

            {/* 2. Simulated Outcome */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                simResult?.risk_level === 'Low' || (!simResult && baselineProb < 35)
                  ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                  : simResult?.risk_level === 'Medium' || (!simResult && baselineProb < 65)
                  ? 'bg-amber-950/20 border-amber-800/50 text-amber-200'
                  : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Simulated Outcome</span>
                {loading && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold">
                  {simResult ? `${simResult.risk_level} Risk` : 'Adjust Below'}
                </span>
                <span className="text-2xl font-black font-mono">
                  {simProb.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
                <span>Simulated: ${Number(simState.loan_amnt).toLocaleString()}</span>
                <span className="font-mono">LTI: {(simLtiRatio * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* 3. Risk Delta Impact */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Risk Differential
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isRiskReduced ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {probDelta.toFixed(1)}%
                      </div>
                      <span className="text-[11px] text-emerald-300/80 font-medium">
                        Default Risk Reduced
                      </span>
                    </div>
                  </>
                ) : isRiskEscalated ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-xl font-bold font-mono text-rose-400">
                        +{probDelta.toFixed(1)}%
                      </div>
                      <span className="text-[11px] text-rose-300/80 font-medium">
                        Default Risk Escalated
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Drag sliders below to simulate parameter changes.
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                Threshold target: &le; 35.0% for Approval
              </div>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
            {/* Slider 1: Loan Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Loan Amount Requested
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700">
                    ${Number(simState.loan_amnt).toLocaleString()}
                  </span>
                  {simState.loan_amnt !== initialFormData?.loan_amnt && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        simState.loan_amnt < initialFormData?.loan_amnt
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : 'text-rose-400 bg-rose-950/60'
                      }`}
                    >
                      {simState.loan_amnt > initialFormData?.loan_amnt ? '+' : ''}
                      ${(simState.loan_amnt - initialFormData?.loan_amnt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="1000"
                max="35000"
                step="500"
                value={simState.loan_amnt}
                onChange={(e) => handleSliderChange('loan_amnt', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>$1,000</span>
                <span>$15,000</span>
                <span>$35,000</span>
              </div>
            </div>

            {/* Slider 2: Interest Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" /> Interest Rate
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700">
                    {Number(simState.loan_int_rate).toFixed(2)}%
                  </span>
                  {simState.loan_int_rate !== initialFormData?.loan_int_rate && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        simState.loan_int_rate < initialFormData?.loan_int_rate
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : 'text-rose-400 bg-rose-950/60'
                      }`}
                    >
                      {simState.loan_int_rate > initialFormData?.loan_int_rate ? '+' : ''}
                      {(simState.loan_int_rate - initialFormData?.loan_int_rate).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="5.0"
                max="26.0"
                step="0.25"
                value={simState.loan_int_rate}
                onChange={(e) => handleSliderChange('loan_int_rate', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>5.0%</span>
                <span>15.0%</span>
                <span>26.0%</span>
              </div>
            </div>

            {/* Slider 3: Annual Income */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Borrower Annual Income
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700">
                    ${Number(simState.person_income).toLocaleString()}
                  </span>
                  {simState.person_income !== initialFormData?.person_income && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        simState.person_income > initialFormData?.person_income
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : 'text-rose-400 bg-rose-950/60'
                      }`}
                    >
                      {simState.person_income > initialFormData?.person_income ? '+' : ''}
                      ${(simState.person_income - initialFormData?.person_income).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="15000"
                max="160000"
                step="2500"
                value={simState.person_income}
                onChange={(e) => handleSliderChange('person_income', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>$15,000</span>
                <span>$80,000</span>
                <span>$160,000</span>
              </div>
            </div>

            {/* Dropdown 4: Loan Grade */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" /> Credit Rating Grade
                </label>
                <span className="text-[11px] text-slate-400">
                  Current: Grade {initialFormData?.loan_grade}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleSliderChange('loan_grade', grade)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      simState.loan_grade === grade
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Computed Loan-to-Income: <span className="font-mono text-cyan-400 font-semibold">{((simLtiRatio) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Underwriting Counter-Offer Strategy Cards */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recommended Policy Counter-Offer Strategies
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Strategy 1: Safe Loan Cap */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Conservative Loan Cap (25% LTI)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Restructure requested loan to <strong className="text-white">${safeLoanAmnt.toLocaleString()}</strong> to keep repayment within prime solvency limits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    applyPresetScenario({
                      loan_amnt: safeLoanAmnt,
                      loan_int_rate: 9.5,
                      loan_grade: 'B',
                    })
                  }
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Test ${safeLoanAmnt.toLocaleString()} Loan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Strategy 2: Moderate Structuring */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    Balanced Counter-Offer (35% LTI)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Offer <strong className="text-white">${moderateLoanAmnt.toLocaleString()}</strong> at adjusted rate with debt consolidation agreement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    applyPresetScenario({
                      loan_amnt: moderateLoanAmnt,
                      loan_int_rate: 12.0,
                    })
                  }
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Test ${moderateLoanAmnt.toLocaleString()} Loan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Strategy 3: Co-Signer / Rate Concession */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition-colors flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Co-Borrower / Prime Grade A
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Underwrite with a qualified co-signer to elevate tier to <strong className="text-white">Grade A</strong> at 8.0% APR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    applyPresetScenario({
                      loan_grade: 'A',
                      loan_int_rate: 8.0,
                    })
                  }
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Test Grade A Terms</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Toolbar */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                Simulated values can be immediately synchronized to the active underwriting evaluation form.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Simulation
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onApplyTerms) {
                    onApplyTerms({
                      loan_amnt: simState.loan_amnt,
                      loan_int_rate: simState.loan_int_rate,
                      person_income: simState.person_income,
                      loan_grade: simState.loan_grade,
                      loan_percent_income: simLtiRatio,
                    });
                  }
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply Terms to Main Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
