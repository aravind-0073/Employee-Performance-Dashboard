import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['PIP', 'Review Meeting', 'Manager 1-on-1', 'Skill Training', 'Workload Adjustment', 'Note'],
    default: 'Review Meeting'
  },
  note: {
    type: String,
    trim: true
  },
  actionDate: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: String,
    default: 'HR Manager'
  }
}, { _id: true });

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  attendancePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  performanceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  productivityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Academic Data Mining & HR Attributes
  workingHours: {
    type: Number,
    default: 40,
    min: 10,
    max: 80
  },
  trainingHours: {
    type: Number,
    default: 20,
    min: 0
  },
  jobSatisfaction: {
    type: Number,
    default: 3.8,
    min: 1,
    max: 5
  },
  workload: {
    type: Number,
    default: 3.2,
    min: 1,
    max: 5
  },
  previousPerformanceRating: {
    type: Number,
    default: 3.5,
    min: 1,
    max: 5
  },
  // Additional Optional Fields
  qualityScore: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  targetCompletionRate: {
    type: Number,
    default: 85,
    min: 0,
    max: 100
  },
  projectsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  salary: {
    type: Number,
    default: 0,
    min: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  managerName: {
    type: String,
    trim: true,
    default: 'Unassigned'
  },
  skills: {
    type: [String],
    default: []
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Under Review', 'Terminated'],
    default: 'Active'
  },
  epi: {
    type: Number,
    default: 0
  },
  performanceCategory: {
    type: String,
    enum: ['Critical', 'Needs Improvement', 'Average', 'Good', 'Excellent', 'Low', 'Medium', 'High'],
    default: 'Medium'
  },
  riskLevel: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Low'
  },
  interventions: [interventionSchema]
}, {
  timestamps: true
});

// Compound Indexes for fast multi-tenant queries
employeeSchema.index({ userId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ userId: 1, department: 1, designation: 1 });
employeeSchema.index({ userId: 1, riskLevel: 1 });
employeeSchema.index({ userId: 1, performanceCategory: 1 });

// Helper to compute EPI, 3-tier ML class & 5-tier category, and risk level
export function calculateEmployeeMetrics(emp) {
  const prod = Number(emp.productivityScore) || 0;
  const quality = Number(emp.qualityScore) || 80;
  const att = Number(emp.attendancePercentage) || 0;
  const target = Number(emp.targetCompletionRate) || 85;
  const tasks = Number(emp.tasksCompleted) || 0;
  const taskScore = tasks > 0 ? Math.min(100, tasks * 5) : target;

  // EPI Formula:
  // EPI = (30% * Productivity) + (25% * Quality) + (20% * Attendance) + (15% * TargetAchievement) + (10% * TaskCompletion)
  const epi = Number((
    (0.30 * prod) +
    (0.25 * quality) +
    (0.20 * att) +
    (0.15 * target) +
    (0.10 * taskScore)
  ).toFixed(2));

  // 5-Tier Executive Category
  let category = 'Average';
  if (epi >= 85) category = 'Excellent';
  else if (epi >= 75) category = 'Good';
  else if (epi >= 65) category = 'Average';
  else if (epi >= 50) category = 'Needs Improvement';
  else category = 'Critical';

  // 3-Tier Academic Machine Learning Classification Target:
  // Low (< 65), Medium (65 - 79.9), High (>= 80)
  const perf = Number(emp.performanceScore) || 0;
  let mlCategory = 'Medium';
  if (perf < 65) mlCategory = 'Low';
  else if (perf >= 80) mlCategory = 'High';
  else mlCategory = 'Medium';

  let risk = 'Low';
  if (epi < 50 || (perf < 50 && att < 70)) {
    risk = 'Critical';
  } else if (epi < 65 || perf < 60 || att < 75) {
    risk = 'High';
  } else if (epi < 75 || perf < 70) {
    risk = 'Medium';
  } else {
    risk = 'Low';
  }

  return { epi, performanceCategory: category, mlCategory, riskLevel: risk };
}

employeeSchema.pre('save', function (next) {
  const metrics = calculateEmployeeMetrics(this);
  this.epi = metrics.epi;
  this.performanceCategory = metrics.performanceCategory;
  this.riskLevel = metrics.riskLevel;
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
