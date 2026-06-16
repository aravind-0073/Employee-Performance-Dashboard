import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowLeft, AlertTriangle, TrendingUp, Target, Heart, Brain, Zap, Star, BookOpen } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import LoadingSkeleton from '../components/LoadingSkeleton';
import RiskBadge from '../components/RiskBadge';
import { studentAPI, insightsAPI } from '../services/api';

export default function StudentDetails() {
  const { usn } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    fetchStudentDetails();
  }, [usn]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const [studentRes, recsRes] = await Promise.allSettled([
        studentAPI.getById(usn),
        insightsAPI.getStudentRecommendations(usn)
      ]);

      if (studentRes.status === 'fulfilled') {
        setStudent(studentRes.value.data.data);
      } else {
        toast.error('Failed to load student details');
        navigate('/students');
        return;
      }

      if (recsRes.status === 'fulfilled') {
        setRecommendations(recsRes.value.data?.data || null);
      }
    } catch (error) {
      toast.error('Failed to load student details');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={5} />;
  if (!student) return <div className="text-center py-8">Student not found</div>;

  const subjectData = [
    { subject: 'Subject 1', marks: student.subject1Marks },
    { subject: 'Subject 2', marks: student.subject2Marks },
    { subject: 'Subject 3', marks: student.subject3Marks },
    { subject: 'Subject 4', marks: student.subject4Marks },
    { subject: 'Subject 5', marks: student.subject5Marks },
  ];

  const performanceData = [
    { category: 'Attendance', value: student.attendancePercentage },
    { category: 'Internal Marks', value: (student.internalMarks / 50) * 100 },
    { category: 'GPA', value: (student.gpa / 10) * 100 },
  ];

  const avgMarks = (student.subject1Marks + student.subject2Marks + student.subject3Marks + student.subject4Marks + student.subject5Marks) / 5;
  
  // Calculate risk score locally
  let riskScore = 0;
  if (student.attendancePercentage < 60) riskScore += 35;
  else if (student.attendancePercentage < 70) riskScore += 25;
  else if (student.attendancePercentage < 75) riskScore += 18;
  else if (student.attendancePercentage < 80) riskScore += 8;
  
  if (student.gpa < 4.0) riskScore += 25;
  else if (student.gpa < 5.0) riskScore += 18;
  else if (student.gpa < 5.5) riskScore += 12;
  else if (student.gpa < 6.5) riskScore += 5;

  if (student.internalMarks < 15) riskScore += 15;
  else if (student.internalMarks < 20) riskScore += 10;
  else if (student.internalMarks < 25) riskScore += 5;

  const weakCount = [student.subject1Marks, student.subject2Marks, student.subject3Marks, student.subject4Marks, student.subject5Marks].filter(m => m < 40).length;
  riskScore += Math.min(weakCount * 5, 15);
  if (avgMarks < 35) riskScore += 10;
  else if (avgMarks < 45) riskScore += 6;
  else if (avgMarks < 55) riskScore += 3;
  riskScore = Math.min(riskScore, 100);
  
  const riskLevel = riskScore >= 60 ? 'High Risk' : riskScore >= 35 ? 'Medium Risk' : 'Low Risk';

  // Academic Health Index
  const attendanceScore = (student.attendancePercentage / 100) * 30;
  const gpaScore = (student.gpa / 10) * 40;
  const marksScore = (avgMarks / 100) * 20;
  const internalScore = (student.internalMarks / 50) * 10;
  const healthIndex = Math.min(Math.round((attendanceScore + gpaScore + marksScore + internalScore) * 10) / 10, 100);
  const healthClass = healthIndex >= 85 ? 'Excellent' : healthIndex >= 70 ? 'Good' : healthIndex >= 55 ? 'Average' : healthIndex >= 40 ? 'Needs Improvement' : 'Critical';

  const statusGradients = {
    red: 'bg-gradient-to-br from-red-400 to-red-600',
    green: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
    purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
    yellow: 'bg-gradient-to-br from-amber-400 to-amber-600',
  };

  const getPerformanceStatus = () => {
    if (student.isDetained) return { status: 'Detained', color: 'red' };
    if (student.gpa >= 8.5) return { status: 'Excellent', color: 'green' };
    if (student.gpa >= 7.5) return { status: 'Very Good', color: 'blue' };
    if (student.gpa >= 6.5) return { status: 'Good', color: 'purple' };
    return { status: 'Average', color: 'yellow' };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-bold text-navy">Student Profile: {student.studentName}</h1>
      </motion.div>

      {/* Basic Info */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg shadow-lg p-6"
      >
        <div>
          <p className="text-sm text-gray-600">USN</p>
          <p className="text-lg font-bold text-navy">{student.usn}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Department</p>
          <p className="text-lg font-bold text-navy">{student.department}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Semester</p>
          <p className="text-lg font-bold text-navy">{student.semester}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Section</p>
          <p className="text-lg font-bold text-navy">{student.section}</p>
        </div>
      </motion.div>

      {/* Performance Status & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${statusGradients[performanceStatus.color]} rounded-lg shadow-lg p-6 text-white`}
        >
          <p className="text-sm font-semibold opacity-90">Academic Status</p>
          <p className="text-3xl font-bold mt-2">{performanceStatus.status}</p>
          {student.isDetained && (
            <div className="mt-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              <p className="text-sm">{student.detentionReason}</p>
            </div>
          )}
        </motion.div>

        {/* Attendance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg p-6 text-white"
        >
          <p className="text-sm font-semibold opacity-90">Attendance</p>
          <p className="text-3xl font-bold mt-2">{student.attendancePercentage}%</p>
          <p className="text-xs mt-2 opacity-75">
            {student.attendancePercentage >= 75 ? '✓ Above threshold' : '✗ Below threshold'}
          </p>
        </motion.div>

        {/* GPA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg p-6 text-white"
        >
          <p className="text-sm font-semibold opacity-90">GPA / CGPA</p>
          <p className="text-3xl font-bold mt-2">{student.gpa} / {student.cgpa}</p>
          <p className="text-xs mt-2">Out of 10.0</p>
        </motion.div>
      </div>

      {/* NEW: Risk, Health, and Average Marks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-red-500" />
            <h4 className="text-sm font-bold text-navy">Risk Assessment</h4>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-extrabold text-slate-800">{riskScore}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">out of 100</p>
            </div>
            <RiskBadge level={riskLevel} size="lg" />
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                riskScore >= 60 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                riskScore >= 35 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                'bg-gradient-to-r from-emerald-400 to-emerald-600'
              }`} 
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </motion.div>

        {/* Academic Health Index */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Heart size={18} className="text-rose-500" />
            <h4 className="text-sm font-bold text-navy">Academic Health Index</h4>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-extrabold text-slate-800">{healthIndex}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">out of 100</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
              healthIndex >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              healthIndex >= 55 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {healthClass}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                healthIndex >= 70 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                healthIndex >= 55 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`} 
              style={{ width: `${healthIndex}%` }}
            />
          </div>
        </motion.div>

        {/* Average Marks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-blue-500" />
            <h4 className="text-sm font-bold text-navy">Average Subject Marks</h4>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-extrabold text-slate-800">{avgMarks.toFixed(1)}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">out of 100</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
              avgMarks >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              avgMarks >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' :
              avgMarks >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {avgMarks >= 80 ? 'Excellent' : avgMarks >= 60 ? 'Good' : avgMarks >= 40 ? 'Average' : 'Needs Work'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700"
              style={{ width: `${avgMarks}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Subject Marks */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-bold text-navy mb-4">Subject-wise Marks</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="marks" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-bold text-navy mb-4">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Performance" dataKey="value" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Additional Details */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-bold text-navy mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Internal Marks</span>
              <span className="font-semibold">{student.internalMarks} / 50</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Email</span>
              <span className="font-semibold">{student.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Phone</span>
              <span className="font-semibold">{student.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Counselor</span>
              <span className="font-semibold">{student.counselorName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Parent Name</span>
              <span className="font-semibold">{student.parentName || 'N/A'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* NEW: AI-Generated Recommendations Section */}
      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Brain size={20} className="text-purple-500" />
            <h3 className="text-lg font-bold text-navy">AI-Powered Assessment</h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {recommendations.performance_class}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} className="text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-900">Strengths</h4>
              </div>
              <ul className="space-y-2">
                {recommendations.strengths?.length > 0 ? recommendations.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-800 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {s}
                  </li>
                )) : (
                  <li className="text-xs text-slate-400 italic">No notable strengths identified</li>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <h4 className="text-sm font-bold text-amber-900">Areas for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {recommendations.weaknesses?.length > 0 ? recommendations.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">!</span>
                    {w}
                  </li>
                )) : (
                  <li className="text-xs text-slate-400 italic">No significant weaknesses</li>
                )}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-blue-600" />
                <h4 className="text-sm font-bold text-blue-900">Recommendations</h4>
              </div>
              <ul className="space-y-2">
                {recommendations.recommendations?.length > 0 ? recommendations.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {r}
                  </li>
                )) : (
                  <li className="text-xs text-slate-400 italic">No specific recommendations</li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
