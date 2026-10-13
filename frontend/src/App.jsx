import React, { useState } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  User,
  Briefcase,
  Building2,
  Percent,
  History,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Activity,
  FileCheck2,
  BarChart3,
  Scale,
  Info
} from 'lucide-react';
import RiskSpeedometer from './components/RiskSpeedometer';
import ShapWaterfallChart from './components/ShapWaterfallChart';
import WhatIfSimulator from './components/WhatIfSimulator';

const API_URL = 'http://127.0.0.1:8000/predict';

// Human-friendly labels for SHAP feature names
const FEATURE_LABELS = {
  // Continuous & Financial features
  person_age: 'Borrower Age',
  person_income: 'Annual Income',
  person_emp_length: 'Employment Duration',
  loan_amnt: 'Loan Amount Requested',
  loan_int_rate: 'Interest Rate (%)',
  loan_percent_income: 'Loan-to-Income Ratio',
  cb_person_cred_hist_length: 'Credit Bureau History Length',

  // Categorical & Model Encoded features
  loan_grade_enc: 'Assigned Credit Grade',
  loan_grade: 'Assigned Credit Grade',
  cb_default_enc: 'Prior Default on Record',
  cb_person_default_on_file: 'Prior Default on Record',

  // Home Ownership one-hot variants
  person_home_ownership_RENT: 'Home Ownership: Rents Home',
  person_home_ownership_OWN: 'Home Ownership: Owns Home',
  person_home_ownership_MORTGAGE: 'Home Ownership: Under Mortgage',
  person_home_ownership_OTHER: 'Home Ownership: Other Status',
  person_home_ownership: 'Home Ownership Status',

  // Loan Intent one-hot variants
  loan_intent_EDUCATION: 'Loan Purpose: Education',
  loan_intent_HOMEIMPROVEMENT: 'Loan Purpose: Home Improvement',
  loan_intent_MEDICAL: 'Loan Purpose: Medical Expense',
  loan_intent_PERSONAL: 'Loan Purpose: Personal Expenses',
  loan_intent_VENTURE: 'Loan Purpose: Business Venture',
  loan_intent_DEBTCONSOLIDATION: 'Loan Purpose: Debt Consolidation',
  loan_intent: 'Loan Purpose',
};

