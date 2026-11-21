import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

// Middleware
import { authMiddleware } from './middleware/authMiddleware.js';

// Routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/export.js';

// Seed Helper
import { seedInitialAdminAndData } from './scripts/seedDatabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Robust Database Connection with MongoMemoryServer Auto-Fallback
// ─────────────────────────────────────────────────────────────────────────────
let mongoMemoryServerInstance = null;

async function connectToDatabase() {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri && !primaryUri.includes('cluster0.zrqsns8.mongodb.net')) {
    try {
      console.log(`Connecting to configured MongoDB URI...`);
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
      console.log('✓ Successfully connected to MongoDB');
      await seedInitialAdminAndData();
      return;
    } catch (err) {
      console.warn(`[Database] Connection to MONGODB_URI failed (${err.message}). Falling back to local/in-memory instance.`);
    }
  }

  // Try local mongod on 127.0.0.1:27017
  try {
    const localUri = 'mongodb://127.0.0.1:27017/employee-dashboard';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`✓ Connected to local MongoDB daemon (${localUri})`);
    await seedInitialAdminAndData();
    return;
  } catch (err) {
    console.log('[Database] Local MongoDB daemon not detected. Initializing managed MongoMemoryServer engine...');
  }

  // Spin up high-performance MongoMemoryServer
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();
    console.log(`✓ Managed MongoMemoryServer started at: ${memoryUri}`);

    await mongoose.connect(memoryUri);
    console.log('✓ Connected to MongoMemoryServer workforce database');
    await seedInitialAdminAndData();
  } catch (fatalErr) {
    console.error('Fatal: Could not initialize any MongoDB instance:', fatalErr);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// Public routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Workforce API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Protected routes (Scoped to authenticated organization/user)
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/students', authMiddleware, employeeRoutes); // Compatibility alias
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Service Orchestration: Python FastAPI Microservice Check & Spawn
// ─────────────────────────────────────────────────────────────────────────────
function checkAnalyticsHealth(baseUrl) {
  return new Promise((resolve) => {
    const url = `${baseUrl.replace(/\/$/, '')}/health`;
    const req = http.get(url, { timeout: 2000 }, (res) => {
      if (res.statusCode === 200) resolve(true);
      else resolve(false);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

let pyChildProcess = null;

async function startAnalyticsService() {
  const analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';
  const isLocal = analyticsUrl.includes('localhost') || analyticsUrl.includes('127.0.0.1');

  if (!isLocal) {
    console.log(`Analytics service is remote (${analyticsUrl}). Skipping local startup.`);
    return;
  }

  console.log('Checking Python Analytics Service health...');
  const isHealthy = await checkAnalyticsHealth(analyticsUrl);
  if (isHealthy) {
    console.log('✓ Python Analytics Service is already active on port 8000.');
    return;
  }

  console.log('Python Analytics Service is offline. Automatically starting managed child process...');
  const analyticsDir = path.join(__dirname, '..', 'analytics');
  
  // Prefer venv python, fallback to system python
  const venvPythonWin = path.join(analyticsDir, 'venv', 'Scripts', 'python.exe');
  const venvPythonPosix = path.join(analyticsDir, 'venv', 'bin', 'python');

  let pythonExe = 'python';
  if (process.platform === 'win32' && fs.existsSync(venvPythonWin)) {
    pythonExe = venvPythonWin;
  } else if (process.platform !== 'win32' && fs.existsSync(venvPythonPosix)) {
    pythonExe = venvPythonPosix;
  }

  const scriptPath = path.join(analyticsDir, 'main.py');
  console.log(`[Orchestration] Spawning: ${pythonExe} ${scriptPath}`);

  pyChildProcess = spawn(pythonExe, ['-u', scriptPath], {
    cwd: analyticsDir,
    stdio: 'inherit',
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pyChildProcess.on('error', (err) => {
    console.error('[Orchestration] Failed to start Python service:', err);
  });

  pyChildProcess.on('exit', (code, signal) => {
    console.log(`[Orchestration] Python process exited (code: ${code}, signal: ${signal})`);
  });

  // Wait a few seconds for initialization
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const healthyNow = await checkAnalyticsHealth(analyticsUrl);
    if (healthyNow) {
      console.log('✓ Python Analytics Engine initialized and verified healthy.');
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  EMPLOYEE PERFORMANCE & ANALYTICS GATEWAY`);
  console.log(`  Backend listening on http://localhost:${PORT}`);
  console.log(`====================================================`);

  await connectToDatabase();
  await startAnalyticsService();
});

// Graceful cleanup on termination
async function gracefulShutdown() {
  console.log('\nShutting down backend gracefully...');
  if (pyChildProcess) {
    console.log('Terminating Python child process...');
    pyChildProcess.kill();
  }
  if (mongoMemoryServerInstance) {
    console.log('Stopping MongoMemoryServer...');
    await mongoMemoryServerInstance.stop();
  }
  await mongoose.disconnect();
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
