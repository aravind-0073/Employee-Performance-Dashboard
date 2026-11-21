import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Database,
  BarChart3,
  GitCompare,
  Sparkles,
  RefreshCw,
  Award,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Percent,
  Sliders,
  Compass
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { analyticsAPI } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function DataMiningML() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'eda', 'models', 'predict'
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [mlData, setMlData] = useState(null);
  const [edaData, setEdaData] = useState(null);

  // Prediction Form State
  const [predForm, setPredForm] = useState({
    experience: 4.5,
    attendancePercentage: 92.0,
    workingHours: 42.0,
    trainingHours: 25.0,
    jobSatisfaction: 4.0,
    workload: 3.2,
    department: 'Engineering',
    previousPerformanceRating: 4.0,
    productivityScore: 85.0,
    modelChoice: 'Random Forest'
  });
  const [predResult, setPredResult] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const fetchMLData = async () => {
    try {
      setTraining(true);
      const [modelsRes, edaRes] = await Promise.all([
        analyticsAPI.getMLModels(),
        analyticsAPI.getEDAPlots()
      ]);

      if (modelsRes.data?.success) setMlData(modelsRes.data.data);
      if (edaRes.data?.success) setEdaData(edaRes.data.data);
    } catch (err) {
      console.error('Failed to load ML analysis:', err);
    } finally {
      setLoading(false);
      setTraining(false);
    }
  };

  useEffect(() => {
    fetchMLData();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setPredicting(true);
      const res = await analyticsAPI.predictML(predForm);
      if (res.data?.success) {
        setPredResult(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Prediction calculation failed');
    } finally {
      setPredicting(false);
    }
  };

  if (loading && !mlData) {
    return <LoadingSkeleton />;
  }

  const prep = mlData?.preprocessingReport;
  const bestModel = mlData?.bestModel || 'Random Forest Classifier';

  // Feature Importance data for Recharts
  const featureImpArray = mlData?.featureImportances
    ? Object.entries(mlData.featureImportances)
        .map(([name, value]) => ({ name, importance: Number((value * 100).toFixed(1)) }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="space-y-6">
      {/* ─── Academic Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/60 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Academic Project &bull; Data Analytics & Data Mining
              </span>
              <span className="text-xs text-cyan-400 font-mono">Scikit-learn 1.3+</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Employee Performance Analysis and Prediction Using Data Mining and Machine Learning
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Supervised multi-class classification benchmark comparing Decision Tree, Random Forest, and Logistic Regression on multi-factor workforce operational attributes without target leakage.
            </p>
          </div>

          <button
            onClick={fetchMLData}
            disabled={training}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all self-start md:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Retraining Models...' : 'Retrain Models'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-indigo-900/60">
          {[
            { id: 'overview', label: '1. Dataset & Preprocessing', icon: Database },
            { id: 'eda', label: '2. Exploratory Data Analysis (6 Visualizations)', icon: BarChart3 },
            { id: 'models', label: '3. ML Models & Evaluation', icon: GitCompare },
            { id: 'predict', label: '4. Interactive Performance Prediction', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: DATASET OVERVIEW & PREPROCESSING PIPELINE ─────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Preprocessing Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Raw Records</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{prep?.totalRawRecords || 0}</p>
              <p className="text-[10px] text-slate-500">Ingested Rows</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Missing Handled</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{prep?.missingValuesHandled || 0}</p>
              <p className="text-[10px] text-slate-500">Median/Mode Imputation</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duplicates Cleansed</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{prep?.duplicateRecordsRemoved || 0}</p>
              <p className="text-[10px] text-slate-500">Unique by EmployeeID</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processed ML Corpus</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{prep?.finalProcessedRecords || 0}</p>
              <p className="text-[10px] text-slate-500">Cleaned & Scaled</p>
            </div>
          </div>

          {/* Academic Preprocessing Workflow Description */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Data Mining Preprocessing & Feature Engineering Pipeline</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1. Data Cleansing</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Detects null/NaN entries and applies non-parametric median imputation on continuous variables. Duplicates indexed by primary key are dropped to preserve dataset integrity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">2. Categorical Encoding</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Encodes categorical nominal attributes (<code className="font-mono text-indigo-500">department</code>) into one-hot dummy columns (<code className="font-mono">dept_Engineering</code>, etc.) for linear and tree-based learners.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3. Scaling & Leakage Prevention</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Applies <code className="font-mono">StandardScaler</code> ($z = (x - \mu) / \sigma$). Crucially, transformations are fitted <strong>strictly on the training split</strong> to eliminate data leakage before testing.
                </p>
              </div>
            </div>

            {/* Target Class Distribution */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Target Variable Distribution (3-Class Performance Categories):
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                  <span className="font-bold text-rose-600 block">Low Performance</span>
                  <span className="text-lg font-black text-rose-700 dark:text-rose-300">
                    {prep?.classDistribution?.Low || 0}
                  </span>
                  <span className="block text-[10px] text-slate-400">Score &lt; 65</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <span className="font-bold text-amber-600 block">Medium Performance</span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                    {prep?.classDistribution?.Medium || 0}
                  </span>
                  <span className="block text-[10px] text-slate-400">Score 65 - 79.9</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-600 block">High Performance</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {prep?.classDistribution?.High || 0}
                  </span>
                  <span className="block text-[10px] text-slate-400">Score &ge; 80</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: EXPLORATORY DATA ANALYSIS (6 VISUALIZATIONS) ─────────── */}
      {activeTab === 'eda' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual 1: Employee Performance Level Distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Visualization 1: Performance Level Distribution
                </h3>
                <p className="text-xs text-slate-500">Low, Medium, and High performance class breakdown</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData?.performanceLevelDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {edaData?.performanceLevelDistribution?.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color || '#4f46e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 2: Attendance vs Performance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Visualization 2: Attendance vs Performance
                </h3>
                <p className="text-xs text-slate-500">Correlation scatter between employee presence and evaluation rating</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" dataKey="attendance" name="Attendance %" domain={[50, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="number" dataKey="performance" name="Performance Score" domain={[40, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Scatter name="Employees" data={edaData?.attendanceVsPerformance || []} fill="#06b6d4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 3: Training Hours vs Performance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Visualization 3: Training Hours vs Performance
                </h3>
                <p className="text-xs text-slate-500">Evaluating average performance across training hour investment bands</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData?.trainingHoursVsPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="avgPerformance" name="Avg Performance %" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 4: Experience vs Performance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Visualization 4: Experience vs Performance
                </h3>
                <p className="text-xs text-slate-500">Performance and productivity trends across seniority tiers</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData?.experienceVsPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="experienceBand" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="avgPerformance" name="Avg Performance %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgProductivity" name="Avg Productivity %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 5: Job Satisfaction vs Performance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Visualization 5: Job Satisfaction vs Performance
                </h3>
                <p className="text-xs text-slate-500">Impact of employee workplace engagement on evaluated rating</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData?.jobSatisfactionVsPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="satisfactionLevel" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="avgPerformance" name="Avg Performance %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 6: Department-wise Performance Comparison */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Visualization 6: Department-wise Performance Comparison
                </h3>
                <p className="text-xs text-slate-500">Cross-departmental performance averages and velocity comparison</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData?.departmentPerformanceComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="avgPerformance" name="Avg Performance %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgProductivity" name="Avg Productivity %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ML MODELS & EVALUATION ────────────────────────────────── */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Best Model Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Top Performing Algorithm: {mlData?.bestModel}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {mlData?.bestModelReason}
              </p>
            </div>
          </div>

          {/* Model Comparison Metrics Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Multi-Class Model Performance Comparison (Test Split)
              </h3>
              <span className="text-[11px] text-slate-500">25% Stratified Holdout Test Set</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-center">Precision (Weighted)</th>
                    <th className="py-3 px-4 text-center">Recall (Weighted)</th>
                    <th className="py-3 px-4 text-center">F1-Score (Weighted)</th>
                    <th className="py-3 px-4 text-center">Macro F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {[mlData?.decisionTree, mlData?.randomForest, mlData?.logisticRegression].filter(Boolean).map((m) => {
                    const isWinner = m.modelName === bestModel;
                    return (
                      <tr key={m.modelName} className={isWinner ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {isWinner && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          <span>{m.modelName}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {(m.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">{(m.precisionWeighted * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-center">{(m.recallWeighted * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">
                          {(m.f1Weighted * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">{(m.f1Macro * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3x3 Confusion Matrices for all 3 Algorithms */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Algorithm Confusion Matrices (3 &times; 3 Multi-Class)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Decision Tree', cm: mlData?.decisionTree?.confusionMatrix },
                { title: 'Random Forest', cm: mlData?.randomForest?.confusionMatrix },
                { title: 'Logistic Regression', cm: mlData?.logisticRegression?.confusionMatrix }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</span>
                    <span className="text-[10px] text-slate-400">Actual vs Predicted</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="grid grid-cols-4 gap-1 text-center font-bold text-[10px] text-slate-400">
                      <span></span>
                      <span>P:Low</span>
                      <span>P:Med</span>
                      <span>P:High</span>
                    </div>

                    {['A:Low', 'A:Med', 'A:High'].map((rowLabel, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-4 gap-1 text-center font-medium">
                        <span className="text-[10px] text-slate-400 self-center font-bold">{rowLabel}</span>
                        {(item.cm?.[rIdx] || [0, 0, 0]).map((val, cIdx) => {
                          const isDiag = rIdx === cIdx;
                          return (
                            <div
                              key={cIdx}
                              className={`p-2 rounded-lg font-bold text-xs ${
                                isDiag
                                  ? val > 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800'
                                  : val > 0 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                              }`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Random Forest Feature Importance Analysis */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Random Forest Feature Importance Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Gini impurity reduction across tree splits identifying primary drivers of employee performance
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImpArray} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="importance" name="Relative Importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: INTERACTIVE EMPLOYEE PERFORMANCE PREDICTION ──────────── */}
      {activeTab === 'predict' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Input Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Interactive Employee Performance Classification</span>
              </h3>
              <p className="text-xs text-slate-500">
                Enter operational features to classify performance tier via trained Scikit-learn models
              </p>
            </div>

            <form onSubmit={handlePredict} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Model Selector */}
                <div className="sm:col-span-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Select Classification Model
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Random Forest', 'Decision Tree', 'Logistic Regression'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPredForm({ ...predForm, modelChoice: m })}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          predForm.modelChoice === m
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={predForm.department}
                    onChange={(e) => setPredForm({ ...predForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={predForm.experience}
                    onChange={(e) => setPredForm({ ...predForm, experience: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Attendance Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={predForm.attendancePercentage}
                    onChange={(e) => setPredForm({ ...predForm, attendancePercentage: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Daily Productivity Score</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={predForm.productivityScore}
                    onChange={(e) => setPredForm({ ...predForm, productivityScore: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Weekly Working Hours</label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="80"
                    value={predForm.workingHours}
                    onChange={(e) => setPredForm({ ...predForm, workingHours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Training Hours (L&D)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={predForm.trainingHours}
                    onChange={(e) => setPredForm({ ...predForm, trainingHours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Job Satisfaction (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={predForm.jobSatisfaction}
                    onChange={(e) => setPredForm({ ...predForm, jobSatisfaction: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Workload Level (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={predForm.workload}
                    onChange={(e) => setPredForm({ ...predForm, workload: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Prev Performance (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={predForm.previousPerformanceRating}
                    onChange={(e) => setPredForm({ ...predForm, previousPerformanceRating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={predicting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Cpu className={`w-4 h-4 ${predicting ? 'animate-spin' : ''}`} />
                  <span>{predicting ? 'Computing...' : 'Classify Performance Tier'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Output Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prediction Outcome & Probabilities
              </h3>

              {predResult ? (
                <div className="space-y-4">
                  <div className="text-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Predicted Performance Category
                    </span>
                    <span className={`text-2xl font-black block ${
                      predResult.predictedCategory === 'High' ? 'text-emerald-600 dark:text-emerald-400' :
                      predResult.predictedCategory === 'Low' ? 'text-rose-600 dark:text-rose-400' :
                      'text-amber-600 dark:text-amber-400'
                    }`}>
                      {predResult.predictedCategory} Performance
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Model: {predResult.modelUsed} ({Math.round(predResult.confidence * 100)}% Confidence)
                    </span>
                  </div>

                  {/* Probabilities Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">
                      Class Probability Distribution:
                    </p>
                    {Object.entries(predResult.classProbabilities || {}).map(([c, prob]) => (
                      <div key={c} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span>{c}</span>
                          <span className="font-bold">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              c === 'High' ? 'bg-emerald-500' : c === 'Low' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feature Drivers */}
                  <div className="space-y-1 pt-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">Key Drivers:</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                      {predResult.featureDrivers?.map((d, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1 pt-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">HR Action Plan:</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                      {predResult.recommendations?.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">&bull;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <BrainCircuit className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs">
                    Select attributes and click "Classify Performance Tier" to test the ML prediction pipeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
