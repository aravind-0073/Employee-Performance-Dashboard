import express from 'express';
import Employee, { calculateEmployeeMetrics } from '../models/Employee.js';

const router = express.Router();

// GET /api/employees - Search, filter, and paginate employees (scoped to userId)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      department,
      designation,
      experienceMin,
      experienceMax,
      performanceCategory,
      riskLevel,
      status,
      sortBy = 'performanceScore',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = { userId: req.userId };

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { employeeId: reg },
        { employeeName: reg },
        { department: reg },
        { designation: reg }
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (designation && designation !== 'All') {
      query.designation = designation;
    }

    if (performanceCategory && performanceCategory !== 'All') {
      query.performanceCategory = performanceCategory;
    }

    if (riskLevel && riskLevel !== 'All') {
      query.riskLevel = riskLevel;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (experienceMin !== undefined || experienceMax !== undefined) {
      query.experience = {};
      if (experienceMin !== undefined && experienceMin !== '') query.experience.$gte = Number(experienceMin);
      if (experienceMax !== undefined && experienceMax !== '') query.experience.$lte = Number(experienceMax);
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [employees, total] = await Promise.all([
      Employee.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Employee.countDocuments(query)
    ]);

    // Unique departments and designations for filter dropdowns
    const [departments, designations] = await Promise.all([
      Employee.distinct('department', { userId: req.userId }),
      Employee.distinct('designation', { userId: req.userId })
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      },
      filters: {
        departments: departments.sort(),
        designations: designations.sort()
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/employees/risks/list - Quick access for underperforming employees
router.get('/risks/list', async (req, res) => {
  try {
    const list = await Employee.find({
      userId: req.userId,
      riskLevel: { $in: ['Critical', 'High', 'Medium'] }
    }).sort({ riskLevel: 1, performanceScore: 1 }).lean();

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/employees/:employeeId - Get single employee by ID
router.get('/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.userId,
      employeeId: req.params.employeeId
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: `Employee ${req.params.employeeId} not found` });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/employees - Add new employee
router.post('/', async (req, res) => {
  try {
    const existing = await Employee.findOne({
      userId: req.userId,
      employeeId: req.body.employeeId?.trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Employee ID ${req.body.employeeId} already exists in your organization`
      });
    }

    const employee = new Employee({
      ...req.body,
      userId: req.userId
    });

    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/employees/:employeeId - Update employee
router.put('/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.userId,
      employeeId: req.params.employeeId
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: `Employee ${req.params.employeeId} not found` });
    }

    // Merge updates
    Object.assign(employee, req.body);
    // Explicitly recalculate metrics
    const metrics = calculateEmployeeMetrics(employee);
    employee.epi = metrics.epi;
    employee.performanceCategory = metrics.performanceCategory;
    employee.riskLevel = metrics.riskLevel;

    await employee.save();
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/employees/:employeeId - Delete employee
router.delete('/:employeeId', async (req, res) => {
  try {
    const result = await Employee.findOneAndDelete({
      userId: req.userId,
      employeeId: req.params.employeeId
    });

    if (!result) {
      return res.status(404).json({ success: false, error: `Employee ${req.params.employeeId} not found` });
    }

    res.json({ success: true, message: `Employee ${req.params.employeeId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/employees/:employeeId/interventions - Log an HR intervention (PIP, review, note)
router.post('/:employeeId/interventions', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.userId,
      employeeId: req.params.employeeId
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: `Employee ${req.params.employeeId} not found` });
    }

    const { actionType, note, assignedBy } = req.body;
    employee.interventions.push({
      actionType: actionType || 'Review Meeting',
      note: note || 'Intervention scheduled',
      assignedBy: assignedBy || 'HR Manager',
      actionDate: new Date()
    });

    await employee.save();
    res.json({ success: true, data: employee.interventions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
