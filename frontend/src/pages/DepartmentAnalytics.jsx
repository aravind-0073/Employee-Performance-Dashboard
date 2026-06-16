import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Trophy, Medal, Users, TrendingUp, AlertTriangle, Percent, GraduationCap } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { analyticsAPI, insightsAPI } from '../services/api';

export default function DepartmentAnalytics() {
  const [departmentData, setDepartmentData] = useState(null);
  const [semesterData, setSemesterData] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [deptRanking, setDeptRanking] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDept]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = selectedDept ? { department: selectedDept } : {};

      const [deptRes, semesterRes, rankingRes] = await Promise.allSettled([
        analyticsAPI.getDepartmentComparison(),
        analyticsAPI.getSemesterComparison(params),
        insightsAPI.getDepartmentRanking(),
      ]);

      if (deptRes.status === 'fulfilled') {
        const deptList = deptRes.value.data?.data || deptRes.value.data || [];
        setDepartmentData(deptList);
        // NOTE: No auto-selection — user can stay on "Compare All Departments"
      } else {
        toast.error('Failed to load department data');
      }

      if (semesterRes.status === 'fulfilled') {
        setSemesterData(semesterRes.value.data?.data || semesterRes.value.data || []);
      }

      if (rankingRes.status === 'fulfilled') {
        setDeptRanking(rankingRes.value.data?.data || []);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={3} />;

  // Find selected department ranking entry
  const selectedRanking = deptRanking.find(r => r.department === selectedDept);

  return (
    <div className="space-y-6">
      {/* Department Filter */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <label className="block text-sm font-semibold text-navy mb-3">
          Select Department
        </label>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
        >
          <option value="">-- Compare All Departments --</option>
          {departmentData?.map(dept => (
            <option key={dept._id} value={dept._id}>
              {dept._id} ({dept.totalStudents} students)
            </option>
          ))}
        </select>
      </motion.div>

      {/* Department Ranking Table */}
      {deptRanking.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-navy">Department Performance Ranking</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Weighted formula: 40% GPA + 30% Attendance + 20% Pass% + 10% Detention Rate (inv.)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-t border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Avg GPA</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Att%</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Pass%</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Detained</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Top Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptRanking.map((dept, index) => (
                  <motion.tr
                    key={dept.department}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-blue-50/50 transition-colors ${selectedDept === dept.department ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {dept.rank === 1 ? <span className="text-lg">🥇</span> :
                         dept.rank === 2 ? <span className="text-lg">🥈</span> :
                         dept.rank === 3 ? <span className="text-lg">🥉</span> :
                         <span className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">{dept.rank}</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-navy text-sm">{dept.department}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm font-extrabold ${
                        dept.weighted_score >= 80 ? 'text-emerald-600' :
                        dept.weighted_score >= 60 ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {dept.weighted_score}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium text-slate-600">{dept.total_students}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-purple-600">{dept.mean_gpa}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-cyan-600">{dept.mean_attendance}%</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        dept.pass_percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        dept.pass_percentage >= 60 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {dept.pass_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        dept.detained_count === 0 ? 'bg-emerald-50 text-emerald-700' :
                        dept.detained_count <= 5 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {dept.detained_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{dept.top_student?.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">GPA: {dept.top_student?.gpa}</p>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Department Stats Cards for selected dept */}
      {selectedDept && selectedRanking && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: 'Students', value: selectedRanking.total_students, icon: Users, gradient: 'from-cyan-400 to-cyan-600' },
            { label: 'Avg GPA', value: selectedRanking.mean_gpa, icon: TrendingUp, gradient: 'from-purple-400 to-purple-600' },
            { label: 'Avg Attendance', value: `${selectedRanking.mean_attendance}%`, icon: Percent, gradient: 'from-green-400 to-green-600' },
            { label: 'Pass %', value: `${selectedRanking.pass_percentage}%`, icon: GraduationCap, gradient: 'from-emerald-400 to-emerald-600' },
            { label: 'Fail %', value: `${selectedRanking.fail_percentage}%`, icon: AlertTriangle, gradient: 'from-rose-400 to-rose-600' },
            { label: 'Detained', value: selectedRanking.detained_count, icon: AlertTriangle, gradient: 'from-red-400 to-red-600' },
            { label: 'Avg Marks', value: selectedRanking.avg_subject_marks, icon: Medal, gradient: 'from-amber-400 to-amber-600' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-br ${item.gradient} rounded-xl shadow-md p-4 text-white`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={14} className="opacity-80" />
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{item.label}</p>
                </div>
                <p className="text-xl font-extrabold">{item.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Department Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-bold text-navy mb-4">Department Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="totalStudents" fill="#0EA5E9" name="Total Students" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="averageGPA" fill="#A855F7" name="Avg GPA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Semester Analysis — TWO SEPARATE LINE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average GPA Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-bold text-navy mb-1">
            Semester-wise GPA {selectedDept && `(${selectedDept})`}
          </h3>
          <p className="text-xs text-slate-400 mb-4">Scale: 0 – 10</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={semesterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" label={{ value: 'Semester', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [value?.toFixed(2), 'Avg GPA']}
              />
              <Legend />
              <Line type="monotone" dataKey="averageGPA" stroke="#0EA5E9" strokeWidth={3} name="Avg GPA" dot={{ r: 5, fill: '#0EA5E9' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Average Attendance Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-bold text-navy mb-1">
            Semester-wise Attendance {selectedDept && `(${selectedDept})`}
          </h3>
          <p className="text-xs text-slate-400 mb-4">Scale: 0% – 100%</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={semesterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" label={{ value: 'Semester', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [`${value?.toFixed(2)}%`, 'Avg Attendance']}
              />
              <Legend />
              <Line type="monotone" dataKey="averageAttendance" stroke="#A855F7" strokeWidth={3} name="Avg Attendance" dot={{ r: 5, fill: '#A855F7' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
