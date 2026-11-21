import express from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import Employee, { calculateEmployeeMetrics } from '../models/Employee.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const isMatch = validExts.some(ext => file.originalname.toLowerCase().endsWith(ext));
    if (isMatch) cb(null, true);
    else cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
  }
});

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/[\s_-]/g, '');
}

const REQUIRED_HEADERS = [
  'employeeid',
  'employeename',
  'department',
  'designation',
  'experience',
  'attendancepercentage',
  'performancescore',
  'productivityscore'
];

const SAMPLE_EMPLOYEES = [
  {
    EmployeeID: 'EMP001',
    EmployeeName: 'Sarah Jenkins',
    Department: 'Engineering',
    Designation: 'Senior Software Engineer',
    Experience: 6.5,
    AttendancePercentage: 96.5,
    WorkingHours: 45.0,
    TrainingHours: 42.0,
    JobSatisfaction: 4.8,
    Workload: 3.5,
    PreviousPerformanceRating: 4.6,
    ProductivityScore: 94.0,
    PerformanceScore: 92.0,
    QualityScore: 91.5,
    TargetCompletionRate: 95.0,
    ProjectsCompleted: 14,
    TasksCompleted: 86,
    Salary: 125000,
    JoiningDate: '2020-03-15',
    ManagerName: 'David Vance',
    Skills: 'React, Node.js, Python, Architecture',
    Email: 'sarah.jenkins@workforce.io',
    Phone: '+1 (555) 234-5678'
  },
  {
    EmployeeID: 'EMP002',
    EmployeeName: 'Marcus Chen',
    Department: 'Sales',
    Designation: 'Account Executive',
    Experience: 4.0,
    AttendancePercentage: 92.0,
    WorkingHours: 44.0,
    TrainingHours: 28.0,
    JobSatisfaction: 4.5,
    Workload: 3.2,
    PreviousPerformanceRating: 4.2,
    ProductivityScore: 89.0,
    PerformanceScore: 88.5,
    QualityScore: 86.0,
    TargetCompletionRate: 98.0,
    ProjectsCompleted: 9,
    TasksCompleted: 64,
    Salary: 95000,
    JoiningDate: '2021-06-01',
    ManagerName: 'Rachel Miller',
    Skills: 'B2B Sales, CRM, Negotiation',
    Email: 'marcus.chen@workforce.io',
    Phone: '+1 (555) 345-6789'
  },
  {
    EmployeeID: 'EMP003',
    EmployeeName: 'Jessica Morales',
    Department: 'Marketing',
    Designation: 'Marketing Lead',
    Experience: 5.0,
    AttendancePercentage: 88.0,
    WorkingHours: 40.0,
    TrainingHours: 20.0,
    JobSatisfaction: 3.6,
    Workload: 3.0,
    PreviousPerformanceRating: 3.5,
    ProductivityScore: 79.5,
    PerformanceScore: 78.0,
    QualityScore: 82.0,
    TargetCompletionRate: 85.0,
    ProjectsCompleted: 7,
    TasksCompleted: 45,
    Salary: 88000,
    JoiningDate: '2022-01-10',
    ManagerName: 'Rachel Miller',
    Skills: 'SEO, Content Strategy, Analytics',
    Email: 'jessica.m@workforce.io',
    Phone: '+1 (555) 456-7890'
  },
  {
    EmployeeID: 'EMP004',
    EmployeeName: 'Alex Rivera',
    Department: 'Engineering',
    Designation: 'Junior Developer',
    Experience: 1.5,
    AttendancePercentage: 72.0,
    WorkingHours: 35.0,
    TrainingHours: 12.0,
    JobSatisfaction: 2.2,
    Workload: 2.4,
    PreviousPerformanceRating: 2.3,
    ProductivityScore: 58.0,
    PerformanceScore: 54.0,
    QualityScore: 62.0,
    TargetCompletionRate: 60.0,
    ProjectsCompleted: 2,
    TasksCompleted: 22,
    Salary: 68000,
    JoiningDate: '2023-08-15',
    ManagerName: 'David Vance',
    Skills: 'JavaScript, HTML, CSS',
    Email: 'alex.rivera@workforce.io',
    Phone: '+1 (555) 567-8901'
  }
];

