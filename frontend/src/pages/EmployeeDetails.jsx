import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Edit,
  PlusCircle,
  FileText,
  UserCheck,
  Zap,
  BarChart2,
  Smile,
  Activity,
  History
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { employeeAPI, analyticsAPI, exportAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function EmployeeDetails() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [deepDive, setDeepDive] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intervention modal
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [actionType, setActionType] = useState('Review Meeting');
  const [actionNote, setActionNote] = useState('');
  const [loggingAction, setLoggingAction] = useState(false);

  // Edit employee modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [empRes, predRes, deepRes] = await Promise.all([
        employeeAPI.getById(employeeId),
        analyticsAPI.getPrediction(employeeId).catch(() => ({ data: { success: false } })),
        analyticsAPI.getDeepDive(employeeId).catch(() => ({ data: { success: false } }))
      ]);

      if (empRes.data?.success) {
        setEmployee(empRes.data.data);
        setEditForm(empRes.data.data);
      }
      if (predRes.data?.success) {
        setPrediction(predRes.data.data);
      }
      if (deepRes.data?.success) {
        setDeepDive(deepRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [employeeId]);

  const handleLogIntervention = async (e) => {
    e.preventDefault();
    try {
      setLoggingAction(true);
      await employeeAPI.logIntervention(employeeId, {
        actionType,
        note: actionNote,
        assignedBy: 'HR Manager'
      });
      setShowInterventionModal(false);
      setActionNote('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log intervention');
    } finally {
      setLoggingAction(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await employeeAPI.update(employeeId, editForm);
      if (res.data?.success) {
        setShowEditModal(false);
        fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadAppraisalPDF = async () => {
    try {
      const res = await exportAPI.exportEmployeeAppraisalPDF(employeeId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appraisal_${employeeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download appraisal report');
    }
  };

  if (loading && !employee) {
    return <LoadingSkeleton />;
  }

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Employee Not Found</h3>
        <p className="text-xs text-slate-500">Employee ID {employeeId} does not exist in your organization dataset.</p>
        <Link to="/employees" className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
          Back to Directory
        </Link>
      </div>
    );
  }

  const radarData = deepDive?.radarScores ? [
    { subject: 'Productivity', score: deepDive.radarScores.Productivity, fullMark: 100 },
    { subject: 'Quality', score: deepDive.radarScores.Quality, fullMark: 100 },
    { subject: 'Attendance', score: deepDive.radarScores.Attendance, fullMark: 100 },
    { subject: 'Target Completion', score: deepDive.radarScores.TargetAchievement, fullMark: 100 },
    { subject: 'Task Velocity', score: deepDive.radarScores.TaskCompletion, fullMark: 100 },
  ] : [
    { subject: 'Productivity', score: employee.productivityScore, fullMark: 100 },
    { subject: 'Quality', score: employee.qualityScore || 80, fullMark: 100 },
    { subject: 'Attendance', score: employee.attendancePercentage, fullMark: 100 },
    { subject: 'Target Completion', score: employee.targetCompletionRate || 85, fullMark: 100 },
    { subject: 'Task Velocity', score: Math.min(100, (employee.tasksCompleted || 0) * 5), fullMark: 100 },
  ];

  const barMetrics = [
    { name: 'Productivity', value: employee.productivityScore, fill: '#06b6d4' },
    { name: 'Deliverable Quality', value: employee.qualityScore || 80, fill: '#6366f1' },
    { name: 'Attendance', value: employee.attendancePercentage, fill: '#10b981' },
    { name: 'Target Achievement', value: employee.targetCompletionRate || 85, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Employee Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setShowInterventionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Log HR Intervention</span>
          </button>
          <button
            onClick={handleDownloadAppraisalPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <FileText size={14} />
            <span>Appraisal PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Profile Header Card ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {employee.employeeName[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {employee.employeeName}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {employee.employeeId}
                </span>
                <RiskBadge level={employee.riskLevel || 'Low'} />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {employee.status || 'Active'}
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {employee.designation} &bull; <span className="text-slate-600 dark:text-slate-300">{employee.department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Manager: <strong className="text-slate-700 dark:text-slate-300">{employee.managerName || 'Unassigned'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Tenure: <strong className="text-slate-700 dark:text-slate-300">{employee.experience} yrs</strong>
                </span>
                {employee.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {employee.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Composite EPI Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 text-center md:min-w-[180px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Employee Performance Index (EPI)
            </p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {employee.epi || '--'}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
              Category: {employee.performanceCategory || 'Average'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Workforce Percentile: {deepDive?.workforcePercentile || 75}%
            </p>
          </div>
        </div>

        {/* Skills Tags */}
        {employee.skills && employee.skills.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Skills:</span>
            {employee.skills.map((skill, idx) => (
              <span key={idx} className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Metric Highlight Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performance Score</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{employee.performanceScore}%</p>
          <p className="text-[10px] text-slate-500">Evaluated Rating</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Productivity Score</p>
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{employee.productivityScore}%</p>
          <p className="text-[10px] text-slate-500">Daily Execution Velocity</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Rate</p>
          <p className={`text-2xl font-extrabold ${employee.attendancePercentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {employee.attendancePercentage}%
          </p>
          <p className="text-[10px] text-slate-500">Workplace Presence</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deliverable Quality</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{employee.qualityScore || 80}%</p>
          <p className="text-[10px] text-slate-500">Accuracy & Low Rework</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Achievement</p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{employee.targetCompletionRate || 85}%</p>
          <p className="text-[10px] text-slate-500">Milestone Deadlines Met</p>
        </div>
      </div>

      {/* ─── Academic ML Input Attributes Grid ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Data Mining & Machine Learning Operational Attributes
            </h3>
          </div>
          <Link to="/ml-analytics" className="text-xs font-bold text-indigo-600 hover:underline">
            View in ML Engine &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Weekly Working Hours</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{employee.workingHours || 40} hrs/wk</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Training Hours (L&D)</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{employee.trainingHours || 20} hrs</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Job Satisfaction</span>
            <span className="text-base font-bold text-amber-500">{employee.jobSatisfaction || 3.8} / 5.0</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Workload Level</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{employee.workload || 3.2} / 5.0</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Previous Rating</span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{employee.previousPerformanceRating || 3.5} / 5.0</span>
          </div>
        </div>
      </div>

      {/* ─── Machine Learning Performance Forecast Card ──────────────────── */}
      {prediction && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/60 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/50 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Machine Learning Predictive Performance Engine
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Scikit-learn Linear Regression (R² Confidence: {prediction.confidenceScore})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs text-indigo-200">Predicted Expected Score</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-cyan-400">
                  {prediction.predictedPerformance}%
                </span>
                <span className="text-xs text-slate-300">
                  Actual: <strong className="text-white">{prediction.actualPerformance}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Model Trend:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  prediction.trend === 'Positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                  prediction.trend === 'Negative' ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                }`}>
                  {prediction.trend} ({prediction.performanceDelta > 0 ? `+${prediction.performanceDelta}` : prediction.performanceDelta} pts)
                </span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Forecast Synthesis</p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {prediction.forecastSummary}
              </p>
              {prediction.keyDrivers && prediction.keyDrivers.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {prediction.keyDrivers.map((driver, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-900/40 border border-indigo-700/50 text-indigo-200 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      {driver}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Visualizations: Radar & Metric Breakdown ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Multi-Criteria Performance Radar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Balanced 5-axis visualization of employee contribution
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.2} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Employee Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Operational Input Benchmark
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative rating against 100% optimum targets
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barMetrics.map((entry, idx) => (
                    <Bar key={`bar-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Dynamic Strengths, Weaknesses & Recommendations ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Demonstrated Strengths</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {(deepDive?.strengths || ['Consistent contributor across responsibilities']).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">&bull;</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Areas for Growth</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {(deepDive?.weaknesses || ['No critical performance gaps detected']).map((wk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">&bull;</span>
                <span>{wk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Lightbulb size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">HR & Managerial Coaching</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {(deepDive?.actionableRecommendations || ['Schedule standard periodic quarterly review']).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">&bull;</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Logged Interventions History ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Managerial Interventions & Performance Review Log
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of PIPs, 1-on-1s, and coaching interventions
            </p>
          </div>
          <button
            onClick={() => setShowInterventionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            <PlusCircle size={14} />
            <span>Add Action</span>
          </button>
        </div>

        {employee.interventions && employee.interventions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {employee.interventions.map((item, idx) => (
              <div key={item._id || idx} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {item.actionType}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Logged by {item.assignedBy || 'HR Manager'} &bull; {new Date(item.actionDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3">No interventions logged for this employee yet.</p>
        )}
      </div>

      {/* ─── Log Intervention Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showInterventionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log HR / Managerial Intervention
              </h3>
              <form onSubmit={handleLogIntervention} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intervention Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Review Meeting">Review Meeting</option>
                    <option value="PIP">Formal 30-Day PIP</option>
                    <option value="Manager 1-on-1">Manager 1-on-1 Alignment</option>
                    <option value="Skill Training">Technical / Skill Training</option>
                    <option value="Workload Adjustment">Workload Adjustment</option>
                    <option value="Note">General HR Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intervention Notes / Plan
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter discussion notes, targets, or scheduled follow-ups..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInterventionModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingAction}
                    className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {loggingAction ? 'Saving...' : 'Save Intervention'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Edit Employee Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Employee Profile: {employee.employeeName}
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={editForm.employeeName}
                      onChange={(e) => setEditForm({ ...editForm, employeeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Performance Score (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editForm.performanceScore}
                      onChange={(e) => setEditForm({ ...editForm, performanceScore: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Productivity Score (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editForm.productivityScore}
                      onChange={(e) => setEditForm({ ...editForm, productivityScore: parseFloat(e.target.value) })}
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
                      value={editForm.workingHours || 40}
                      onChange={(e) => setEditForm({ ...editForm, workingHours: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Training Hours</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.trainingHours || 20}
                      onChange={(e) => setEditForm({ ...editForm, trainingHours: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Job Satisfaction (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editForm.jobSatisfaction || 3.8}
                      onChange={(e) => setEditForm({ ...editForm, jobSatisfaction: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Workload (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editForm.workload || 3.2}
                      onChange={(e) => setEditForm({ ...editForm, workload: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    {savingEdit ? 'Saving...' : 'Update Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
