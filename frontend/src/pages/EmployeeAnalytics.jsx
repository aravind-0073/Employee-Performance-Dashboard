import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { employeeAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function EmployeeAnalytics() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [designation, setDesignation] = useState('All');
  const [category, setCategory] = useState('All');
  const [riskLevel, setRiskLevel] = useState('All');
  const [sortBy, setSortBy] = useState('performanceScore');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter options loaded from backend
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    experience: 3.0,
    attendancePercentage: 92.0,
    performanceScore: 82.0,
    productivityScore: 84.0,
    qualityScore: 85.0,
    targetCompletionRate: 88.0,
    projectsCompleted: 4,
    tasksCompleted: 35,
    managerName: 'David Vance',
    email: '',
    phone: ''
  });

  const fetchEmployees = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(department !== 'All' && { department }),
        ...(designation !== 'All' && { designation }),
        ...(category !== 'All' && { performanceCategory: category }),
        ...(riskLevel !== 'All' && { riskLevel }),
      };

      const res = await employeeAPI.getAll(params);
      if (res.data?.success) {
        setEmployees(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.filters) {
          setDepartments(res.data.filters.departments || []);
          setDesignations(res.data.filters.designations || []);
        }
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [search, department, designation, category, riskLevel, sortBy, sortOrder]);

  const handleDelete = async (employeeId, name) => {
    if (!window.confirm(`Are you sure you want to delete employee record for ${name} (${employeeId})?`)) {
      return;
    }
    try {
      await employeeAPI.delete(employeeId);
      fetchEmployees(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await employeeAPI.create(newEmployee);
      if (res.data?.success) {
        setShowAddModal(false);
        // Reset form
        setNewEmployee({
          employeeId: '',
          employeeName: '',
          department: 'Engineering',
          designation: 'Software Engineer',
          experience: 3.0,
          attendancePercentage: 92.0,
          performanceScore: 82.0,
          productivityScore: 84.0,
          qualityScore: 85.0,
          targetCompletionRate: 88.0,
          projectsCompleted: 4,
          tasksCompleted: 35,
          managerName: 'David Vance',
          email: '',
          phone: ''
        });
        fetchEmployees(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Employee Workforce Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, evaluate multi-criteria performance scores, and manage talent records
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* ─── Search & Filters Bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, or Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Excellent">Excellent (≥ 85)</option>
              <option value="Good">Good (75 - 84)</option>
              <option value="Average">Average (65 - 74)</option>
              <option value="Needs Improvement">Needs Improvement (50 - 64)</option>
              <option value="Critical">Critical (&lt; 50)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Employees Table ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8"><LoadingSkeleton /></div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-sm font-bold">No employee records match your criteria.</p>
            <p className="text-xs">Adjust your search filters or add a new employee record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4 text-center">Experience</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Performance</th>
                  <th className="py-3 px-4 text-center">Productivity</th>
                  <th className="py-3 px-4 text-center">EPI (Index)</th>
                  <th className="py-3 px-4 text-center">Risk Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {employees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.employeeName[0]}
                        </div>
                        <div>
                          <Link
                            to={`/employees/${emp.employeeId}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                          >
                            {emp.employeeName}
                          </Link>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{emp.department}</span>
                      <span className="block text-[10px] text-slate-400">{emp.designation}</span>
                    </td>

                    <td className="py-3 px-4 text-center font-semibold">
                      {emp.experience} yrs
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${emp.attendancePercentage < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {emp.attendancePercentage}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${emp.performanceScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : emp.performanceScore < 60 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {emp.performanceScore}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {emp.productivityScore}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {emp.epi || '--'}
                      </span>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        {emp.performanceCategory}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={emp.riskLevel || 'Low'} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/employees/${emp.employeeId}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                          title="View In-Depth Profile & ML Forecast"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.employeeId, emp.employeeName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Employee Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Footer ────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmployees(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => fetchEmployees(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Add Employee Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add New Employee Record
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP199"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rachel Adams"
                      value={newEmployee.employeeName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department *
                    </label>
                    <select
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Software Engineer"
                      value={newEmployee.designation}
                      onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={newEmployee.experience}
                      onChange={(e) => setNewEmployee({ ...newEmployee, experience: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Attendance Percentage (%) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={newEmployee.attendancePercentage}
                      onChange={(e) => setNewEmployee({ ...newEmployee, attendancePercentage: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Performance Score (0 - 100) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={newEmployee.performanceScore}
                      onChange={(e) => setNewEmployee({ ...newEmployee, performanceScore: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Productivity Score (0 - 100) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={newEmployee.productivityScore}
                      onChange={(e) => setNewEmployee({ ...newEmployee, productivityScore: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quality Score (0 - 100)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={newEmployee.qualityScore}
                      onChange={(e) => setNewEmployee({ ...newEmployee, qualityScore: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Completion Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={newEmployee.targetCompletionRate}
                      onChange={(e) => setNewEmployee({ ...newEmployee, targetCompletionRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reporting Manager
                    </label>
                    <input
                      type="text"
                      value={newEmployee.managerName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, managerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. employee@workforce.io"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Save Employee'}
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
