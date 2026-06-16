import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { AlertTriangle, Download, FileText, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import RiskBadge from '../components/RiskBadge';
import { analyticsAPI, insightsAPI, exportAPI } from '../services/api';

export default function DetainedStudents() {
  const [detainedStudents, setDetainedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // New state
  const [priorityData, setPriorityData] = useState([]);
  const [prioritySummary, setPrioritySummary] = useState(null);
  const [expandedUSN, setExpandedUSN] = useState(null);

  useEffect(() => {
    fetchDetainedStudents();
  }, [department]);

  const fetchDetainedStudents = async () => {
    try {
      setLoading(true);
      const params = department ? { department } : {};

      const [detainedRes, priorityRes] = await Promise.allSettled([
        analyticsAPI.getDetainedAnalysis(params),
        insightsAPI.getDetentionPriority(params)
      ]);

      if (detainedRes.status === 'fulfilled') {
        setDetainedStudents(detainedRes.value.data.data.students);
        if (departments.length === 0) {
          const uniqueDepts = [...new Set(detainedRes.value.data.data.students.map(s => s.department))];
          setDepartments(uniqueDepts);
        }
      }

      if (priorityRes.status === 'fulfilled') {
        setPriorityData(priorityRes.value.data?.data || []);
        setPrioritySummary(priorityRes.value.data?.summary || null);
      }
    } catch (error) {
      toast.error('Failed to load detained students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Merge priority data into detained students
  const enrichedStudents = detainedStudents.map(student => {
    const priority = priorityData.find(p => p.usn === student.usn);
    return {
      ...student,
      priority: priority?.priority || 'Low',
      severity_score: priority?.severity_score || 0,
      interventions: priority?.interventions || [],
      reasons: priority?.reasons || [],
      category: priority?.category || 'Other'
    };
  }).sort((a, b) => b.severity_score - a.severity_score);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = department ? { department } : {};
      const response = await exportAPI.exportDetainedExcel(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'detained_students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = department ? { department } : {};
      const response = await exportAPI.exportDetainedPDF(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'detained_students.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSkeleton count={5} />;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AlertTriangle size={32} />
              <div>
                <h1 className="text-3xl font-bold">Detained Students</h1>
                <p className="text-red-100">Total: {detainedStudents.length} students</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Reason: Attendance below 75%</p>
            <p className="text-lg font-semibold mt-2">Immediate Action Required</p>
          </div>
        </div>
      </motion.div>

      {/* NEW: Priority Summary Cards */}
      {prioritySummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical', count: prioritySummary.critical, bg: 'from-red-500 to-red-600' },
            { label: 'High', count: prioritySummary.high, bg: 'from-orange-500 to-orange-600' },
            { label: 'Medium', count: prioritySummary.medium, bg: 'from-amber-500 to-amber-600' },
            { label: 'Low', count: prioritySummary.low, bg: 'from-emerald-500 to-emerald-600' },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-gradient-to-br ${item.bg} rounded-xl shadow-md p-4 text-white`}
            >
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">{item.label} Priority</p>
              <p className="text-3xl font-extrabold mt-1">{item.count}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters and Export */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-navy mb-2">
              Filter by Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              disabled={exporting || detainedStudents.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
            >
              <Download size={20} />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting || detainedStudents.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
            >
              <FileText size={20} />
              PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Detained Students Table */}
      {enrichedStudents.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">USN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Sem</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Sec</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Attendance %</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">GPA</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrichedStudents.map((student, index) => (
                  <>
                    <motion.tr
                      key={student._id || student.usn}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.03, 0.5) }}
                      className="hover:bg-red-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedUSN(expandedUSN === student.usn ? null : student.usn)}
                    >
                      <td className="px-4 py-4 text-sm">
                        <RiskBadge level={student.priority} />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-red-600">{student.usn}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{student.studentName}</td>
                      <td className="px-4 py-4 text-sm">{student.department}</td>
                      <td className="px-4 py-4 text-sm text-center">{student.semester}</td>
                      <td className="px-4 py-4 text-sm text-center">{student.section}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          {student.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">{student.gpa}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                          {student.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button className="text-slate-400 hover:text-cyan transition-colors">
                          {expandedUSN === student.usn ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </motion.tr>
                    {/* Expanded Intervention Panel */}
                    {expandedUSN === student.usn && student.interventions.length > 0 && (
                      <tr key={`${student.usn}-expand`}>
                        <td colSpan={10} className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                          <div className="flex items-start gap-3">
                            <ShieldAlert size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-amber-800 mb-2">Recommended Interventions</p>
                              <ul className="space-y-1.5">
                                {student.interventions.map((intervention, i) => (
                                  <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                                    <span className="text-amber-500">→</span>
                                    {intervention}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-12 text-center"
        >
          <div className="text-gray-400 mb-4">
            <AlertTriangle size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-navy mb-2">No Detained Students</h3>
          <p className="text-gray-600">
            {department
              ? `No detained students found in ${department} department`
              : 'Great! All students have attendance above 75%'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
