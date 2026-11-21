import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Trophy,
  Users,
  Award,
  TrendingUp,
  Clock,
  Target,
  ArrowUpRight,
  ShieldAlert,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { analyticsAPI, employeeAPI } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import RiskBadge from '../components/RiskBadge';
import { Link } from 'react-router-dom';

export default function DepartmentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptName, setSelectedDeptName] = useState(null);
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getDepartments();
      if (res.data?.success) {
        setDepartments(res.data.data);
        if (res.data.data.length > 0 && !selectedDeptName) {
          setSelectedDeptName(res.data.data[0].department);
        }
      }
    } catch (err) {
      console.error('Failed to load department benchmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentEmployees = async (deptName) => {
    try {
      setLoadingEmployees(true);
      const res = await employeeAPI.getAll({ department: deptName, limit: 50, sortBy: 'performanceScore', sortOrder: 'desc' });
      if (res.data?.success) {
        setDeptEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dept employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDeptName) {
      fetchDepartmentEmployees(selectedDeptName);
    }
  }, [selectedDeptName]);

  if (loading && departments.length === 0) {
    return <LoadingSkeleton />;
  }

  const selectedDeptObj = departments.find(d => d.department === selectedDeptName) || departments[0];

  const radarBenchmark = selectedDeptObj ? [
    { metric: 'Performance', value: selectedDeptObj.averagePerformance, fullMark: 100 },
    { metric: 'Productivity', value: selectedDeptObj.averageProductivity, fullMark: 100 },
    { metric: 'Attendance', value: selectedDeptObj.averageAttendance, fullMark: 100 },
    { metric: 'Target Rate', value: selectedDeptObj.averageTargetAchievement, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Departmental Benchmarking & Multi-Criteria Ranking</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Objective ranking: Score = (40% &times; Performance) + (30% &times; Productivity) + (20% &times; Attendance) + (10% &times; Target)
          </p>
        </div>
      </div>

      {/* ─── Department Ranking Leaderboard Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, idx) => {
          const isSelected = dept.department === selectedDeptName;
          return (
            <motion.div
              key={dept.department}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDeptName(dept.department)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                      dept.rank === 1
                        ? 'bg-amber-400 text-slate-900'
                        : dept.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : dept.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      #{dept.rank}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {dept.department}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    Lead: {dept.manager || 'Department Head'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Composite Score</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {dept.compositeScore}%
                  </p>
                </div>
              </div>

              {/* Department Key Metrics Grid */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Headcount</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{dept.headcount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Perf.</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{dept.averagePerformance}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Prod.</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{dept.averageProductivity}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Attn.</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{dept.averageAttendance}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Comparative Visualizations Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Department Comparative Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cross-Departmental Performance & Efficiency Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating composite scores, performance averages, and productivity
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="compositeScore" name="Composite Score %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="averagePerformance" name="Avg Performance %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="averageProductivity" name="Avg Productivity %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Department Radar Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedDeptObj?.department} Profile
            </h3>
            <p className="text-xs text-slate-500">
              Rank #{selectedDeptObj?.rank} &bull; Score: {selectedDeptObj?.compositeScore}%
            </p>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarBenchmark}>
                <PolarGrid stroke="#334155" opacity={0.2} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Department Metric" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Department Roster Table ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedDeptObj?.department} Workforce Roster & Individual Rankings
            </h3>
            <p className="text-xs text-slate-500">
              Sorted by evaluated performance score
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {deptEmployees.length} Employees
          </span>
        </div>

        {loadingEmployees ? (
          <div className="py-8"><LoadingSkeleton /></div>
        ) : deptEmployees.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No employee records in this department.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3 text-center">Experience</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Productivity</th>
                  <th className="py-2.5 px-3 text-center">Performance</th>
                  <th className="py-2.5 px-3 text-center">EPI Rating</th>
                  <th className="py-2.5 px-3 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {deptEmployees.map((emp, idx) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/employees/${emp.employeeId}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                      >
                        {emp.employeeName}
                      </Link>
                      <span className="block text-[10px] text-slate-400">{emp.employeeId}</span>
                    </td>
                    <td className="py-2.5 px-3">{emp.designation}</td>
                    <td className="py-2.5 px-3 text-center">{emp.experience} yrs</td>
                    <td className="py-2.5 px-3 text-center">{emp.attendancePercentage}%</td>
                    <td className="py-2.5 px-3 text-center">{emp.productivityScore}%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {emp.performanceScore}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-black">{emp.epi}</td>
                    <td className="py-2.5 px-3 text-center">
                      <RiskBadge level={emp.riskLevel || 'Low'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
