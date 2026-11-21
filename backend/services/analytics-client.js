import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ANALYTICS_BASE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 15000,
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
  risks: (employees, thresholds = null) => client.post('/api/analytics/risks/assessment', { employees, thresholds }),

  // Academic Data Mining & Machine Learning
  trainEvaluate: (employees) => client.post('/api/analytics/ml/train-evaluate', { employees }),
  predictML: (payload) => client.post('/api/analytics/ml/predict', payload),
  edaVisualizations: (employees) => client.post('/api/analytics/ml/eda-visualizations', { employees })
};

export async function healthCheck() {
  try {
    const res = await client.get('/health', { timeout: 3000 });
    return res.data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

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
