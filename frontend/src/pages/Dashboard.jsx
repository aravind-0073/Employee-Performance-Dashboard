import { useEffect, useState } from 'react';
import { 
  BarChart, Bar,
  AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ScatterChart, Scatter, ZAxis, 
  ResponsiveContainer, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Users, TrendingUp, AlertTriangle, Award, Percent, 
  Info, ArrowUpRight, ArrowDownRight, BookOpen, GraduationCap,
  Crown, ShieldAlert, Lightbulb, Activity
} from 'lucide-react';
import KPICard from '../components/KPICard';
import InsightCard from '../components/InsightCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { analyticsAPI, studentAPI, insightsAPI } from '../services/api';

// Interactive Tooltip Component
function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-gray-400 hover:text-cyan transition-colors focus:outline-none p-1 rounded-full hover:bg-gray-100"
        aria-label="Chart Info"
      >
        <Info size={16} />
      </button>
      {visible && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 leading-relaxed text-center pointer-events-none">
          <div className="absolute top-full right-2 border-4 border-transparent border-t-slate-900"></div>
          {text}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [kpiData, setKpiData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [gpaData, setGpaData] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [weakPerformers, setWeakPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [departments, setDepartments] = useState([]);

  // New state for enhanced features
  const [insights, setInsights] = useState([]);
  const [correlation, setCorrelation] = useState(null);
  const [deptRanking, setDeptRanking] = useState([]);
  const [riskSummary, setRiskSummary] = useState(null);
  const [attendanceHistogram, setAttendanceHistogram] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [department, semester, section]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (department) params.department = department;
      if (semester)   params.semester   = semester;
      if (section)    params.section    = section;

      const [kpiRes, attendanceRes, gpaRes, deptRes, subjectRes, scatterRes, topRes, weakRes, insightsRes, correlationRes, rankingRes, riskRes] = await Promise.allSettled([
        analyticsAPI.getKPI(params),
        analyticsAPI.getAttendanceDistribution(params),
        analyticsAPI.getGPADistribution(params),
        analyticsAPI.getDepartmentComparison(),
        analyticsAPI.getSubjectPerformance(params),
        studentAPI.getAll({ ...params, limit: 100 }),
        analyticsAPI.getTopPerformers({ limit: 5, ...params }),
        analyticsAPI.getWeakPerformers({ limit: 5, ...params }),
        insightsAPI.getInsights(params),
        insightsAPI.getCorrelation(params),
        insightsAPI.getDepartmentRanking(),
        insightsAPI.getRiskScores(params),
      ]);

      if (kpiRes.status === 'fulfilled') {
        setKpiData(kpiRes.value.data?.data || kpiRes.value.data);
      } else {
        toast.error('Failed to load KPI data');
      }

      if (attendanceRes.status === 'fulfilled') {
        const att = attendanceRes.value.data?.data || attendanceRes.value.data || {};
        setAttendanceData([
          { name: 'Excellent (≥90%)', value: att.excellent || 0 },
          { name: 'Good (80-90%)', value: att.good || 0 },
          { name: 'Average (75-80%)', value: att.average || 0 },
          { name: 'Poor (<75%)', value: att.poor || 0 },
        ]);
        // Histogram data
        setAttendanceHistogram([
          { range: '90-100%', count: att.excellent || 0, fill: '#10B981' },
          { range: '80-89%', count: att.good || 0, fill: '#0EA5E9' },
          { range: '75-79%', count: att.average || 0, fill: '#F59E0B' },
          { range: '<75%', count: att.poor || 0, fill: '#EF4444' },
        ]);
      }

      if (gpaRes.status === 'fulfilled') {
        const gpa = gpaRes.value.data?.data || gpaRes.value.data || {};
        setGpaData([
          { name: 'Excellent (≥8.5)', value: gpa.excellent || 0 },
          { name: 'Very Good (7.5-8.5)', value: gpa.verygood || 0 },
          { name: 'Good (6.5-7.5)', value: gpa.good || 0 },
          { name: 'Average (5.5-6.5)', value: gpa.average || 0 },
          { name: 'Poor (<5.5)', value: gpa.poor || 0 },
        ]);
      }

      if (deptRes.status === 'fulfilled') {
        const deptList = (deptRes.value.data?.data || deptRes.value.data || []).map(d => d._id);
        setDepartments(deptList);
      }

      if (subjectRes.status === 'fulfilled') {
        const raw = subjectRes.value.data?.data || subjectRes.value.data || {};
        setSubjectData([
          { subject: 'Subject 1', Score: raw.subject1 || 0 },
          { subject: 'Subject 2', Score: raw.subject2 || 0 },
          { subject: 'Subject 3', Score: raw.subject3 || 0 },
          { subject: 'Subject 4', Score: raw.subject4 || 0 },
          { subject: 'Subject 5', Score: raw.subject5 || 0 },
        ]);
      }

      if (scatterRes.status === 'fulfilled') {
        const list = scatterRes.value.data?.data || [];
        setScatterData(list.map(s => ({
          name: s.studentName,
          attendance: s.attendancePercentage,
          gpa: s.gpa,
          usn: s.usn
        })));
      }

      if (topRes.status === 'fulfilled') {
        setTopPerformers(topRes.value.data?.data || topRes.value.data || []);
      }

      if (weakRes.status === 'fulfilled') {
        setWeakPerformers(weakRes.value.data?.data || weakRes.value.data || []);
      }

      // New data
      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data?.data || []);
      }

      if (correlationRes.status === 'fulfilled') {
        setCorrelation(correlationRes.value.data?.data || null);
      }

      if (rankingRes.status === 'fulfilled') {
        setDeptRanking(rankingRes.value.data?.data || []);
      }

      if (riskRes.status === 'fulfilled') {
        setRiskSummary(riskRes.value.data?.summary || null);
      }

    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0EA5E9', '#A855F7', '#10B981', '#F59E0B', '#EF4444'];

  // Derived: best and worst departments
  const bestDept = deptRanking.length > 0 ? deptRanking[0] : null;
  const worstDept = deptRanking.length > 1 ? deptRanking[deptRanking.length - 1] : null;

  if (loading) return <LoadingSkeleton count={5} />;

  return (
    <div className="space-y-8">
      {/* Filters Panel */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:bg-white text-sm font-medium text-slate-700 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:bg-white text-sm font-medium text-slate-700 transition-all cursor-pointer"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan focus:bg-white text-sm font-medium text-slate-700 transition-all cursor-pointer"
          >
            <option value="">All Sections</option>
            {['A','B','C'].map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {(department || semester || section) && (
          <div className="flex flex-col gap-1.5 self-end">
            <button
              onClick={() => { setDepartment(''); setSemester(''); setSection(''); }}
              className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl text-sm font-bold transition-all border border-slate-200 hover:border-red-200 flex items-center gap-1.5"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid — Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={kpiData?.totalStudents || 0}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Average Attendance"
          value={`${kpiData?.averageAttendance || 0}%`}
          icon={Percent}
          color="green"
        />
        <KPICard
          title="Average GPA"
          value={kpiData?.averageGPA || 0}
          icon={Award}
          color="purple"
        />
        <KPICard
          title="Detained Students"
          value={kpiData?.detainedCount || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* KPI Cards Grid — Row 2 (NEW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Best Performing Dept"
          value={bestDept?.department || 'N/A'}
          subtitle={bestDept ? `GPA: ${bestDept.mean_gpa} | Att: ${bestDept.mean_attendance}%` : ''}
          icon={Crown}
          color="green"
        />
        <KPICard
          title="Needs Attention"
          value={worstDept?.department || 'N/A'}
          subtitle={worstDept ? `GPA: ${worstDept.mean_gpa} | Att: ${worstDept.mean_attendance}%` : ''}
          icon={ShieldAlert}
          color="orange"
        />
        <KPICard
          title="Academic Risk Students"
          value={riskSummary ? riskSummary.high_risk + riskSummary.medium_risk : 0}
          subtitle={riskSummary ? `High: ${riskSummary.high_risk} | Medium: ${riskSummary.medium_risk}` : ''}
          icon={Activity}
          color="red"
        />
        <KPICard
          title="Average Subject Marks"
          value={`${kpiData?.averageMarks || 0} / 100`}
          icon={BookOpen}
          color="cyan"
        />
      </div>

      {/* Academic Insights Section (NEW) */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={20} className="text-amber-500" />
            <h3 className="text-lg font-bold text-navy">Academic Insights</h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Auto-generated
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Row 1: Attendance Histogram & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution Histogram (NEW) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy">Attendance Distribution</h3>
            <InfoTooltip text="Histogram showing student counts across attendance brackets. Below 75% triggers academic detention." />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceHistogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [`${value} students`, 'Count']}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {attendanceHistogram.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Performance Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy">Subject Performance Overview</h3>
            <InfoTooltip text="Plots the average student scores across the five core curriculum subjects. Helps quickly identify academic areas that require focus." />
          </div>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Avg Marks" dataKey="Score" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Row 2: GPA Distribution & GPA vs Attendance Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPA Distribution Gradient Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy">GPA Distribution</h3>
            <InfoTooltip text="Displays the spread of student populations across major academic GPA bands. High density in Excellent indicates strong overall performance." />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={gpaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* GPA vs Attendance Scatter Plot with Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-navy">GPA vs. Attendance Correlation</h3>
            <InfoTooltip text="Plots individual student records to display the correlation between classroom attendance (X-axis) and GPA (Y-axis)." />
          </div>
          {/* Correlation Badge (NEW) */}
          {correlation && (
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                correlation.strength === 'Strong' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                correlation.strength === 'Moderate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                r = {correlation.coefficient}
              </span>
              <span className="text-xs text-slate-500 font-medium">{correlation.label}</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="number" dataKey="gpa" name="GPA" domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <ZAxis type="category" dataKey="name" name="Name" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
                        <p className="font-bold text-cyan-400">{data.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">USN: {data.usn}</p>
                        <div className="mt-2 space-y-0.5 font-semibold">
                          <p>Attendance: <span className="text-emerald-400">{data.attendance}%</span></p>
                          <p>GPA: <span className="text-purple-400">{data.gpa}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Students" data={scatterData} fill="#0EA5E9" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
          {/* Correlation Interpretation (NEW) */}
          {correlation && correlation.interpretation && (
            <p className="text-xs text-slate-500 mt-2 italic px-1">{correlation.interpretation}</p>
          )}
        </motion.div>
      </div>

      {/* Row 3: Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md p-6 text-white flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-85">Pass Percentage</p>
            <p className="text-3xl font-extrabold mt-2">{kpiData?.passPercentage || 0}%</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <GraduationCap size={24} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-md p-6 text-white flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-85">Fail Percentage</p>
            <p className="text-3xl font-extrabold mt-2">{kpiData?.failPercentage || 0}%</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-md p-6 text-white flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-85">Correlation (Att × GPA)</p>
            <p className="text-3xl font-extrabold mt-2">{correlation?.coefficient ?? '—'}</p>
            <p className="text-xs mt-1 opacity-80">{correlation?.label || ''}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </motion.div>
      </div>

      {/* Row 4: Top Performers & Weak/At-Risk Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers Card List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Top Performing Students
            </h3>
            <InfoTooltip text="Lists the highest performing students in terms of GPA, sorted descending." />
          </div>
          <div className="space-y-4 flex-1">
            {topPerformers.length > 0 ? (
              topPerformers.map((student, idx) => (
                <div key={student.usn} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{student.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{student.usn} | Sem {student.semester} - Sec {student.section}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        GPA {student.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full" style={{ width: `${student.gpa * 10}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">No top performers found.</p>
            )}
          </div>
        </motion.div>

        {/* Weak/At-Risk Performers Card List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Academically At-Risk Students
            </h3>
            <InfoTooltip text="Lists students with the lowest GPAs who require immediate academic attention and advising support." />
          </div>
          <div className="space-y-4 flex-1">
            {weakPerformers.length > 0 ? (
              weakPerformers.map((student, idx) => (
                <div key={student.usn} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{student.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{student.usn} | Sem {student.semester} - Sec {student.section}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                        GPA {student.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-gradient-to-r from-rose-400 to-red-500 h-full rounded-full" style={{ width: `${student.gpa * 10}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">No at-risk students found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
