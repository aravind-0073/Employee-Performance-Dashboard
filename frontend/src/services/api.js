import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Auth interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Students API
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (usn) => api.get(`/students/${usn}`),
  create: (data) => api.post('/students', data),
  update: (usn, data) => api.put(`/students/${usn}`, data),
  delete: (usn) => api.delete(`/students/${usn}`),
  getDetained: () => api.get('/students/detained/list'),
  search: (searchData) => api.post('/students/search', searchData),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file, clearExisting = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clearExisting', clearExisting);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAll: () => api.delete('/upload/all/data'),
  downloadTemplate: () => api.get('/upload/template', { responseType: 'blob' }),
  validate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getKPI: (params) => api.get('/analytics/kpi', { params }),
  getAttendanceDistribution: (params) => api.get('/analytics/attendance-distribution', { params }),
  getSubjectPerformance: (params) => api.get('/analytics/subject-performance', { params }),
  getGPADistribution: (params) => api.get('/analytics/gpa-distribution', { params }),
  getDepartmentComparison: () => api.get('/analytics/department-comparison'),
  getSemesterComparison: (params) => api.get('/analytics/semester-comparison', { params }),
  getTopPerformers: (params) => api.get('/analytics/top-performers', { params }),
  getWeakPerformers: (params) => api.get('/analytics/weak-performers', { params }),
  getDetainedAnalysis: (params) => api.get('/analytics/detained-analysis', { params }),
  getRiskStudents: (params) => api.get('/analytics/risk-students', { params }),
};

// ─── NEW: Insights & ML API ───────────────────────────────────────────────────
export const insightsAPI = {
  getInsights: (params) => api.get('/analytics/insights', { params }),
  getCorrelation: (params) => api.get('/analytics/correlation', { params }),
  getRiskScores: (params) => api.get('/analytics/risk-scores', { params }),
  getAcademicHealth: (params) => api.get('/analytics/academic-health', { params }),
  getGPAPrediction: (params) => api.get('/analytics/gpa-prediction', { params }),
  getDepartmentRanking: () => api.get('/analytics/department-ranking'),
  getDetentionPriority: (params) => api.get('/analytics/detention-priority', { params }),
  getStudentRecommendations: (usn) => api.get(`/analytics/student-recommendations/${usn}`),
};

// Export API
export const exportAPI = {
  exportDetainedExcel: (params) => api.get('/export/detained-excel', { params, responseType: 'blob' }),
  exportDetainedPDF: (params) => api.get('/export/detained-pdf', { params, responseType: 'blob' }),
  exportAllStudentsExcel: (params) => api.get('/export/all-students-excel', { params, responseType: 'blob' }),
  exportAllStudentsPDF: (params) => api.get('/export/all-students-pdf', { params, responseType: 'blob' }),
  exportDepartmentReportExcel: (params) => api.get('/export/department-report-excel', { params, responseType: 'blob' }),
  exportDepartmentReportPDF: (params) => api.get('/export/department-report-pdf', { params, responseType: 'blob' }),
  exportTopPerformersExcel: (params) => api.get('/export/top-performers-excel', { params, responseType: 'blob' }),
  exportRiskReportExcel: (params) => api.get('/export/risk-report-excel', { params, responseType: 'blob' }),
  exportRiskReportPDF: (params) => api.get('/export/risk-report-pdf', { params, responseType: 'blob' }),
  exportExecutiveSummaryPDF: (params) => api.get('/export/executive-summary-pdf', { params, responseType: 'blob' }),
};

export default api;
