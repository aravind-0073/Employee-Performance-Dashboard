import express from 'express';
import Student from '../models/Student.js';
import {
  statisticsAPI,
  attendanceAPI,
  detentionAPI,
  visualizationsAPI,
  insightsAPI,
  withErrorHandling,
  healthCheck
} from '../services/analytics-client.js';

const router = express.Router();

// ─── Helper: fetch students from MongoDB and map to Python-compatible shape ───
async function fetchStudents(query) {
  const docs = await Student.find(query).lean();
  return docs.map(s => ({
    usn: s.usn,
    studentName: s.studentName,
    department: s.department,
    semester: s.semester,
    section: s.section,
    attendancePercentage: s.attendancePercentage,
    subject1Marks: s.subject1Marks,
    subject2Marks: s.subject2Marks,
    subject3Marks: s.subject3Marks,
    subject4Marks: s.subject4Marks,
    subject5Marks: s.subject5Marks,
    internalMarks: s.internalMarks,
    gpa: s.gpa,
    cgpa: s.cgpa ?? 0,
    email: s.email ?? null,
    phone: s.phone ?? null
  }));
}

function buildQuery(req) {
  const { department, semester, section } = req.query || {};
  const query = { userId: req.userId };
  if (department) query.department = department;
  if (semester) query.semester = parseInt(semester);
  if (section) query.section = section;
  return query;
}

// ─── Analytics health check ───────────────────────────────────────────────────
router.get('/analytics-health', async (req, res) => {
  try {
    const health = await healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(503).json({ success: false, error: 'Python analytics service unavailable' });
  }
});

