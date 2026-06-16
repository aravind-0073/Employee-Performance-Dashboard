import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';

export const analyticsClient = axios.create({
  baseURL: `${ANALYTICS_SERVICE_URL}/api/analytics`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Performance Analysis APIs
export const performanceAPI = {
  analyze: (students) => analyticsClient.post('/performance/analyze', students),
  analyzeIndividual: (usn, student) => analyticsClient.post(`/performance/individual/${usn}`, student),
  batchAnalysis: (request) => analyticsClient.post('/performance/batch', request)
};

// Attendance Analysis APIs
export const attendanceAPI = {
  analyze: (students) => analyticsClient.post('/attendance/analyze', students),
  distribution: (students) => analyticsClient.post('/attendance/distribution', students),
  byDepartment: (students) => analyticsClient.post('/attendance/by-department', students),
  atRisk: (students) => analyticsClient.post('/attendance/at-risk', students),
  trendAnalysis: (students) => analyticsClient.post('/attendance/trend-analysis', students)
};

// Detention Analysis APIs
export const detentionAPI = {
  identify: (students) => analyticsClient.post('/detention/identify', students),
  byDepartment: (students, department) =>
    analyticsClient.post('/detention/by-department', students, { params: { department } }),
  riskAnalysis: (students) => analyticsClient.post('/detention/risk-analysis', students),
  counselorList: (students) => analyticsClient.post('/detention/counselor-list', students),
  criteria: () => analyticsClient.get('/detention/criteria')
};

// Statistical Analysis APIs
export const statisticsAPI = {
  summary: (students) => analyticsClient.post('/statistics/summary', students),
  correlation: (students) => analyticsClient.post('/statistics/correlation', students),
  topPerformers: (students, limit = 10, department = null) =>
    analyticsClient.post('/statistics/top-performers', students, { params: { limit, department } }),
  weakPerformers: (students, limit = 10, department = null) =>
    analyticsClient.post('/statistics/weak-performers', students, { params: { limit, department } }),
  departmentStats: (students) => analyticsClient.post('/statistics/department-stats', students),
  semesterStats: (students) => analyticsClient.post('/statistics/semester-stats', students),
  gpaDistribution: (students) => analyticsClient.post('/statistics/gpa-distribution', students),
  passFailAnalysis: (students) => analyticsClient.post('/statistics/pass-fail-analysis', students)
};

// Prediction APIs
export const predictionsAPI = {
  atRiskStudents: (students) => analyticsClient.post('/predictions/at-risk-students', students),
  subjectWisePrediction: (students) => analyticsClient.post('/predictions/subject-wise-prediction', students),
  improvementScore: (students) => analyticsClient.post('/predictions/performance-improvement-score', students)
};

// Visualization APIs
export const visualizationsAPI = {
  gpaDistribution: (students) => analyticsClient.post('/visualizations/gpa-distribution', students),
  attendanceDistribution: (students) => analyticsClient.post('/visualizations/attendance-distribution', students),
  departmentComparison: (students) => analyticsClient.post('/visualizations/department-comparison', students),
  subjectPerformance: (students) => analyticsClient.post('/visualizations/subject-performance', students),
  scatterPlot: (students) => analyticsClient.post('/visualizations/scatter-gpa-vs-attendance', students),
  boxPlot: (students) => analyticsClient.post('/visualizations/box-plot', students),
  heatmap: (students) => analyticsClient.post('/visualizations/heatmap', students)
};

// ─── NEW: Insights APIs ──────────────────────────────────────────────────────
export const insightsAPI = {
  generate: (students) => analyticsClient.post('/insights/generate', students),
  correlation: (students) => analyticsClient.post('/insights/correlation', students),
  riskScores: (students) => analyticsClient.post('/insights/risk-scores', students),
  academicHealth: (students) => analyticsClient.post('/insights/academic-health', students),
  gpaPrediction: (students) => analyticsClient.post('/insights/gpa-prediction', students),
  departmentRanking: (students) => analyticsClient.post('/insights/department-ranking', students),
  detentionPriority: (students) => analyticsClient.post('/insights/detention-priority', students),
  studentRecommendations: (students) => analyticsClient.post('/insights/student-recommendations', students),
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE_URL}/health`);
    return response.data;
  } catch (error) {
    throw new Error('Analytics service unavailable');
  }
};

// Error handler wrapper
export const withErrorHandling = async (apiCall) => {
  try {
    const response = await apiCall;
    return response.data;
  } catch (error) {
    console.error('Analytics API Error:', error.message);
    throw new Error(error.response?.data?.error || 'Analytics service error');
  }
};
