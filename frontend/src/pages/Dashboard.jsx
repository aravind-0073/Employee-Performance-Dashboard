import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  TrendingUp,
  Clock,
  Target,
  ShieldAlert,
  Star,
  RefreshCw,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { analyticsAPI, employeeAPI } from '../services/api';
import KPICard from '../components/KPICard';
import InsightCard from '../components/InsightCard';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchDashboardData = async (dept = selectedDept) => {
    try {
      setRefreshing(true);
      const params = dept !== 'All' ? { department: dept } : {};

      const [kpiRes, insRes, distRes, empRes] = await Promise.all([
        analyticsAPI.getKPI(params),
        analyticsAPI.getInsights(params),
        analyticsAPI.getDistributions(params),
        employeeAPI.getAll({ limit: 1 })
      ]);

      if (kpiRes.data?.success) setKpis(kpiRes.data.data);
      if (insRes.data?.success) setInsightsData(insRes.data.data);
      if (distRes.data?.success) setDistributions(distRes.data.data);
      if (empRes.data?.filters?.departments) setDepartments(empRes.data.filters.departments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDept);
  }, [selectedDept]);

  if (loading && !kpis) {
    return <LoadingSkeleton />;
  }

  const isDataEmpty = !kpis || kpis.totalEmployees === 0;

  return (
    <div className="space-y-6">
      {/* ─── Page Header & Department Filter ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Workforce Performance & KPI Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-metric workforce analytics and statistical correlation evaluation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchDashboardData(selectedDept)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {isDataEmpty ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Employee Dataset Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload an Excel or CSV dataset with employee records to populate real-time KPIs, AI correlations, and departmental benchmarks.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            Go to Dataset Ingestion
          </Link>
        </div>
      ) : (
        <>
          {/* ─── Executive KPI Cards Grid (7 Key Metrics) ──────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
            <KPICard
              title="Headcount"
              value={kpis.totalEmployees}
              subtitle="Active Workforce"
              icon={Users}
              color="indigo"
            />
            <KPICard
              title="Avg Performance"
              value={`${kpis.averagePerformance}%`}
              subtitle="Target: 80%"
              icon={Award}
              color="emerald"
            />
            <KPICard
              title="Avg Attendance"
              value={`${kpis.averageAttendance}%`}
              subtitle="Presence Rate"
              icon={Clock}
              color="cyan"
            />
            <KPICard
              title="Productivity"
              value={`${kpis.averageProductivity}%`}
              subtitle="Daily Velocity"
              icon={TrendingUp}
              color="indigo"
            />
            <KPICard
              title="Target Rate"
              value={`${kpis.averageTargetAchievement}%`}
              subtitle="Milestones Met"
              icon={Target}
              color="purple"
            />
            <KPICard
              title="High Performers"
              value={kpis.highPerformersCount}
              subtitle="Score ≥ 80%"
              icon={Star}
              color="emerald"
            />
            <KPICard
              title="Underperforming"
              value={kpis.underperformingCount}
              subtitle="Action Required"
              icon={ShieldAlert}
              color="rose"
            />
          </div>

          {/* ─── Dynamic AI / Statistical Insights Cards ──────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Dynamic AI & Statistical Workforce Intelligence</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated Pearson correlation testing and cross-departmental trend synthesis
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                SciPy & Scikit-learn
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {insightsData?.insights?.map((item, idx) => (
                <InsightCard key={item.id || idx} insight={item} index={idx} />
              ))}
            </div>
          </div>

          {/* ─── Interactive Charts Row 1: Distributions ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Distribution Histogram */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Employee Performance Distribution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Segmented from Poor (&lt;50) to Excellent (85-100)
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributions?.performanceDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val} employees (${item.payload.percentage}%)`, 'Headcount']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distributions?.performanceDistribution?.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color || '#4f46e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Category Ratio Donut */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Employee Performance Index (EPI) Ratio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weighted composite efficiency tiers
                </p>
              </div>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributions?.categoryRatios || []}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {distributions?.categoryRatios?.map((entry, idx) => (
                        <Cell key={`cat-${idx}`} fill={entry.color || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val} employees (${item.payload.percentage}%)`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ─── Interactive Charts Row 2: Department Comparisons & Scatter ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Comparison Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Department-Level Performance vs Productivity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Multi-metric benchmarking across functional units
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributions?.departmentComparisons || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="avgPerformance" name="Avg Performance %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgProductivity" name="Avg Productivity %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgAttendance" name="Avg Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workforce Attendance Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Critical attendance deficit threshold detection (&lt;75%)
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributions?.attendanceDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val} employees (${item.payload.percentage}%)`, 'Headcount']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distributions?.attendanceDistribution?.map((entry, idx) => (
                        <Cell key={`att-${idx}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ─── Leaderboards: Top 10 Performers & Bottom 10 Underperformers ─ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 High Performers Leaderboard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Top 10 High-Performing Talent</span>
                  </h3>
                  <p className="text-xs text-slate-500">Highest evaluated performance rankings</p>
                </div>
                <Link to="/employees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                  <span>View All</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-right">Perf. Score</th>
                      <th className="py-2.5 px-3 text-right">EPI Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {distributions?.top10Performers?.map((emp, idx) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <Link to={`/employees/${emp.employeeId}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {emp.employeeName}
                          </Link>
                          <span className="block text-[10px] text-slate-400">{emp.designation}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{emp.department}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {emp.performanceScore}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-200">
                          {emp.epi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom 10 Underperformers / Risk Attention */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Underperforming & Risk Watchlist</span>
                  </h3>
                  <p className="text-xs text-slate-500">Employees requiring immediate managerial coaching</p>
                </div>
                <Link to="/performance-risks" className="text-xs font-semibold text-rose-600 hover:text-rose-500 flex items-center gap-1">
                  <span>Risk Center</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center">Priority</th>
                      <th className="py-2.5 px-3 text-right">Perf. Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {distributions?.bottom10Performers?.map((emp, idx) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <Link to={`/employees/${emp.employeeId}`} className="font-bold text-slate-800 dark:text-slate-200 hover:underline">
                            {emp.employeeName}
                          </Link>
                          <span className="block text-[10px] text-slate-400">{emp.designation}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{emp.department}</td>
                        <td className="py-2.5 px-3 text-center">
                          <RiskBadge level={emp.riskLevel || 'Medium'} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          {emp.performanceScore}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
