import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Search, Filter, ChevronDown } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { studentAPI } from '../services/api';

export default function StudentAnalytics() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, [page, department, semester, section]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(department && { department }),
        ...(semester && { semester }),
        ...(section && { section }),
      };

      const response = await studentAPI.getAll(params);
      setStudents(response.data.data);
      setTotalPages(response.data.pagination.pages);

      // Get unique departments
      if (departments.length === 0) {
        const uniqueDepts = [...new Set(response.data.data.map(s => s.department))];
        setDepartments(uniqueDepts);
      }
    } catch (error) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchStudents();
      return;
    }

    try {
      setLoading(true);
      const response = await studentAPI.search({
        searchTerm,
        filters: { department, semester, section }
      });
      setStudents(response.data.data);
      setPage(1);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={5} />;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by USN or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-cyan text-white rounded-lg hover:bg-cyan/90 transition-colors font-semibold"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <select
              value={section}
              onChange={(e) => { setSection(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </form>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">USN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Semester</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Attendance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">GPA</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, index) => (
                <motion.tr
                  key={student._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">{student.usn}</td>
                  <td className="px-6 py-4 text-sm">{student.studentName}</td>
                  <td className="px-6 py-4 text-sm">{student.department}</td>
                  <td className="px-6 py-4 text-sm">{student.semester}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.attendancePercentage >= 90 ? 'bg-green-100 text-green-800' :
                      student.attendancePercentage >= 75 ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.attendancePercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{student.gpa}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.isDetained ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {student.isDetained ? 'Detained' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/students/${student.usn}`}
                      className="text-cyan hover:text-cyan/70 font-semibold transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Total Students: {students.length}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
