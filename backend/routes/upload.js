import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Upload and parse file (scoped to user)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, error: 'File is empty' });
    }

    // Validate and transform data — stamp with userId
    const transformedData = jsonData.map(row => ({
      userId: req.userId,
      usn: row.USN || row.usn || '',
      studentName: row.StudentName || row.studentName || '',
      department: row.Department || row.department || '',
      semester: parseInt(row.Semester || row.semester || 0),
      section: row.Section || row.section || '',
      attendancePercentage: parseFloat(row.AttendancePercentage || row.attendancePercentage || 0),
      subject1Marks: parseFloat(row.Subject1Marks || row.subject1Marks || 0),
      subject2Marks: parseFloat(row.Subject2Marks || row.subject2Marks || 0),
      subject3Marks: parseFloat(row.Subject3Marks || row.subject3Marks || 0),
      subject4Marks: parseFloat(row.Subject4Marks || row.subject4Marks || 0),
      subject5Marks: parseFloat(row.Subject5Marks || row.subject5Marks || 0),
      internalMarks: parseFloat(row.InternalMarks || row.internalMarks || 0),
      gpa: parseFloat(row.GPA || row.gpa || 0),
      cgpa: parseFloat(row.CGPA || row.cgpa || 0),
      email: row.Email || row.email || '',
      phone: row.Phone || row.phone || '',
      parentName: row.ParentName || row.parentName || '',
      parentPhone: row.ParentPhone || row.parentPhone || '',
      counselorName: row.CounselorName || row.counselorName || ''
    }));

    // Validate required fields
    const errors = [];
    const validData = [];

    transformedData.forEach((row, index) => {
      if (!row.usn || !row.studentName || !row.department) {
        errors.push(`Row ${index + 2}: Missing required fields (USN, StudentName, Department)`);
      } else {
        validData.push(row);
      }
    });

    // Clear existing data for THIS USER only, or append
    const clearExisting = req.body.clearExisting === 'true';
    if (clearExisting) {
      await Student.deleteMany({ userId: req.userId });
    }

    // Insert valid data
    const insertedCount = validData.length;
    const insertedStudents = await Student.insertMany(validData, { ordered: false });

    // Auto-set detention status
    await Promise.all(
      insertedStudents.map(student => {
        if (student.attendancePercentage < 75) {
          return Student.updateOne(
            { _id: student._id },
            { isDetained: true, detentionReason: 'Attendance below 75%' }
          );
        }
      })
    );

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `${insertedCount} students uploaded successfully`,
      data: {
        totalRows: jsonData.length,
        insertedCount,
        failedCount: errors.length,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete all students (for THIS USER only)
router.delete('/all/data', async (req, res) => {
  try {
    const result = await Student.deleteMany({ userId: req.userId });
    res.json({
      success: true,
      message: `${result.deletedCount} students deleted`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
