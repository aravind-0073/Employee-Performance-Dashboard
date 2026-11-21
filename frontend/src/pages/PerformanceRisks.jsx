import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  UserCheck,
  Mail,
  Phone,
  FileText,
  Sliders,
  CheckCircle2,
  Calendar,
  PlusCircle,
  TrendingDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { analyticsAPI, employeeAPI, exportAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function PerformanceRisks() {
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Configurable thresholds
  const [showConfig, setShowConfig] = useState(false);
  const [thresholds, setThresholds] = useState({
    performance: 65,
    attendance: 75,
    productivity: 65
  });

  // Action log modal
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [actionType, setActionType] = useState('PIP');
  const [actionNote, setActionNote] = useState('');
  const [loggingAction, setLoggingAction] = useState(false);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getRisks(thresholds);
      if (res.data?.success) {
        setRiskData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load risk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [thresholds.performance, thresholds.attendance, thresholds.productivity]);

  const handleApplyThresholds = (e) => {
    e.preventDefault();
    fetchRisks();
    setShowConfig(false);
  };

  const handleLogAction = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      setLoggingAction(true);
      await employeeAPI.logIntervention(selectedEmp.employeeId, {
        actionType,
        note: actionNote,
        assignedBy: 'HR Manager'
      });
      setSelectedEmp(null);
      setActionNote('');
      fetchRisks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log action');
    } finally {
      setLoggingAction(false);
    }
  };

  const handleDownloadRiskReport = async () => {
    try {
      const res = await exportAPI.exportPerformanceRiskPDF();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'workforce_risk_intervention_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download risk report');
    }
  };

  if (loading && !riskData) {
    return <LoadingSkeleton />;
  }

  const atRiskList = riskData?.atRiskEmployees || [];
  const filteredEmployees = atRiskList.filter((emp) => {
    const matchPriority = priorityFilter === 'All' || emp.priority === priorityFilter;
    const matchSearch =
      !search ||
      emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Automated Underperformance & Risk Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-factor deficit scoring, intervention priority matrix, and automated HR action plans
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Sliders size={14} />
            <span>Thresholds</span>
          </button>
          <button
            onClick={handleDownloadRiskReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <FileText size={14} />
            <span>Risk Report PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Thresholds Config Drawer / Card ───────────────────────────────── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Configure Organizational Risk Thresholds
              </h3>
              <span className="text-[11px] text-slate-400">
                Adjust sensitivity parameters used by the Python detection engine
              </span>
            </div>

            <form onSubmit={handleApplyThresholds} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Performance Score Cutoff: <strong className="text-indigo-600">{thresholds.performance}%</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="80"
                  value={thresholds.performance}
                  onChange={(e) => setThresholds({ ...thresholds, performance: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Attendance Deficit Cutoff: <strong className="text-rose-600">{thresholds.attendance}%</strong>
                </label>
                <input
                  type="range"
                  min="60"
                  max="85"
                  value={thresholds.attendance}
                  onChange={(e) => setThresholds({ ...thresholds, attendance: Number(e.target.value) })}
                  className="w-full accent-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Productivity Velocity Cutoff: <strong className="text-cyan-600">{thresholds.productivity}%</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="80"
                  value={thresholds.productivity}
                  onChange={(e) => setThresholds({ ...thresholds, productivity: Number(e.target.value) })}
                  className="w-full accent-cyan-600"
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Priority Summary Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Critical Priority</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{riskData?.criticalCount || 0}</p>
          <p className="text-[10px] text-slate-500">Immediate PIP Intervention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">High Priority</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{riskData?.highCount || 0}</p>
          <p className="text-[10px] text-slate-500">Manager 1-on-1 & Retraining</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Medium Priority</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{riskData?.mediumCount || 0}</p>
          <p className="text-[10px] text-slate-500">Informal Check-in</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Optimal / Low Risk</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{riskData?.lowCount || 0}</p>
          <p className="text-[10px] text-slate-500">Meeting Expectations</p>
        </div>
      </div>

      {/* ─── Search & Priority Filters ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Filter at-risk employees by name, ID, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['All', 'Critical', 'High', 'Medium'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                priorityFilter === p
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Priority Matrix Cards ────────────────────────────────────────── */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No Employees in This Risk Category
          </h3>
          <p className="text-xs text-slate-500">
            Workforce metrics currently align within safe organizational operational parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEmployees.map((emp) => (
            <motion.div
              key={emp.employeeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                    {emp.employeeName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/employees/${emp.employeeId}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                      >
                        {emp.employeeName}
                      </Link>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {emp.employeeId}
                      </span>
                      <RiskBadge level={emp.priority} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {emp.designation} &bull; <strong className="text-slate-700 dark:text-slate-300">{emp.department}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEmp(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60"
                  >
                    <PlusCircle size={14} />
                    <span>Log Action</span>
                  </button>
                  <Link
                    to={`/employees/${emp.employeeId}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>Full Profile</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Performance</span>
                  <span className={`font-bold ${emp.performanceScore < 60 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {emp.performanceScore}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Productivity</span>
                  <span className={`font-bold ${emp.productivityScore < 60 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {emp.productivityScore}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Attendance</span>
                  <span className={`font-bold ${emp.attendancePercentage < 75 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {emp.attendancePercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Rate</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {emp.targetCompletionRate}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">EPI Rating</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {emp.epi}
                  </span>
                </div>
              </div>

              {/* Risk Factors and Suggested Interventions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Risk Factors */}
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>Trigger Factors:</span>
                  </p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {emp.riskFactors?.map((rf, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Interventions */}
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Suggested Actionable Interventions:</span>
                  </p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {emp.suggestedInterventions?.map((action, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Manager & Contact Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    Manager: <strong className="text-slate-600 dark:text-slate-300">{emp.managerName || 'Unassigned'}</strong>
                  </span>
                  {emp.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {emp.contactEmail}
                    </span>
                  )}
                </div>
                <span className="text-[11px] italic">
                  Note: Indicators assist managerial coaching and should not independently decide employment actions.
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Log Action Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Initiate Action Plan: {selectedEmp.employeeName}
              </h3>
              <form onSubmit={handleLogAction} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Intervention Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="PIP">Initiate Formal 30-Day PIP</option>
                    <option value="Review Meeting">Schedule Performance Review Meeting</option>
                    <option value="Manager 1-on-1">Direct Manager 1-on-1 Discussion</option>
                    <option value="Skill Training">Assign Skill Development Program</option>
                    <option value="Workload Adjustment">Rebalance Sprint Workload</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Action Notes / Target Goals</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Document specific targets, weekly review cadence, and mentor assignments..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEmp(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingAction}
                    className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {loggingAction ? 'Logging...' : 'Confirm Action'}
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
