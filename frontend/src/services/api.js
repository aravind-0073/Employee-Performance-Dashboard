import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor: inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// ─── Employees API ───────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (employeeId) => api.get(`/employees/${employeeId}`),
  create: (data) => api.post('/employees', data),
  update: (employeeId, data) => api.put(`/employees/${employeeId}`, data),
  delete: (employeeId) => api.delete(`/employees/${employeeId}`),
  getRisksList: () => api.get('/employees/risks/list'),
  logIntervention: (employeeId, interventionData) =>
    api.post(`/employees/${employeeId}/interventions`, interventionData),
};

// Compatibility alias
export const studentAPI = employeeAPI;

// ─── Upload API ──────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadFile: (file, mode = 'append') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadExcelTemplate: () =>
    api.get('/upload/template/excel', { responseType: 'blob' }),
  downloadCsvTemplate: () =>
    api.get('/upload/template/csv', { responseType: 'blob' }),
};

// ─── Analytics & ML API ───────────────────────────────────────────────────────
export const analyticsAPI = {
  getKPI: (params) => api.get('/analytics/kpi', { params }),
  getInsights: (params) => api.get('/analytics/insights', { params }),
  getDistributions: (params) => api.get('/analytics/distributions', { params }),
  getDepartments: (params) => api.get('/analytics/departments', { params }),
  getPrediction: (employeeId) => api.get(`/analytics/predict/${employeeId}`),
  getDeepDive: (employeeId) => api.get(`/analytics/deep-dive/${employeeId}`),
  getRisks: (params) => api.get('/analytics/risks', { params }),
  getHealth: () => api.get('/analytics/analytics-health'),
};

// ─── Export API ──────────────────────────────────────────────────────────────
export const exportAPI = {
  // Excel
  exportFullDatabaseExcel: () =>
    api.get('/export/excel/full-database', { responseType: 'blob' }),
  exportPerformanceSummaryExcel: () =>
    api.get('/export/excel/performance-summary', { responseType: 'blob' }),
  exportUnderperformingExcel: () =>
    api.get('/export/excel/underperforming', { responseType: 'blob' }),
  exportDepartmentBenchmarksExcel: () =>
    api.get('/export/excel/departmental-benchmark', { responseType: 'blob' }),
  exportHighPerformersExcel: () =>
    api.get('/export/excel/high-performers', { responseType: 'blob' }),

  // PDF
  exportExecutiveWorkforcePDF: () =>
    api.get('/export/pdf/executive-workforce', { responseType: 'blob' }),
  exportEmployeeAppraisalPDF: (employeeId) =>
    api.get(`/export/pdf/employee/${employeeId}`, { responseType: 'blob' }),
  exportPerformanceRiskPDF: () =>
    api.get('/export/pdf/performance-risk', { responseType: 'blob' }),
};

export default api;