// GET /api/upload/template/excel
router.get('/template/excel', (req, res) => {
  try {
    const ws = xlsx.utils.json_to_sheet(SAMPLE_EMPLOYEES);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Employees');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/upload/template/csv
router.get('/template/csv', (req, res) => {
  try {
    const ws = xlsx.utils.json_to_sheet(SAMPLE_EMPLOYEES);
    const csv = xlsx.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', 'attachment; filename="employee_template.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const mode = req.body.mode || 'append';

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: null });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded file is empty or contains no records.' });
    }

    const firstRow = rawRows[0];
    const presentNormalizedKeys = Object.keys(firstRow).map(normalizeKey);
    const missingHeaders = REQUIRED_HEADERS.filter(reqKey => !presentNormalizedKeys.includes(reqKey));

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required column headers: ${missingHeaders.join(', ')}. Please use the downloadable template.`,
        requiredHeaders: [
          'EmployeeID', 'EmployeeName', 'Department', 'Designation',
          'Experience', 'AttendancePercentage', 'PerformanceScore', 'ProductivityScore'
        ]
      });
    }

    const validRecords = [];
    const errors = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const keyMap = {};
      for (const [k, v] of Object.entries(row)) {
        keyMap[normalizeKey(k)] = v;
      }

      const empId = keyMap['employeeid']?.toString().trim();
      const empName = keyMap['employeename']?.toString().trim();
      const dept = keyMap['department']?.toString().trim();
      const desig = keyMap['designation']?.toString().trim();
      const exp = parseFloat(keyMap['experience']);
      const att = parseFloat(keyMap['attendancepercentage']);
      const perf = parseFloat(keyMap['performancescore']);
      const prod = parseFloat(keyMap['productivityscore']);

      const rowErrors = [];
      if (!empId) rowErrors.push('Missing EmployeeID');
      if (!empName) rowErrors.push('Missing EmployeeName');
      if (!dept) rowErrors.push('Missing Department');
      if (!desig) rowErrors.push('Missing Designation');
      if (isNaN(exp) || exp < 0) rowErrors.push('Experience must be a positive number');
      if (isNaN(att) || att < 0 || att > 100) rowErrors.push('Attendance must be between 0 and 100');
      if (isNaN(perf) || perf < 0 || perf > 100) rowErrors.push('PerformanceScore must be between 0 and 100');
      if (isNaN(prod) || prod < 0 || prod > 100) rowErrors.push('ProductivityScore must be between 0 and 100');

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, employeeId: empId || 'Unknown', errors: rowErrors });
        return;
      }

      // Academic ML and operational fields
      const workingHours = keyMap['workinghours'] !== undefined && !isNaN(parseFloat(keyMap['workinghours'])) ? parseFloat(keyMap['workinghours']) : 40.0;
      const trainingHours = keyMap['traininghours'] !== undefined && !isNaN(parseFloat(keyMap['traininghours'])) ? parseFloat(keyMap['traininghours']) : 20.0;
      const jobSatisfaction = keyMap['jobsatisfaction'] !== undefined && !isNaN(parseFloat(keyMap['jobsatisfaction'])) ? parseFloat(keyMap['jobsatisfaction']) : 3.8;
      const workload = keyMap['workload'] !== undefined && !isNaN(parseFloat(keyMap['workload'])) ? parseFloat(keyMap['workload']) : 3.2;
      const previousPerformanceRating = keyMap['previousperformancerating'] !== undefined && !isNaN(parseFloat(keyMap['previousperformancerating'])) ? parseFloat(keyMap['previousperformancerating']) : 3.5;

      const quality = keyMap['qualityscore'] !== undefined && !isNaN(parseFloat(keyMap['qualityscore'])) ? parseFloat(keyMap['qualityscore']) : 80;
      const targetRate = keyMap['targetcompletionrate'] !== undefined && !isNaN(parseFloat(keyMap['targetcompletionrate'])) ? parseFloat(keyMap['targetcompletionrate']) : 85;
      const projects = keyMap['projectscompleted'] !== undefined && !isNaN(parseInt(keyMap['projectscompleted'])) ? parseInt(keyMap['projectscompleted']) : 0;
      const tasks = keyMap['taskscompleted'] !== undefined && !isNaN(parseInt(keyMap['taskscompleted'])) ? parseInt(keyMap['taskscompleted']) : 0;
      const salary = keyMap['salary'] !== undefined && !isNaN(parseFloat(keyMap['salary'])) ? parseFloat(keyMap['salary']) : 0;
      const manager = keyMap['managername']?.toString().trim() || 'Unassigned';
      const email = keyMap['email']?.toString().trim() || `${empId.toLowerCase()}@workforce.io`;
      const phone = keyMap['phone']?.toString().trim() || '';

      let skillsArray = [];
      if (keyMap['skills']) {
        skillsArray = keyMap['skills'].toString().split(',').map(s => s.trim()).filter(Boolean);
      }

      let joiningDate = new Date();
      if (keyMap['joiningdate']) {
        const parsedDate = new Date(keyMap['joiningdate']);
        if (!isNaN(parsedDate.getTime())) joiningDate = parsedDate;
      }

      const rec = {
        userId: req.userId,
        employeeId: empId,
        employeeName: empName,
        department: dept,
        designation: desig,
        experience: exp,
        attendancePercentage: att,
        performanceScore: perf,
        productivityScore: prod,
        workingHours,
        trainingHours,
        jobSatisfaction,
        workload,
        previousPerformanceRating,
        qualityScore: quality,
        targetCompletionRate: targetRate,
        projectsCompleted: projects,
        tasksCompleted: tasks,
        salary,
        joiningDate,
        managerName: manager,
        skills: skillsArray,
        email,
        phone,
        status: 'Active'
      };

      const metrics = calculateEmployeeMetrics(rec);
      rec.epi = metrics.epi;
      rec.performanceCategory = metrics.performanceCategory;
      rec.riskLevel = metrics.riskLevel;

      validRecords.push(rec);
    });

    if (validRecords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid employee records found in file.',
        validationErrors: errors
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    if (mode === 'overwrite') {
      await Employee.deleteMany({ userId: req.userId });
      await Employee.insertMany(validRecords);
      insertedCount = validRecords.length;
    } else {
      for (const rec of validRecords) {
        const resOp = await Employee.findOneAndUpdate(
          { userId: req.userId, employeeId: rec.employeeId },
          { $set: rec },
          { upsert: true, new: false }
        );
        if (resOp) updatedCount++;
        else insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${validRecords.length} records (${mode} mode).`,
      summary: {
        totalRows: rawRows.length,
        validProcessed: validRecords.length,
        insertedCount,
        updatedCount,
        errorCount: errors.length
      },
      validationErrors: errors.length > 0 ? errors.slice(0, 20) : []
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
