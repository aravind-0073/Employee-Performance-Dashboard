import express from 'express';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { generateRealisticEmployees } from '../scripts/seedDatabase.js';
import { generateToken, authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organization, role, seedDemoData = true } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email is already registered' });
    }

    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      organization: organization?.trim() || 'Nexus Global Enterprises',
      role: role || 'HR Administrator'
    });

    await user.save();

    // Populate realistic workforce dataset for new organization/user
    let initialCount = 0;
    if (seedDemoData) {
      const demoEmployees = generateRealisticEmployees(user._id, 60);
      await Employee.insertMany(demoEmployees);
      initialCount = demoEmployees.length;
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role
        },
        initialDatasetCount: initialCount
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Ensure user has at least some employees for demo purposes
    const count = await Employee.countDocuments({ userId: user._id });
    if (count === 0) {
      const dummyData = generateRealisticEmployees(user._id, 60);
      await Employee.insertMany(dummyData);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization || 'Nexus Global Enterprises',
          role: user.role || 'HR Administrator'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const employeeCount = await Employee.countDocuments({ userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization || 'Nexus Global Enterprises',
          role: user.role || 'HR Administrator'
        },
        employeeCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