// ─── KPI Dashboard ───────────────────────────────────────────────────────────
// Combines: statistics/summary + statistics/pass-fail-analysis + detention/identify
router.get('/kpi', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);

    if (students.length === 0) {
      return res.json({
        success: true,
        data: {
          totalStudents: 0,
          averageAttendance: 0,
          averageGPA: 0,
          passPercentage: 0,
          failPercentage: 0,
          detainedCount: 0,
          highestGPA: 0,
          lowestGPA: 0,
          averageMarks: 0
        }
      });
    }

    // Fire all three analytics calls in parallel
    const [statsResult, passFailResult, detentionResult] = await Promise.all([
      withErrorHandling(statisticsAPI.summary(students)),
      withErrorHandling(statisticsAPI.passFailAnalysis(students)),
      withErrorHandling(detentionAPI.identify(students))
    ]);

    const stats = statsResult.data;
    const passFail = passFailResult.data;
    const detainedCount = detentionResult.total ?? 0;

    res.json({
      success: true,
      data: {
        totalStudents: stats.total_students,
        averageAttendance: parseFloat(stats.mean_attendance.toFixed(2)),
        averageGPA: parseFloat(stats.mean_gpa.toFixed(2)),
        passPercentage: parseFloat((passFail.pass_rate ?? 0).toFixed(2)),
        failPercentage: parseFloat((passFail.fail_rate ?? 0).toFixed(2)),
        detainedCount,
        highestGPA: parseFloat(stats.max_gpa.toFixed(2)),
        lowestGPA: parseFloat(stats.min_gpa.toFixed(2)),
        averageMarks: parseFloat(stats.mean_marks.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Attendance Distribution ──────────────────────────────────────────────────
router.get('/attendance-distribution', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(attendanceAPI.distribution(students));

    const raw = result.data ?? {};
    const distribution = {
      excellent: raw['Excellent (>= 90)'] ?? 0,
      good: raw['Good (80-90)'] ?? 0,
      average: raw['Average (75-80)'] ?? 0,
      poor: raw['Poor (< 75)'] ?? 0
    };

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Subject Performance ──────────────────────────────────────────────────────
router.get('/subject-performance', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(visualizationsAPI.subjectPerformance(students));

    const raw = result.data ?? {};
    const subjectAvgs = {
      subject1: parseFloat((raw['Subject 1'] ?? 0).toFixed(2)),
      subject2: parseFloat((raw['Subject 2'] ?? 0).toFixed(2)),
      subject3: parseFloat((raw['Subject 3'] ?? 0).toFixed(2)),
      subject4: parseFloat((raw['Subject 4'] ?? 0).toFixed(2)),
      subject5: parseFloat((raw['Subject 5'] ?? 0).toFixed(2))
    };

    res.json({ success: true, data: subjectAvgs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GPA Distribution ────────────────────────────────────────────────────────
router.get('/gpa-distribution', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(statisticsAPI.gpaDistribution(students));

    const raw = result.data ?? {};
    const distribution = {
      excellent: raw['Excellent (8.5-10)'] ?? 0,
      verygood: raw['Very Good (7.5-8.5)'] ?? 0,
      good: raw['Good (6.5-7.5)'] ?? 0,
      average: raw['Average (5.5-6.5)'] ?? 0,
      poor: raw['Poor (<5.5)'] ?? 0
    };

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Department Comparison ────────────────────────────────────────────────────
router.get('/department-comparison', async (req, res) => {
  try {
    const students = await fetchStudents({ userId: req.userId });
    const result = await withErrorHandling(statisticsAPI.departmentStats(students));

    const raw = result.data ?? {};
    const departments = Object.entries(raw).map(([dept, stats]) => ({
      _id: dept,
      totalStudents: stats.total_students,
      averageGPA: parseFloat((stats.mean_gpa ?? 0).toFixed(2)),
      averageAttendance: parseFloat((stats.mean_attendance ?? 0).toFixed(2)),
      detainedCount: stats.detained_count ?? 0
    })).sort((a, b) => a._id.localeCompare(b._id));

    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Semester Comparison ──────────────────────────────────────────────────────
router.get('/semester-comparison', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(statisticsAPI.semesterStats(students));

    const raw = result.data ?? {};
    const semesters = Object.entries(raw).map(([semLabel, stats]) => ({
      _id: parseInt(semLabel.replace('Semester ', '')),
      totalStudents: stats.total_students,
      averageGPA: parseFloat((stats.mean_gpa ?? 0).toFixed(2)),
      averageAttendance: parseFloat((stats.mean_attendance ?? 0).toFixed(2)),
      detainedCount: stats.detained_count ?? 0
    })).sort((a, b) => a._id - b._id);

    res.json({ success: true, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Top Performers ───────────────────────────────────────────────────────────
router.get('/top-performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(
      statisticsAPI.topPerformers(students, parseInt(limit), query.department || null)
    );

    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Weak Performers ──────────────────────────────────────────────────────────
router.get('/weak-performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(
      statisticsAPI.weakPerformers(students, parseInt(limit), query.department || null)
    );

    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Detained Analysis ────────────────────────────────────────────────────────
router.get('/detained-analysis', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(detentionAPI.identify(students));

    const detainedStudents = result.data ?? [];

    const analysis = {
      total: detainedStudents.length,
      byReason: {
        lowAttendance: detainedStudents.filter(s => s.attendancePercentage < 75).length
      },
      students: detainedStudents
    };

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Risk Students (attendance 60-75%) ────────────────────────────────────────
router.get('/risk-students', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    const result = await withErrorHandling(attendanceAPI.atRisk(students));

    const riskStudents = result.data ?? [];

    res.json({ success: true, data: riskStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NEW: Insights & ML Endpoints ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Dynamic Insights ─────────────────────────────────────────────────────────
router.get('/insights', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const result = await withErrorHandling(insightsAPI.generate(students));
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Correlation Analysis ─────────────────────────────────────────────────────
router.get('/correlation', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length < 3) {
      return res.json({ success: true, data: { coefficient: 0, strength: 'N/A', label: 'Insufficient data', interpretation: 'Need at least 3 students for correlation analysis.' } });
    }
    const result = await withErrorHandling(insightsAPI.correlation(students));
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Risk Scores ──────────────────────────────────────────────────────────────
router.get('/risk-scores', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length === 0) {
      return res.json({ success: true, data: [], summary: { high_risk: 0, medium_risk: 0, low_risk: 0, total: 0 } });
    }
    const result = await withErrorHandling(insightsAPI.riskScores(students));
    res.json({ success: true, data: result.data, summary: result.summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Academic Health ──────────────────────────────────────────────────────────
router.get('/academic-health', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length === 0) {
      return res.json({ success: true, data: [], average_health_index: 0 });
    }
    const result = await withErrorHandling(insightsAPI.academicHealth(students));
    res.json({ success: true, data: result.data, average_health_index: result.average_health_index });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GPA Prediction ───────────────────────────────────────────────────────────
router.get('/gpa-prediction', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length < 5) {
      return res.json({ success: true, data: [], model_info: null });
    }
    const result = await withErrorHandling(insightsAPI.gpaPrediction(students));
    res.json({ success: true, data: result.data, model_info: result.model_info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Department Ranking ───────────────────────────────────────────────────────
router.get('/department-ranking', async (req, res) => {
  try {
    const students = await fetchStudents({ userId: req.userId });
    if (students.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const result = await withErrorHandling(insightsAPI.departmentRanking(students));
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Detention Priority ──────────────────────────────────────────────────────
router.get('/detention-priority', async (req, res) => {
  try {
    const query = buildQuery(req);
    const students = await fetchStudents(query);
    if (students.length === 0) {
      return res.json({ success: true, data: [], summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 } });
    }
    const result = await withErrorHandling(insightsAPI.detentionPriority(students));
    res.json({ success: true, data: result.data, summary: result.summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Student Recommendations (single student by USN) ──────────────────────────
router.get('/student-recommendations/:usn', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId, usn: req.params.usn }).lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    const mapped = [{
      usn: student.usn,
      studentName: student.studentName,
      department: student.department,
      semester: student.semester,
      section: student.section,
      attendancePercentage: student.attendancePercentage,
      subject1Marks: student.subject1Marks,
      subject2Marks: student.subject2Marks,
      subject3Marks: student.subject3Marks,
      subject4Marks: student.subject4Marks,
      subject5Marks: student.subject5Marks,
      internalMarks: student.internalMarks,
      gpa: student.gpa,
      cgpa: student.cgpa ?? 0,
      email: student.email ?? null,
      phone: student.phone ?? null
    }];
    const result = await withErrorHandling(insightsAPI.studentRecommendations(mapped));
    res.json({ success: true, data: result.data?.[0] ?? null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
