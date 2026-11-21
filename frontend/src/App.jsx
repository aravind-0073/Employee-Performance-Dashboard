import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import EmployeeDetails from './pages/EmployeeDetails';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import PerformanceRisks from './pages/PerformanceRisks';
import UploadDataset from './pages/UploadDataset';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeAnalytics />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetails />} />
        <Route path="/departments" element={<DepartmentAnalytics />} />
        <Route path="/performance-risks" element={<PerformanceRisks />} />
        <Route path="/upload" element={<UploadDataset />} />
        <Route path="/reports" element={<Reports />} />

        {/* Backward Compatibility Aliases */}
        <Route path="/students" element={<Navigate to="/employees" replace />} />
        <Route path="/students/:usn" element={<Navigate to="/employees" replace />} />
        <Route path="/detained" element={<Navigate to="/performance-risks" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </Router>
  );
}
