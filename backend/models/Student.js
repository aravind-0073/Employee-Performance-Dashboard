import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  usn: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  attendancePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  subject1Marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  subject2Marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  subject3Marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  subject4Marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  subject5Marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  internalMarks: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  },
  gpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  cgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  parentName: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  counselorName: {
    type: String,
    trim: true
  },
  isDetained: {
    type: Boolean,
    default: false
  },
  detentionReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for better query performance
studentSchema.index({ userId: 1, department: 1, semester: 1, section: 1 });
studentSchema.index({ userId: 1, usn: 1 }, { unique: true });
studentSchema.index({ userId: 1, isDetained: 1 });

export default mongoose.model('Student', studentSchema);
