import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Download, BarChart3, Award, ShieldAlert, Briefcase, Users, ChevronDown } from 'lucide-react';
import { exportAPI, analyticsAPI } from '../services/api';

// Format Dropdown Button Component
function DownloadButton({ formats, onDownload, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // If only one format, download directly
  if (formats.length === 1) {
    return (
      <button
        onClick={() => onDownload(formats[0].key)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors font-semibold text-sm"
      >
        <Download size={16} />
        Download {formats[0].label}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors font-semibold text-sm"
      >
        <Download size={16} />
        {disabled ? 'Downloading...' : 'Download'}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20"
        >
          {formats.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => { setOpen(false); onDownload(fmt.key); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                fmt.key === 'excel' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {fmt.key === 'excel' ? 'XLS' : 'PDF'}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{fmt.label}</p>
                <p className="text-[10px] text-slate-400">{fmt.desc}</p>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function Reports() {
  const [exporting, setExporting] = useState(false);
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [topCount, setTopCount] = useState(10);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await analyticsAPI.getDepartmentComparison();
      const deptList = (res.data?.data || []).map(d => d._id);
      setDepartments(deptList);
    } catch (e) {
      // silent fail
    }
  };

  const downloadFile = async (apiCall, filename) => {
    try {
      setExporting(true);
      const response = await apiCall;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const reportCards = [
    {
      title: 'All Students Report',
      description: 'Complete student data with all academic details, marks, attendance, and GPA scores',
      icon: BarChart3,
      color: 'from-blue-400 to-blue-600',
      formats: [
        { key: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format' },
        { key: 'pdf', label: 'PDF Document', desc: 'Professional print-ready format' },
      ],
      onDownload: (fmt) => {
        if (fmt === 'excel') downloadFile(exportAPI.exportAllStudentsExcel({ department }), 'all_students.xlsx');
        else downloadFile(exportAPI.exportAllStudentsPDF({ department }), 'all_students.pdf');
      }
    },
    {
      title: 'Detained Students Report',
      description: 'Students with attendance below 75% requiring immediate academic intervention',
      icon: ShieldAlert,
      color: 'from-red-400 to-red-600',
      formats: [
        { key: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format' },
        { key: 'pdf', label: 'PDF Document', desc: 'Professional print-ready format' },
      ],
      onDownload: (fmt) => {
        if (fmt === 'excel') downloadFile(exportAPI.exportDetainedExcel({ department }), 'detained_students.xlsx');
        else downloadFile(exportAPI.exportDetainedPDF({ department }), 'detained_students.pdf');
      }
    },
    {
      title: 'Department Analytics',
      description: 'Performance stats per department with weighted rankings, pass rates, and top students',
      icon: Users,
      color: 'from-purple-400 to-purple-600',
      formats: [
        { key: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format' },
        { key: 'pdf', label: 'PDF Document', desc: 'Professional print-ready format' },
      ],
      onDownload: (fmt) => {
        if (fmt === 'excel') downloadFile(exportAPI.exportDepartmentReportExcel({ department }), 'department_report.xlsx');
        else downloadFile(exportAPI.exportDepartmentReportPDF({ department }), 'department_report.pdf');
      }
    },
    {
      title: `Top ${topCount} Performers`,
      description: `Top ${topCount} students ranked by GPA with attendance and internal marks breakdown`,
      icon: Award,
      color: 'from-emerald-400 to-emerald-600',
      formats: [
        { key: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format' },
      ],
      onDownload: () => downloadFile(exportAPI.exportTopPerformersExcel({ department, limit: topCount }), `top_${topCount}_performers.xlsx`)
    },
    {
      title: 'Academic Risk Report',
      description: 'Students at academic risk with risk scores, severity levels, and contributing factors',
      icon: ShieldAlert,
      color: 'from-orange-400 to-orange-600',
      formats: [
        { key: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format' },
        { key: 'pdf', label: 'PDF Document', desc: 'Professional print-ready format' },
      ],
      onDownload: (fmt) => {
        if (fmt === 'excel') downloadFile(exportAPI.exportRiskReportExcel({ department }), 'risk_report.xlsx');
        else downloadFile(exportAPI.exportRiskReportPDF({ department }), 'risk_report.pdf');
      }
    },
    {
      title: 'Executive Summary',
      description: 'Comprehensive HOD/Principal report with key statistics, department rankings, and overall health',
      icon: Briefcase,
      color: 'from-slate-700 to-slate-900',
      formats: [
        { key: 'pdf', label: 'PDF Document', desc: 'Professional executive brief' },
      ],
      onDownload: () => downloadFile(exportAPI.exportExecutiveSummaryPDF({ department }), 'executive_summary.pdf')
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg shadow-lg p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Reports & Export</h1>
        <p className="text-slate-300">Generate and download comprehensive reports about student performance and academic status</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">
              Filter by Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">
              Top Performers Count
            </label>
            <select
              value={topCount}
              onChange={(e) => setTopCount(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Reports Grid — Consolidated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col"
            >
              <div className={`bg-gradient-to-br ${report.color} h-28 flex items-center justify-center text-white rounded-t-xl`}>
                <Icon size={40} opacity={0.8} />
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-navy mb-1.5">{report.title}</h3>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed flex-1">{report.description}</p>

                {/* Format badges */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Available:</span>
                  {report.formats.map(fmt => (
                    <span key={fmt.key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fmt.key === 'excel' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {fmt.key === 'excel' ? '.xlsx' : '.pdf'}
                    </span>
                  ))}
                </div>

                <DownloadButton
                  formats={report.formats}
                  onDownload={report.onDownload}
                  disabled={exporting}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h4 className="font-bold text-emerald-900 mb-3">✓ What's Included in Reports</h4>
          <ul className="space-y-2 text-sm text-emerald-900">
            <li>✓ Complete student information</li>
            <li>✓ Subject-wise marks</li>
            <li>✓ Attendance percentage</li>
            <li>✓ GPA/CGPA scores</li>
            <li>✓ Detention status</li>
            <li>✓ Risk scores & recommendations</li>
            <li>✓ Department-wise analytics</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-blue-900 mb-3">💡 Tips for Using Reports</h4>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• Use Excel for data analysis & editing</li>
            <li>• Use PDF for official documentation</li>
            <li>• Filter by department for specific reports</li>
            <li>• Executive Summary is ideal for HOD/Principal</li>
            <li>• Risk Report for academic counseling teams</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
