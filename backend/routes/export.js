import express from 'express';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

function styleExcelHeader(worksheet, numColumns = 10) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate 800
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Full Employee Database
router.get('/excel/full-database', async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.userId }).sort({ employeeId: 1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employee Database');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 14 },
      { header: 'Employee Name', key: 'employeeName', width: 22 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Designation', key: 'designation', width: 25 },
      { header: 'Experience (Yrs)', key: 'experience', width: 15 },
      { header: 'Performance Score', key: 'performanceScore', width: 18 },
      { header: 'Productivity Score', key: 'productivityScore', width: 18 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
      { header: 'EPI (Index)', key: 'epi', width: 14 },
      { header: 'Performance Category', key: 'performanceCategory', width: 22 },
      { header: 'Risk Level', key: 'riskLevel', width: 14 },
      { header: 'Quality Score', key: 'qualityScore', width: 14 },
      { header: 'Target Rate %', key: 'targetCompletionRate', width: 15 },
      { header: 'Projects Done', key: 'projectsCompleted', width: 14 },
      { header: 'Manager', key: 'managerName', width: 20 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    styleExcelHeader(sheet);

    employees.forEach(e => {
      sheet.addRow({
        ...e,
        skills: Array.isArray(e.skills) ? e.skills.join(', ') : e.skills
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="workforce_full_database.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Performance Summary Excel
router.get('/excel/performance-summary', async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.userId }).sort({ performanceScore: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Performance Summary');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 14 },
      { header: 'Name', key: 'employeeName', width: 22 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Designation', key: 'designation', width: 24 },
      { header: 'Performance Score', key: 'performanceScore', width: 18 },
      { header: 'Productivity Score', key: 'productivityScore', width: 18 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
      { header: 'EPI Rating', key: 'epi', width: 14 },
      { header: 'Category', key: 'performanceCategory', width: 18 }
    ];

    styleExcelHeader(sheet);

    employees.forEach(e => {
      sheet.addRow(e);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_performance_summary.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Underperforming & Risk Assessment Excel
router.get('/excel/underperforming', async (req, res) => {
  try {
    const atRisk = await Employee.find({
      userId: req.userId,
      riskLevel: { $in: ['Critical', 'High', 'Medium'] }
    }).sort({ riskLevel: 1, performanceScore: 1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Underperforming & Risk');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 14 },
      { header: 'Name', key: 'employeeName', width: 22 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Designation', key: 'designation', width: 24 },
      { header: 'Risk Priority', key: 'riskLevel', width: 16 },
      { header: 'Performance', key: 'performanceScore', width: 14 },
      { header: 'Productivity', key: 'productivityScore', width: 14 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 14 },
      { header: 'Target Rate %', key: 'targetCompletionRate', width: 14 },
      { header: 'Manager', key: 'managerName', width: 20 },
      { header: 'Recommended Action', key: 'action', width: 32 }
    ];

    styleExcelHeader(sheet);

    atRisk.forEach(e => {
      let action = 'Regular check-in';
      if (e.riskLevel === 'Critical') action = 'Initiate Formal 30-Day PIP';
      else if (e.riskLevel === 'High') action = 'Bi-weekly Coaching & Skills Retraining';
      else if (e.riskLevel === 'Medium') action = 'Manager 1-on-1 Alignment Check';

      sheet.addRow({
        ...e,
        action
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="underperformance_risk_report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Departmental Benchmarking Excel
router.get('/excel/departmental-benchmark', async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.userId }).lean();

    const groups = {};
    for (const e of employees) {
      if (!groups[e.department]) groups[e.department] = [];
      groups[e.department].push(e);
    }

    const deptMetrics = Object.entries(groups).map(([dept, list]) => {
      const n = list.length;
      const avgPerf = list.reduce((a, b) => a + b.performanceScore, 0) / n;
      const avgProd = list.reduce((a, b) => a + b.productivityScore, 0) / n;
      const avgAtt = list.reduce((a, b) => a + b.attendancePercentage, 0) / n;
      const avgTarget = list.reduce((a, b) => a + b.targetCompletionRate, 0) / n;
      const score = Number(((0.40 * avgPerf) + (0.30 * avgProd) + (0.20 * avgAtt) + (0.10 * avgTarget)).toFixed(2));

      return {
        department: dept,
        headcount: n,
        compositeScore: score,
        averagePerformance: Number(avgPerf.toFixed(1)),
        averageProductivity: Number(avgProd.toFixed(1)),
        averageAttendance: Number(avgAtt.toFixed(1)),
        averageTargetAchievement: Number(avgTarget.toFixed(1)),
        highPerformers: list.filter(e => e.performanceScore >= 80).length,
        underperformers: list.filter(e => e.performanceScore < 60).length,
        manager: list[0]?.managerName || 'Department Head'
      };
    });

    deptMetrics.sort((a, b) => b.compositeScore - a.compositeScore);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Department Benchmarks');

    sheet.columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Composite Score', key: 'compositeScore', width: 18 },
      { header: 'Headcount', key: 'headcount', width: 14 },
      { header: 'Avg Performance', key: 'averagePerformance', width: 18 },
      { header: 'Avg Productivity', key: 'averageProductivity', width: 18 },
      { header: 'Avg Attendance %', key: 'averageAttendance', width: 18 },
      { header: 'High Performers', key: 'highPerformers', width: 16 },
      { header: 'Underperformers', key: 'underperformers', width: 16 },
      { header: 'Manager', key: 'manager', width: 22 }
    ];

    styleExcelHeader(sheet);

    deptMetrics.forEach((d, idx) => {
      sheet.addRow({ rank: idx + 1, ...d });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="department_benchmarks.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. High Performers Excel
router.get('/excel/high-performers', async (req, res) => {
  try {
    const highPerformers = await Employee.find({
      userId: req.userId,
      performanceScore: { $gte: 80 }
    }).sort({ performanceScore: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('High Performers');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 14 },
      { header: 'Name', key: 'employeeName', width: 22 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Designation', key: 'designation', width: 24 },
      { header: 'Performance Score', key: 'performanceScore', width: 18 },
      { header: 'Productivity Score', key: 'productivityScore', width: 18 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
      { header: 'EPI Rating', key: 'epi', width: 14 },
      { header: 'Projects Done', key: 'projectsCompleted', width: 14 }
    ];

    styleExcelHeader(sheet);

    highPerformers.forEach(e => {
      sheet.addRow(e);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="high_performing_employees.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Executive Workforce Performance Report (PDF)
router.get('/pdf/executive-workforce', async (req, res) => {
  try {
    const [user, employees] = await Promise.all([
      User.findById(req.userId).lean(),
      Employee.find({ userId: req.userId }).sort({ performanceScore: -1 }).lean()
    ]);

    const orgName = user?.organization || 'Enterprise Workforce HR';
    const total = employees.length;
    const avgPerf = total ? (employees.reduce((a, b) => a + b.performanceScore, 0) / total).toFixed(1) : '0';
    const avgProd = total ? (employees.reduce((a, b) => a + b.productivityScore, 0) / total).toFixed(1) : '0';
    const avgAtt = total ? (employees.reduce((a, b) => a + b.attendancePercentage, 0) / total).toFixed(1) : '0';
    const highCount = employees.filter(e => e.performanceScore >= 80).length;
    const underCount = employees.filter(e => e.performanceScore < 60).length;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="executive_workforce_report.pdf"');
    doc.pipe(res);

    // Header Banner
    doc.rect(40, 40, 515, 60).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(18).text(orgName.toUpperCase(), 55, 52, { bold: true });
    doc.fontSize(11).fillColor('#94A3B8').text('EXECUTIVE WORKFORCE PERFORMANCE REPORT', 55, 75);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString()} | Author: ${user?.name || 'HR Admin'}`, 340, 75);

    doc.moveDown(4);

    // Executive Metrics Summary
    doc.fillColor('#0F172A').fontSize(14).text('Executive KPI Summary', 40, 120, { bold: true });
    doc.rect(40, 138, 515, 1).fill('#E2E8F0');

    const kpis = [
      { label: 'Total Headcount', val: total.toString() },
      { label: 'Avg Performance', val: `${avgPerf}%` },
      { label: 'Avg Productivity', val: `${avgProd}%` },
      { label: 'Avg Attendance', val: `${avgAtt}%` },
      { label: 'High Performers', val: highCount.toString() },
      { label: 'Underperforming', val: underCount.toString() }
    ];

    let startX = 40;
    kpis.forEach((kpi, idx) => {
      const x = startX + (idx % 3) * 175;
      const y = 150 + Math.floor(idx / 3) * 55;
      doc.rect(x, y, 165, 45).fill('#F8FAFC');
      doc.rect(x, y, 165, 45).stroke('#CBD5E1');
      doc.fillColor('#64748B').fontSize(9).text(kpi.label, x + 10, y + 8);
      doc.fillColor('#0F172A').fontSize(16).text(kpi.val, x + 10, y + 22, { bold: true });
    });

    // Top Performers Table
    doc.fillColor('#0F172A').fontSize(14).text('Top Performing Leaders', 40, 280, { bold: true });
    doc.rect(40, 298, 515, 1).fill('#E2E8F0');

    // Table Header
    doc.rect(40, 310, 515, 20).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8);
    doc.text('ID', 45, 316, { width: 50 });
    doc.text('EMPLOYEE NAME', 100, 316, { width: 130 });
    doc.text('DEPARTMENT', 235, 316, { width: 90 });
    doc.text('PERF.', 330, 316, { width: 45 });
    doc.text('PROD.', 380, 316, { width: 45 });
    doc.text('ATTN.', 430, 316, { width: 45 });
    doc.text('EPI RATING', 480, 316, { width: 70 });

    let tableY = 330;
    employees.slice(0, 10).forEach((emp, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, tableY, 515, 18).fill(bg);
      doc.fillColor('#0F172A').fontSize(8);
      doc.text(emp.employeeId, 45, tableY + 5, { width: 50 });
      doc.text(emp.employeeName, 100, tableY + 5, { width: 130 });
      doc.text(emp.department, 235, tableY + 5, { width: 90 });
      doc.text(`${emp.performanceScore}%`, 330, tableY + 5, { width: 45 });
      doc.text(`${emp.productivityScore}%`, 380, tableY + 5, { width: 45 });
      doc.text(`${emp.attendancePercentage}%`, 430, tableY + 5, { width: 45 });
      doc.text(`${emp.epi || '--'} (${emp.performanceCategory || ''})`, 480, tableY + 5, { width: 70 });
      tableY += 18;
    });

    // Sign-off section
    doc.rect(40, 680, 515, 1).fill('#CBD5E1');
    doc.fillColor('#475569').fontSize(9);
    doc.text('Human Resources Sign-off: _______________________________', 50, 710);
    doc.text('Executive Review Date: ___________________', 350, 710);
    doc.fontSize(8).fillColor('#94A3B8').text('Confidential - For Internal Organizational Management Only', 170, 770);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Individual Employee Appraisal PDF
router.get('/pdf/employee/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.userId,
      employeeId: req.params.employeeId
    }).lean();

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="appraisal_${employee.employeeId}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(40, 40, 515, 55).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(16).text('INDIVIDUAL PERFORMANCE EVALUATION', 55, 50, { bold: true });
    doc.fontSize(10).fillColor('#94A3B8').text(`Confidential Performance Appraisal Record | ID: ${employee.employeeId}`, 55, 72);

    // Profile Box
    doc.rect(40, 110, 515, 80).fill('#F8FAFC');
    doc.rect(40, 110, 515, 80).stroke('#CBD5E1');

    doc.fillColor('#0F172A').fontSize(14).text(employee.employeeName, 55, 122, { bold: true });
    doc.fontSize(10).fillColor('#475569').text(`${employee.designation}  •  ${employee.department}`, 55, 140);
    doc.fontSize(9).text(`Experience: ${employee.experience} yrs  |  Joining Date: ${new Date(employee.joiningDate).toLocaleDateString()}`, 55, 158);
    doc.text(`Reporting Manager: ${employee.managerName || 'Unassigned'}  |  Email: ${employee.email || 'N/A'}`, 55, 172);

    // Key Operational Metrics Grid
    doc.fillColor('#0F172A').fontSize(12).text('Performance Metric Breakdown', 40, 210, { bold: true });
    doc.rect(40, 225, 515, 1).fill('#E2E8F0');

    const metrics = [
      { label: 'Performance Score', val: `${employee.performanceScore}%`, cat: employee.performanceCategory },
      { label: 'Productivity Score', val: `${employee.productivityScore}%`, cat: 'Daily Output' },
      { label: 'Attendance Rate', val: `${employee.attendancePercentage}%`, cat: 'Presence' },
      { label: 'Deliverable Quality', val: `${employee.qualityScore || 80}%`, cat: 'Accuracy' },
      { label: 'Target Achievement', val: `${employee.targetCompletionRate || 85}%`, cat: 'Milestones' },
      { label: 'Composite EPI Rating', val: `${employee.epi || 78}`, cat: 'Overall Index' }
    ];

    metrics.forEach((m, idx) => {
      const x = 40 + (idx % 3) * 175;
      const y = 240 + Math.floor(idx / 3) * 60;
      doc.rect(x, y, 165, 50).fill('#FFFFFF');
      doc.rect(x, y, 165, 50).stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(8).text(m.label, x + 10, y + 8);
      doc.fillColor('#0F172A').fontSize(15).text(m.val, x + 10, y + 20, { bold: true });
      doc.fillColor('#3B82F6').fontSize(8).text(m.cat, x + 10, y + 38);
    });

    // Recommendations and Development Section
    doc.fillColor('#0F172A').fontSize(12).text('Managerial Recommendations & Growth Action Plan', 40, 380, { bold: true });
    doc.rect(40, 395, 515, 1).fill('#E2E8F0');

    const actions = [
      employee.performanceScore >= 80
        ? 'Identified for high-potential leadership mentoring and cross-functional technical leadership.'
        : 'Recommended for targeted coaching in specific deliverable velocity and sprint planning.',
      employee.attendancePercentage < 75
        ? 'Mandatory HR attendance review to identify scheduling friction and ensure organizational compliance.'
        : 'Maintains healthy workplace attendance aligning with high operational standards.',
      'Quarterly goal realignment scheduled with department head.'
    ];

    actions.forEach((act, idx) => {
      doc.fillColor('#1E293B').fontSize(9).text(`•  ${act}`, 50, 410 + idx * 24, { width: 490 });
    });

    // Interventions History if any
    if (employee.interventions && employee.interventions.length > 0) {
      doc.fillColor('#0F172A').fontSize(12).text('Logged Interventions & Review History', 40, 500, { bold: true });
      doc.rect(40, 515, 515, 1).fill('#E2E8F0');

      let intY = 525;
      employee.interventions.slice(0, 4).forEach(item => {
        doc.fillColor('#475569').fontSize(8);
        doc.text(`${new Date(item.actionDate).toLocaleDateString()} - [${item.actionType}] by ${item.assignedBy}: ${item.note}`, 50, intY);
        intY += 16;
      });
    }

    // Signatures
    doc.rect(40, 680, 515, 1).fill('#CBD5E1');
    doc.fillColor('#475569').fontSize(9);
    doc.text('Employee Signature: _______________________', 50, 710);
    doc.text('Manager Signature: _______________________', 320, 710);
    doc.fontSize(8).fillColor('#94A3B8').text('Confidential HR Evaluation Record', 220, 770);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Performance Risk & PIP Intervention Report PDF
router.get('/pdf/performance-risk', async (req, res) => {
  try {
    const atRisk = await Employee.find({
      userId: req.userId,
      riskLevel: { $in: ['Critical', 'High', 'Medium'] }
    }).sort({ riskLevel: 1, performanceScore: 1 }).lean();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="workforce_risk_intervention_report.pdf"');
    doc.pipe(res);

    // Header
    doc.rect(40, 40, 515, 55).fill('#7F1D1D'); // Crimson
    doc.fillColor('#FFFFFF').fontSize(16).text('WORKFORCE RISK & PIP INTERVENTION REPORT', 55, 50, { bold: true });
    doc.fontSize(10).fillColor('#FECACA').text(`Actionable Underperformance Audit | ${atRisk.length} Employees Requiring Managerial Review`, 55, 72);

    doc.fillColor('#0F172A').fontSize(11).text('Underperforming Employees Prioritization Matrix', 40, 115, { bold: true });
    doc.rect(40, 130, 515, 1).fill('#E2E8F0');

    // Table Header
    doc.rect(40, 140, 515, 20).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8);
    doc.text('ID', 45, 146, { width: 50 });
    doc.text('EMPLOYEE', 100, 146, { width: 110 });
    doc.text('DEPT', 215, 146, { width: 75 });
    doc.text('PRIORITY', 295, 146, { width: 60 });
    doc.text('PERF.', 360, 146, { width: 40 });
    doc.text('ATTN.', 405, 146, { width: 40 });
    doc.text('RECOMMENDED INTERVENTION', 450, 146, { width: 100 });

    let tableY = 160;
    atRisk.forEach((emp, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#FFF1F2';
      doc.rect(40, tableY, 515, 22).fill(bg);
      doc.fillColor('#0F172A').fontSize(8);
      doc.text(emp.employeeId, 45, tableY + 6, { width: 50 });
      doc.text(emp.employeeName, 100, tableY + 6, { width: 110 });
      doc.text(emp.department, 215, tableY + 6, { width: 75 });

      const pColor = emp.riskLevel === 'Critical' ? '#DC2626' : emp.riskLevel === 'High' ? '#EA580C' : '#D97706';
      doc.fillColor(pColor).text(emp.riskLevel, 295, tableY + 6, { width: 60, bold: true });

      doc.fillColor('#0F172A').text(`${emp.performanceScore}%`, 360, tableY + 6, { width: 40 });
      doc.text(`${emp.attendancePercentage}%`, 405, tableY + 6, { width: 40 });

      let action = '1-on-1 Check-in';
      if (emp.riskLevel === 'Critical') action = 'Formal 30-Day PIP';
      else if (emp.riskLevel === 'High') action = 'Bi-weekly Retraining';
      doc.text(action, 450, tableY + 6, { width: 100 });

      tableY += 22;
      if (tableY > 720) {
        doc.addPage();
        tableY = 40;
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