const formatFeatureName = (feature) => {
  if (!feature) return '';
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature];

  // Pattern matching for home ownership
  if (feature.startsWith('person_home_ownership_')) {
    const type = feature.replace('person_home_ownership_', '');
    const map = { RENT: 'Rents Home', OWN: 'Owns Home', MORTGAGE: 'Mortgage', OTHER: 'Other Status' };
    return `Home Ownership: ${map[type] || type}`;
  }

  // Pattern matching for loan intent
  if (feature.startsWith('loan_intent_')) {
    const type = feature.replace('loan_intent_', '');
    const map = {
      EDUCATION: 'Education',
      MEDICAL: 'Medical Expense',
      VENTURE: 'Business Venture',
      PERSONAL: 'Personal Expenses',
      DEBTCONSOLIDATION: 'Debt Consolidation',
      HOMEIMPROVEMENT: 'Home Improvement',
    };
    return `Loan Purpose: ${map[type] || type}`;
  }

  if (feature.includes('default')) {
    return 'Prior Default on Record';
  }

  if (feature.includes('loan_grade')) {
    return 'Assigned Credit Grade';
  }

  // Fallback: strip technical affixes and format neatly
  return feature
    .replace(/_enc$/i, '')
    .replace(/^(person_|cb_)/i, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const DEFAULT_FORM_DATA = {
  person_age: 28,
  person_income: 65000,
  person_home_ownership: 'RENT',
  person_emp_length: 4,
  loan_intent: 'EDUCATION',
  loan_grade: 'B',
  loan_amnt: 12000,
  loan_int_rate: 11.5,
  loan_percent_income: 0.18,
  cb_person_default_on_file: 'N',
  cb_person_cred_hist_length: 5,
};

const PRESET_LOW_RISK = {
  person_age: 38,
  person_income: 95000,
  person_home_ownership: 'MORTGAGE',
  person_emp_length: 8,
  loan_intent: 'HOMEIMPROVEMENT',
  loan_grade: 'A',
  loan_amnt: 10000,
  loan_int_rate: 7.2,
  loan_percent_income: 0.11,
  cb_person_default_on_file: 'N',
  cb_person_cred_hist_length: 10,
};

const PRESET_HIGH_RISK = {
  person_age: 22,
  person_income: 24000,
  person_home_ownership: 'RENT',
  person_emp_length: 1,
  loan_intent: 'DEBTCONSOLIDATION',
  loan_grade: 'D',
  loan_amnt: 16000,
  loan_int_rate: 18.5,
  loan_percent_income: 0.67,
  cb_person_default_on_file: 'Y',
  cb_person_cred_hist_length: 2,
};

export default function App() {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;

    if (type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: parsedValue };

      // Helper: If user changes loan_amnt or person_income, auto-update loan_percent_income if not explicitly locked
      if ((name === 'loan_amnt' || name === 'person_income') && updated.person_income > 0) {
        const ratio = parseFloat((updated.loan_amnt / updated.person_income).toFixed(2));
        if (ratio >= 0 && ratio <= 1) {
          updated.loan_percent_income = ratio;
        }
      }

      return updated;
    });
  };

  const applyPreset = (preset) => {
    setFormData(preset);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare strictly-typed payload matching backend Pydantic schema
    const payload = {
      person_age: parseInt(formData.person_age, 10),
      person_income: parseFloat(formData.person_income),
      person_home_ownership: String(formData.person_home_ownership),
      person_emp_length: parseFloat(formData.person_emp_length),
      loan_intent: String(formData.loan_intent),
      loan_grade: String(formData.loan_grade),
      loan_amnt: parseFloat(formData.loan_amnt),
      loan_int_rate: parseFloat(formData.loan_int_rate),
      loan_percent_income: parseFloat(formData.loan_percent_income),
      cb_person_default_on_file: String(formData.cb_person_default_on_file),
      cb_person_cred_hist_length: parseInt(formData.cb_person_cred_hist_length, 10),
    };

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      setResult(response.data);
    } catch (err) {
      console.error('API Error:', err);
      let errorMsg = 'Failed to connect to the prediction server.';
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          const detail = err.response.data.detail;
          errorMsg = Array.isArray(detail)
            ? detail.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
            : String(detail);
        } else {
          errorMsg = `Server error: HTTP ${err.response.status}`;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timed out. Please ensure the backend is responsive.';
      } else if (err.request) {
        errorMsg = `Cannot connect to ${API_URL}. Is your FastAPI backend running on port 8000?`;
      } else {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize and re-evaluate simulated counter-offer terms
  const handleApplySimulatedTerms = async (updatedTerms) => {
    const updatedForm = {
      ...formData,
      ...updatedTerms,
    };
    setFormData(updatedForm);

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_URL, updatedForm, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      setResult(response.data);
    } catch (err) {
      console.error('API Error applying simulated terms:', err);
      setError('Failed to re-evaluate application with simulated counter-offer terms.');
    } finally {
      setLoading(false);
    }
  };

  // Color & Badge mappings based on risk_level
  const getRiskTheme = (riskLevel) => {
    const level = (riskLevel || '').toLowerCase();
    if (level === 'high') {
      return {
        badgeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
        cardBorder: 'border-rose-500/30',
        glow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
        accentText: 'text-rose-400',
        progressBar: 'bg-gradient-to-r from-amber-500 to-rose-500',
        icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
        statusTitle: 'High Default Risk',
      };
    }
    if (level === 'medium') {
      return {
        badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
        cardBorder: 'border-amber-500/30',
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        accentText: 'text-amber-400',
        progressBar: 'bg-gradient-to-r from-blue-500 to-amber-500',
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        statusTitle: 'Moderate Default Risk',
      };
    }
    // Low risk default
    return {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      cardBorder: 'border-emerald-500/30',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      accentText: 'text-emerald-400',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      statusTitle: 'Low Default Risk',
    };
  };

  const riskTheme = result ? getRiskTheme(result.risk_level) : null;

  // Numeric probability parsing for progress display
  const probNum = result?.default_probability
    ? parseFloat(result.default_probability.replace('%', ''))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Scale className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Credit Risk Assessment
                <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  XAI Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Loan Default Prediction & Explainable AI (SHAP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend:</span>
              <code className="text-slate-300 font-mono">127.0.0.1:8000</code>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro & Quick Presets Toolbar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Underwriting Assessment Console
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Enter applicant financials and credit parameters below to compute default probability and extract SHAP feature impact explanations.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Test Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(PRESET_LOW_RISK)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors"
            >
              Low Risk Sample
            </button>
            <button
              type="button"
              onClick={() => applyPreset(PRESET_HIGH_RISK)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40 transition-colors"
            >
              High Risk Sample
            </button>
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_FORM_DATA)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Reset to default values"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-rose-200">Prediction Request Error</h4>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
              <p className="mt-1 text-xs text-rose-400/80">
                Ensure your FastAPI backend is running via <code className="font-mono bg-rose-950/60 px-1 py-0.5 rounded">uvicorn backend.app.main:app --reload --port 8000</code>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Input Form (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100">Applicant & Loan Parameters</h3>
                </div>
                <span className="text-xs text-slate-400">11 Feature Inputs</span>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* SECTION 1: Personal Profile */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> 1. Borrower Demographics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Borrower Age <span className="text-slate-500">(years)</span>
                      </label>
                      <input
                        type="number"
                        name="person_age"
                        min="18"
                        max="100"
                        required
                        value={formData.person_age}
                        onChange={handleChange}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="e.g. 28"
                      />
                    </div>

                    {/* Annual Income */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Annual Income <span className="text-slate-500">($ USD)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="number"
                          name="person_income"
                          min="0"
                          step="any"
                          required
                          value={formData.person_income}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                          placeholder="e.g. 65000"
                        />
                      </div>
                    </div>

                    {/* Home Ownership */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Home Ownership Status
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <select
                          name="person_home_ownership"
                          value={formData.person_home_ownership}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="RENT">RENT</option>
                          <option value="OWN">OWN</option>
                          <option value="MORTGAGE">MORTGAGE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Employment Length */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Employment Duration <span className="text-slate-500">(years)</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="number"
                          name="person_emp_length"
                          min="0"
                          step="0.5"
                          required
                          value={formData.person_emp_length}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                          placeholder="e.g. 4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Loan Details */}
                <div className="pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> 2. Requested Loan Terms
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Loan Intent */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Loan Intent / Purpose
                      </label>
                      <div className="relative">
                        <select
                          name="loan_intent"
                          value={formData.loan_intent}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="EDUCATION">EDUCATION</option>
                          <option value="MEDICAL">MEDICAL</option>
                          <option value="VENTURE">VENTURE</option>
                          <option value="PERSONAL">PERSONAL</option>
                          <option value="DEBTCONSOLIDATION">DEBT CONSOLIDATION</option>
                          <option value="HOMEIMPROVEMENT">HOME IMPROVEMENT</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Loan Grade */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Assigned Loan Grade
                      </label>
                      <div className="relative">
                        <select
                          name="loan_grade"
                          value={formData.loan_grade}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((grade) => (
                            <option key={grade} value={grade}>
                              Grade {grade}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Loan Amount */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Loan Amount <span className="text-slate-500">($ USD)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="number"
                          name="loan_amnt"
                          min="0"
                          step="any"
                          required
                          value={formData.loan_amnt}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                          placeholder="e.g. 12000"
                        />
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Interest Rate <span className="text-slate-500">(%)</span>
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="number"
                          name="loan_int_rate"
                          min="1"
                          max="40"
                          step="0.01"
                          required
                          value={formData.loan_int_rate}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                          placeholder="e.g. 11.5"
                        />
                      </div>
                    </div>

                    {/* Loan Percent of Income (0 to 1) */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Loan to Income Ratio <span className="text-slate-500">(0.00 to 1.00)</span>
                        </label>
                        <span className="text-xs font-mono text-indigo-400">
                          {((formData.loan_percent_income || 0) * 100).toFixed(1)}% of income
                        </span>
                      </div>
                      <input
                        type="number"
                        name="loan_percent_income"
                        min="0"
                        max="1"
                        step="0.01"
                        required
                        value={formData.loan_percent_income}
                        onChange={handleChange}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="e.g. 0.18"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Represents the loan amount divided by annual income. Calculated automatically as amounts change, or editable manually.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Credit History */}
                <div className="pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> 3. Historical Credit Bureau Data
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Default on file */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Prior Default on File?
                      </label>
                      <div className="relative">
                        <select
                          name="cb_person_default_on_file"
                          value={formData.cb_person_default_on_file}
                          onChange={handleChange}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="N">No (Clean Record)</option>
                          <option value="Y">Yes (Historical Default)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Credit History Length */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Credit History Length <span className="text-slate-500">(years)</span>
                      </label>
                      <input
                        type="number"
                        name="cb_person_cred_hist_length"
                        min="0"
                        max="60"
                        required
                        value={formData.cb_person_cred_hist_length}
                        onChange={handleChange}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                      loading
                        ? 'bg-indigo-600/60 cursor-not-allowed text-indigo-200'
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-indigo-500/25 active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Evaluating Risk via ML Model...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-5 h-5" />
                        <span>Predict Default Risk & Run SHAP XAI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Results Section & Explainable AI (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div
                className={`bg-slate-900/80 border rounded-2xl p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 ${riskTheme.cardBorder} ${riskTheme.glow}`}
              >
                {/* Result Header */}
                <div className="flex items-start justify-between pb-5 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {riskTheme.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                        Underwriting Verdict
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {riskTheme.statusTitle}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${riskTheme.badgeBg}`}
                  >
                    {result.risk_level} Risk
                  </span>
                </div>

                {/* Prediction Text in Sinhala / English */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1">Model Decision</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {result.prediction}
                  </div>
                </div>

                {/* Interactive Risk Speedometer Gauge */}
                <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                  <RiskSpeedometer
                    probability={probNum}
                    riskLevel={result.risk_level}
                  />
                </div>

                {/* AI Explanation (SHAP) Waterfall & Attribution Section */}
                <div className="mt-6 pt-5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-slate-100">
                        AI Explanation (SHAP Factors)
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                      Explainable AI Engine
                    </span>
                  </div>

                  <ShapWaterfallChart
                    explanation={result.explanation}
                    formatFeatureName={formatFeatureName}
                  />
                </div>
              </div>
            ) : (
              /* Placeholder State when no prediction has been executed */
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[360px] backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-indigo-400/80" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  Ready for Risk Evaluation
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  Fill out the 11 applicant parameters on the left or click a sample preset above, then submit to receive real-time default probability and SHAP explainability insights.
                </p>
                <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Powered by XGBoost & TreeSHAP Explainer</span>
                </div>
              </div>
            )}

            {/* Quick System Diagnostics Info Card */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-medium text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" /> Underwriting Guidelines
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-slate-300">Loan % of Income:</strong> Values above 0.35 typically escalate default risk significantly.</li>
                <li><strong className="text-slate-300">Grades:</strong> A to G represent credit risk tiers rated by the institution.</li>
                <li><strong className="text-slate-300">SHAP Values:</strong> Positive values indicate upward pressure on default probability; negative values denote credit protection.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive "What-If" Sensitivity Simulator & Counter-Offers */}
        {result && (
          <WhatIfSimulator
            initialFormData={formData}
            baselineResult={result}
            onApplyTerms={handleApplySimulatedTerms}
            apiUrl={API_URL}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 mt-auto text-center text-xs text-slate-500">
        Credit Risk Assessment & Loan Default Prediction System &bull; Production React + FastAPI XAI Architecture
      </footer>
    </div>
  );
}
