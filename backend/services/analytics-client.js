import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ANALYTICS_BASE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const analyticsAPI = {
  kpis: (employees) => client.post('/api/analytics/performance/kpis', { employees }),
  insights: (employees) => client.post('/api/analytics/statistics/insights', { employees }),
  distributions: (employees) => client.post('/api/analytics/statistics/distributions', { employees }),
  departments: (employees) => client.post('/api/analytics/departments/benchmark', { employees }),
  predict: (employee, peers = []) => client.post('/api/analytics/predictions/predict', { employee, peers }),
  deepDive: (employeeId, employees) => client.post(`/api/analytics/performance/deep-dive/${employeeId}`, { employees }),
  risks: (employees, thresholds = null) => client.post('/api/analytics/risks/assessment', { employees, thresholds })
};

export async function healthCheck() {
  try {
    const res = await client.get('/health', { timeout: 3000 });
    return res.data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

// Resilient wrapper with local in-process fallback if Python service is offline
export async function withPythonFallback(apiCall, fallbackFn) {
  try {
    const res = await apiCall;
    return res.data;
  } catch (err) {
    console.warn(`[AnalyticsClient] Python service call failed (${err.message}). Using native fallback logic.`);
    return fallbackFn();
  }
}

export default analyticsAPI;
