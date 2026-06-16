import express from 'express';
import Student from '../models/Student.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { insightsAPI, withErrorHandling } from '../services/analytics-client.js';

const router = express.Router();

// ─── Helper: fetch and map students ───────────────────────────────────────────
async function fetchStudents(query) {
  const docs = await Student.find(query).lean();
  return docs.map(s => ({
    usn: s.usn, studentName: s.studentName, department: s.department,
    semester: s.semester, section: s.section,
    attendancePercentage: s.attendancePercentage,
    subject1Marks: s.subject1Marks, subject2Marks: s.subject2Marks,
    subject3Marks: s.subject3Marks, subject4Marks: s.subject4Marks,
    subject5Marks: s.subject5Marks, internalMarks: s.internalMarks,
    gpa: s.gpa, cgpa: s.cgpa ?? 0,
    email: s.email ?? null, phone: s.phone ?? null
  }));
}

function buildQuery(req) {
  const q = { userId: req.userId };
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = parseInt(req.query.semester);
  return q;
}

function styleHeaderRow(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Existing Exports
// ═══════════════════════════════════════════════════════════════════════════════

// Export detained students as Excel
router.get('/detained-excel', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    query.isDetained = true;
    const detainedStudents = await Student.find(query).sort({ attendancePercentage: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detained Students');

    worksheet.columns = [
      { header: 'USN', key: 'usn', width: 12 },
      { header: 'Student Name', key: 'studentName', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 12 },
      { header: 'GPA', key: 'gpa', width: 8 },
      { header: 'Detention Reason', key: 'detentionReason', width: 30 }
    ];

    detainedStudents.forEach(student => {
      worksheet.addRow({
        usn: student.usn, studentName: student.studentName,
        department: student.department, semester: student.semester,
        section: student.section, attendancePercentage: student.attendancePercentage,
        gpa: student.gpa, detentionReason: student.detentionReason
      });
    });

    styleHeaderRow(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=detained_students.xlsx');
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export detained students as PDF
router.get('/detained-pdf', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    query.isDetained = true;
    const students = await Student.find(query).sort({ attendancePercentage: 1 });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const COLS = [
      { x: 30, w: 68, label: 'USN', align: 'center' },
      { x: 98, w: 110, label: 'Student Name', align: 'left' },
      { x: 208, w: 98, label: 'Department', align: 'left' },
      { x: 306, w: 30, label: 'Sem', align: 'center' },
      { x: 336, w: 28, label: 'Sec', align: 'center' },
      { x: 364, w: 58, label: 'Attendance %', align: 'center' },
      { x: 422, w: 38, label: 'GPA', align: 'center' },
      { x: 460, w: 352, label: 'Detention Reason', align: 'left' },
    ];
    const TABLE_LEFT = COLS[0].x;
    const TABLE_RIGHT = COLS[COLS.length - 1].x + COLS[COLS.length - 1].w;
    const TABLE_W = TABLE_RIGHT - TABLE_LEFT;
    const ROW_H = 18;
    const HDR_H = 22;
    const PAGE_H = 595.28;
    const FOOTER_Y = PAGE_H - 18;

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=detained_students.pdf');
    doc.pipe(res);

    const fillRect = (x, y, w, h, color) => doc.rect(x, y, w, h).fill(color);
    const drawText = (text, x, y, w, opts = {}) => {
      const { fontSize = 8, font = 'Helvetica', color = '#222222', align = 'center' } = opts;
      doc.font(font).fontSize(fontSize).fillColor(color).text(String(text ?? ''), x + 2, y, { width: w - 4, align, lineBreak: false });
    };

    const drawPageTitle = () => {
      fillRect(0, 0, 842, 42, '#1e3a5f');
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff').text('DETAINED STUDENTS REPORT', 0, 10, { width: 842, align: 'center' });
      doc.font('Helvetica').fontSize(7.5).fillColor('#aac4e0').text(`Generated: ${dateStr}${req.query.department ? '  |  Dept: ' + req.query.department : ''}  |  Total Detained: ${students.length}`, 0, 27, { width: 842, align: 'center' });
      return 46;
    };

    const drawColHeader = (y) => {
      fillRect(TABLE_LEFT, y, TABLE_W, HDR_H, '#c0392b');
      COLS.forEach(col => { drawText(col.label, col.x, y + 7, col.w, { font: 'Helvetica-Bold', color: '#ffffff', align: 'center' }); });
      return y + HDR_H;
    };

    const drawVLines = (yTop, yBot) => {
      doc.strokeColor('#aaaaaa').lineWidth(0.35);
      COLS.forEach(col => { doc.moveTo(col.x, yTop).lineTo(col.x, yBot).stroke(); });
      doc.moveTo(TABLE_RIGHT, yTop).lineTo(TABLE_RIGHT, yBot).stroke();
      doc.rect(TABLE_LEFT, yTop, TABLE_W, yBot - yTop).strokeColor('#888888').lineWidth(0.6).stroke();
    };

    const drawFooter = (pageNum) => {
      doc.font('Helvetica').fontSize(7).fillColor('#999999').text(`Student Performance Analysis Dashboard  |  Page ${pageNum}  |  Confidential`, 0, FOOTER_Y, { width: 842, align: 'center' });
    };

    const drawRow = (student, y, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#fdf0f0';
      fillRect(TABLE_LEFT, y, TABLE_W, ROW_H, bg);
      doc.moveTo(TABLE_LEFT, y + ROW_H).lineTo(TABLE_RIGHT, y + ROW_H).strokeColor('#ddc8c8').lineWidth(0.3).stroke();
      const textY = y + 5;
      const vals = [student.usn, student.studentName, student.department, student.semester, student.section, (student.attendancePercentage ?? 0) + '%', student.gpa, student.detentionReason || 'Attendance below 75%'];
      COLS.forEach((col, i) => {
        const isRed = i === 5 && (student.attendancePercentage ?? 100) < 65;
        drawText(vals[i], col.x, textY, col.w, { align: col.align, color: isRed ? '#c0392b' : '#222222' });
      });
    };

    let pageY = drawPageTitle();
    let tableTop = pageY;
    pageY = drawColHeader(pageY);
    let rowIdx = 0;
    let pageNum = 1;

    students.forEach(student => {
      if (pageY + ROW_H > FOOTER_Y - 10) {
        drawVLines(tableTop, pageY);
        drawFooter(pageNum++);
        doc.addPage();
        pageY = drawPageTitle();
        tableTop = pageY;
        pageY = drawColHeader(pageY);
        rowIdx = 0;
      }
      drawRow(student, pageY, rowIdx++);
      pageY += ROW_H;
    });

    drawVLines(tableTop, pageY);
    drawFooter(pageNum);
    doc.end();
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// All students Excel
router.get('/all-students-excel', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    const students = await Student.find(query).sort({ usn: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'USN', key: 'usn', width: 12 },
      { header: 'Name', key: 'studentName', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 12 },
      { header: 'Subject 1', key: 'subject1Marks', width: 10 },
      { header: 'Subject 2', key: 'subject2Marks', width: 10 },
      { header: 'Subject 3', key: 'subject3Marks', width: 10 },
      { header: 'Subject 4', key: 'subject4Marks', width: 10 },
      { header: 'Subject 5', key: 'subject5Marks', width: 10 },
      { header: 'Internal Marks', key: 'internalMarks', width: 12 },
      { header: 'GPA', key: 'gpa', width: 8 },
      { header: 'CGPA', key: 'cgpa', width: 8 },
      { header: 'Detained', key: 'isDetained', width: 10 }
    ];

    students.forEach(student => {
      worksheet.addRow({
        usn: student.usn, studentName: student.studentName,
        department: student.department, semester: student.semester,
        section: student.section, attendancePercentage: student.attendancePercentage,
        subject1Marks: student.subject1Marks, subject2Marks: student.subject2Marks,
        subject3Marks: student.subject3Marks, subject4Marks: student.subject4Marks,
        subject5Marks: student.subject5Marks, internalMarks: student.internalMarks,
        gpa: student.gpa, cgpa: student.cgpa,
        isDetained: student.isDetained ? 'Yes' : 'No'
      });
    });

    styleHeaderRow(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=all_students.xlsx');
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEW Export Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

// All students PDF
router.get('/all-students-pdf', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    const students = await Student.find(query).sort({ usn: 1 });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=all_students.pdf');
    doc.pipe(res);

    // Title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e3a5f').text('ALL STUDENTS REPORT', { align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(`Generated: ${dateStr} | Total: ${students.length} students${req.query.department ? ' | Dept: ' + req.query.department : ''}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const headers = ['USN', 'Name', 'Dept', 'Sem', 'Sec', 'Att%', 'GPA', 'CGPA', 'Status'];
    const colWidths = [70, 110, 80, 35, 30, 45, 40, 40, 60];
    let y = doc.y;
    let x = 30;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill('#1e3a5f');
      doc.fillColor('#ffffff').text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
      x += colWidths[i];
    });
    y += 20;

    // Rows
    doc.font('Helvetica').fontSize(7).fillColor('#333333');
    students.forEach((s, idx) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
        x = 30;
        doc.font('Helvetica-Bold').fontSize(8);
        headers.forEach((h, i) => {
          doc.rect(x, y, colWidths[i], 18).fill('#1e3a5f');
          doc.fillColor('#ffffff').text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(7).fillColor('#333333');
      }
      const bg = idx % 2 === 0 ? '#ffffff' : '#f0f4f8';
      x = 30;
      const vals = [s.usn, s.studentName, s.department, s.semester, s.section, `${s.attendancePercentage}%`, s.gpa, s.cgpa, s.isDetained ? 'Detained' : 'Active'];
      vals.forEach((v, i) => {
        doc.rect(x, y, colWidths[i], 16).fill(bg);
        doc.fillColor(i === 8 && s.isDetained ? '#c0392b' : '#333333').text(String(v ?? ''), x + 2, y + 4, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });
      y += 16;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Department report Excel
router.get('/department-report-excel', async (req, res) => {
  try {
    const students = await fetchStudents(buildQuery(req.query));
    let ranking = [];
    try {
      const result = await withErrorHandling(insightsAPI.departmentRanking(students));
      ranking = result.data || [];
    } catch (e) {
      // fall back to basic stats
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Department Analytics');

    worksheet.columns = [
      { header: 'Rank', key: 'rank', width: 8 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Weighted Score', key: 'weighted_score', width: 15 },
      { header: 'Total Students', key: 'total_students', width: 15 },
      { header: 'Mean GPA', key: 'mean_gpa', width: 12 },
      { header: 'Mean Attendance %', key: 'mean_attendance', width: 18 },
      { header: 'Pass %', key: 'pass_percentage', width: 10 },
      { header: 'Fail %', key: 'fail_percentage', width: 10 },
      { header: 'Detained Count', key: 'detained_count', width: 15 },
      { header: 'Detention Rate %', key: 'detention_rate', width: 15 },
      { header: 'Top Student', key: 'top_student_name', width: 20 },
      { header: 'Top Student GPA', key: 'top_student_gpa', width: 15 },
      { header: 'Avg Subject Marks', key: 'avg_subject_marks', width: 15 },
    ];

    ranking.forEach(r => {
      worksheet.addRow({
        rank: r.rank, department: r.department, weighted_score: r.weighted_score,
        total_students: r.total_students, mean_gpa: r.mean_gpa,
        mean_attendance: r.mean_attendance, pass_percentage: r.pass_percentage,
        fail_percentage: r.fail_percentage, detained_count: r.detained_count,
        detention_rate: r.detention_rate,
        top_student_name: r.top_student?.name || '', top_student_gpa: r.top_student?.gpa || '',
        avg_subject_marks: r.avg_subject_marks
      });
    });

    styleHeaderRow(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=department_report.xlsx');
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Department report PDF
router.get('/department-report-pdf', async (req, res) => {
  try {
    const students = await fetchStudents(buildQuery(req.query));
    let ranking = [];
    try {
      const result = await withErrorHandling(insightsAPI.departmentRanking(students));
      ranking = result.data || [];
    } catch (e) {}
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=department_report.pdf');
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e3a5f').text('DEPARTMENT ANALYTICS REPORT', { align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(`Generated: ${dateStr} | ${ranking.length} Departments`, { align: 'center' });
    doc.moveDown(1);

    const headers = ['Rank', 'Department', 'Score', 'Students', 'Avg GPA', 'Att%', 'Pass%', 'Detained', 'Top Student'];
    const colWidths = [35, 100, 50, 55, 55, 50, 50, 55, 130];
    let y = doc.y;
    let x = 30;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill('#1e3a5f');
      doc.fillColor('#ffffff').text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
      x += colWidths[i];
    });
    y += 20;

    doc.font('Helvetica').fontSize(7).fillColor('#333333');
    ranking.forEach((r, idx) => {
      x = 30;
      const bg = idx % 2 === 0 ? '#ffffff' : '#f0f4f8';
      const vals = [r.rank, r.department, r.weighted_score, r.total_students, r.mean_gpa, `${r.mean_attendance}%`, `${r.pass_percentage}%`, r.detained_count, `${r.top_student?.name || ''} (${r.top_student?.gpa || ''})`];
      vals.forEach((v, i) => {
        doc.rect(x, y, colWidths[i], 16).fill(bg);
        doc.fillColor('#333333').text(String(v ?? ''), x + 2, y + 4, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });
      y += 16;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Top performers Excel
router.get('/top-performers-excel', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    const limit = parseInt(req.query.limit) || 10;
    const students = await Student.find(query).sort({ gpa: -1 }).limit(limit);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Top Performers');

    worksheet.columns = [
      { header: 'Rank', key: 'rank', width: 8 },
      { header: 'USN', key: 'usn', width: 12 },
      { header: 'Name', key: 'studentName', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'GPA', key: 'gpa', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 12 },
      { header: 'Internal Marks', key: 'internalMarks', width: 12 },
    ];

    students.forEach((s, i) => {
      worksheet.addRow({
        rank: i + 1, usn: s.usn, studentName: s.studentName,
        department: s.department, semester: s.semester,
        gpa: s.gpa, cgpa: s.cgpa,
        attendancePercentage: s.attendancePercentage, internalMarks: s.internalMarks
      });
    });

    styleHeaderRow(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=top_${limit}_performers.xlsx`);
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Risk report Excel
router.get('/risk-report-excel', async (req, res) => {
  try {
    const students = await fetchStudents(buildQuery(req.query));
    let riskData = [];
    try {
      const result = await withErrorHandling(insightsAPI.riskScores(students));
      riskData = (result.data || []).filter(r => r.risk_level !== 'Low Risk');
    } catch (e) {}

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Academic Risk Report');

    worksheet.columns = [
      { header: 'USN', key: 'usn', width: 12 },
      { header: 'Name', key: 'studentName', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Risk Score', key: 'risk_score', width: 12 },
      { header: 'Risk Level', key: 'risk_level', width: 12 },
      { header: 'Attendance', key: 'attendance', width: 12 },
      { header: 'GPA', key: 'gpa', width: 10 },
      { header: 'Weak Subjects', key: 'weak_subjects', width: 15 },
      { header: 'Avg Marks', key: 'avg_marks', width: 12 },
    ];

    riskData.sort((a, b) => b.risk_score - a.risk_score).forEach(r => {
      worksheet.addRow({
        usn: r.usn, studentName: r.studentName,
        department: r.department, semester: r.semester,
        risk_score: r.risk_score, risk_level: r.risk_level,
        attendance: r.factors?.attendance, gpa: r.factors?.gpa,
        weak_subjects: r.factors?.weak_subjects, avg_marks: r.factors?.avg_marks
      });
    });

    styleHeaderRow(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=risk_report.xlsx');
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Risk report PDF
router.get('/risk-report-pdf', async (req, res) => {
  try {
    const students = await fetchStudents(buildQuery(req.query));
    let riskData = [];
    try {
      const result = await withErrorHandling(insightsAPI.riskScores(students));
      riskData = (result.data || []).filter(r => r.risk_level !== 'Low Risk');
    } catch (e) {}
    riskData.sort((a, b) => b.risk_score - a.risk_score);

    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=risk_report.pdf');
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#c0392b').text('ACADEMIC RISK ASSESSMENT REPORT', { align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(`Generated: ${dateStr} | ${riskData.length} at-risk students`, { align: 'center' });
    doc.moveDown(1);

    const headers = ['USN', 'Name', 'Dept', 'Score', 'Level', 'Att%', 'GPA', 'Weak Sub'];
    const colWidths = [70, 120, 80, 50, 70, 50, 50, 50];
    let y = doc.y;
    let x = 50;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill('#c0392b');
      doc.fillColor('#ffffff').text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
      x += colWidths[i];
    });
    y += 20;

    doc.font('Helvetica').fontSize(7).fillColor('#333333');
    riskData.forEach((r, idx) => {
      if (y > 550) { doc.addPage(); y = 30; }
      x = 50;
      const bg = idx % 2 === 0 ? '#ffffff' : '#fdf0f0';
      const vals = [r.usn, r.studentName, r.department, r.risk_score, r.risk_level, `${r.factors?.attendance}%`, r.factors?.gpa, r.factors?.weak_subjects];
      vals.forEach((v, i) => {
        doc.rect(x, y, colWidths[i], 16).fill(bg);
        doc.fillColor(i === 4 && r.risk_level === 'High Risk' ? '#c0392b' : '#333333').text(String(v ?? ''), x + 2, y + 4, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });
      y += 16;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Executive Summary PDF
router.get('/executive-summary-pdf', async (req, res) => {
  try {
    const allStudents = await Student.find(buildQuery(req.query)).lean();
    const students = await fetchStudents(buildQuery(req.query));
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const total = allStudents.length;

    // Calculate stats
    const avgGPA = total > 0 ? (allStudents.reduce((s, st) => s + st.gpa, 0) / total).toFixed(2) : 0;
    const avgAtt = total > 0 ? (allStudents.reduce((s, st) => s + st.attendancePercentage, 0) / total).toFixed(2) : 0;
    const passCount = allStudents.filter(s => s.gpa >= 5.5).length;
    const detainedCount = allStudents.filter(s => s.isDetained).length;

    let ranking = [];
    try {
      const result = await withErrorHandling(insightsAPI.departmentRanking(students));
      ranking = result.data || [];
    } catch (e) {}

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=executive_summary.pdf');
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 595, 80).fill('#1e3a5f');
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff').text('EXECUTIVE SUMMARY', 40, 20);
    doc.font('Helvetica').fontSize(10).fillColor('#aac4e0').text(`Student Performance Analysis | ${dateStr}`, 40, 48);

    doc.moveDown(3);

    // Key Metrics Section
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e3a5f').text('Key Performance Indicators', 40, 100);
    doc.moveDown(0.5);

    const metrics = [
      ['Total Students', total],
      ['Average GPA', avgGPA],
      ['Average Attendance', `${avgAtt}%`],
      ['Pass Rate', `${total > 0 ? ((passCount / total) * 100).toFixed(1) : 0}%`],
      ['Fail Rate', `${total > 0 ? (((total - passCount) / total) * 100).toFixed(1) : 0}%`],
      ['Detained Students', detainedCount],
    ];

    let my = doc.y;
    metrics.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const mx = 40 + col * 175;
      const mmy = my + row * 55;

      doc.rect(mx, mmy, 160, 45).fill('#f0f4f8').stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#666666').text(label, mx + 10, mmy + 8);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e3a5f').text(String(value), mx + 10, mmy + 22);
    });

    doc.y = my + 130;

    // Department Rankings
    if (ranking.length > 0) {
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e3a5f').text('Department Rankings', 40);
      doc.moveDown(0.5);

      ranking.forEach((r, i) => {
        if (doc.y > 750) { doc.addPage(); }
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(`${r.rank}. ${r.department}`, 50);
        doc.font('Helvetica').fontSize(8).fillColor('#666666').text(
          `Score: ${r.weighted_score} | GPA: ${r.mean_gpa} | Attendance: ${r.mean_attendance}% | Pass: ${r.pass_percentage}% | Students: ${r.total_students}`, 65
        );
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc.font('Helvetica').fontSize(7).fillColor('#999999');
    doc.text('Student Performance Analysis Dashboard | Confidential | Generated automatically', 40, 770, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
