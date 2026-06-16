import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Get all students (scoped to user)
router.get('/', async (req, res) => {
  try {
    const { department, semester, section, page = 1, limit = 10 } = req.query;
    let query = { userId: req.userId };

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section;

    const skip = (page - 1) * limit;
    const students = await Student.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detained students
router.get('/detained/list', async (req, res) => {
  try {
    const detainedStudents = await Student.find({ userId: req.userId, isDetained: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: detainedStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single student by USN
router.get('/:usn', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId, usn: req.params.usn });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const student = new Student({ ...req.body, userId: req.userId });
    if (student.attendancePercentage < 75) {
      student.isDetained = true;
      student.detentionReason = 'Attendance below 75%';
    }
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update student
router.put('/:usn', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId, usn: req.params.usn });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    Object.assign(student, req.body);
    
    if (student.attendancePercentage < 75) {
      student.isDetained = true;
      student.detentionReason = 'Attendance below 75%';
    } else {
      student.isDetained = false;
      student.detentionReason = null;
    }

    await student.save();
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete student
router.delete('/:usn', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ userId: req.userId, usn: req.params.usn });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search students
router.post('/search', async (req, res) => {
  try {
    const { searchTerm, filters } = req.body;
    let query = { userId: req.userId };

    if (searchTerm) {
      query.$or = [
        { usn: new RegExp(searchTerm, 'i') },
        { studentName: new RegExp(searchTerm, 'i') }
      ];
    }

    if (filters?.department) query.department = filters.department;
    if (filters?.semester) query.semester = parseInt(filters.semester);
    if (filters?.section) query.section = filters.section;
    if (filters?.isDetained !== undefined) query.isDetained = filters.isDetained;

    if (filters?.attendanceRange) {
      query.attendancePercentage = {
        $gte: filters.attendanceRange[0],
        $lte: filters.attendanceRange[1]
      };
    }

    if (filters?.gpaRange) {
      query.gpa = {
        $gte: filters.gpaRange[0],
        $lte: filters.gpaRange[1]
      };
    }

    const students = await Student.find(query).limit(50);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
