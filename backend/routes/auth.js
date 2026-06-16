import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { generateToken, authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Demo data seed userId (used for cloning) ────────────────────────────────
const DEMO_SEED_EMAIL = '__demo_seed__@system.internal';

async function getOrCreateDemoSeedUser() {
  let demoUser = await User.findOne({ email: DEMO_SEED_EMAIL });
  if (!demoUser) {
    demoUser = new User({ email: DEMO_SEED_EMAIL, password: 'not-a-real-password-never-login', name: 'Demo Seed' });
    await demoUser.save();
  }
  return demoUser;
}

// Clone demo data for a new user
async function cloneDemoDataForUser(userId) {
  const demoUser = await getOrCreateDemoSeedUser();
  const demoStudents = await Student.find({ userId: demoUser._id }).lean();

  if (demoStudents.length === 0) return 0;

  const clonedStudents = demoStudents.map(s => {
    const { _id, __v, ...rest } = s;
    return { ...rest, userId };
  });

  const result = await Student.insertMany(clonedStudents, { ordered: false });
  return result.length;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Create user
    const user = new User({ email: email.toLowerCase(), password, name });
    await user.save();

    // Clone demo data for this user
    const clonedCount = await cloneDemoDataForUser(user._id);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, name: user.name },
        clonedStudents: clonedCount
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, name: user.name }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const studentCount = await Student.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, name: user.name },
        studentCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
export { getOrCreateDemoSeedUser };
