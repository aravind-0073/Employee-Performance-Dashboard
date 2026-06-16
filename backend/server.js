import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Middleware
import { authMiddleware } from './middleware/authMiddleware.js';

// Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/export.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-dashboard')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Protected routes (auth required)
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
