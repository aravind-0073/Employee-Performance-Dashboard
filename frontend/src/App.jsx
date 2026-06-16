import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentAnalytics from './pages/StudentAnalytics';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import DetainedStudents from './pages/DetainedStudents';
import UploadDataset from './pages/UploadDataset';
import Reports from './pages/Reports';
import StudentDetails from './pages/StudentDetails';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentAnalytics />} />
          <Route path="/students/:usn" element={<StudentDetails />} />
          <Route path="/departments" element={<DepartmentAnalytics />} />
          <Route path="/detained" element={<DetainedStudents />} />
          <Route path="/upload" element={<UploadDataset />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
