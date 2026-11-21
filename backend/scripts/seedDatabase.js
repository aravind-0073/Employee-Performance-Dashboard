import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Employee, { calculateEmployeeMetrics } from '../models/Employee.js';

dotenv.config();

const DEPARTMENTS = [
  {
    name: 'Engineering',
    manager: 'David Vance (VP Engineering)',
    designations: ['Principal Architect', 'Senior Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 'QA Automation Engineer', 'Junior Developer']
  },
  {
    name: 'Product Management',
    manager: 'Elena Rostova (Chief Product Officer)',
    designations: ['Lead Product Manager', 'Senior Technical PM', 'UI/UX Lead Designer', 'Product Operations Analyst', 'Associate PM']
  },
  {
    name: 'Sales',
    manager: 'Marcus Sterling (VP Global Sales)',
    designations: ['Enterprise Sales Director', 'Senior Account Executive', 'B2B Sales Specialist', 'Solutions Architect', 'Sales Development Rep']
  },
  {
    name: 'Marketing',
    manager: 'Rachel Miller (VP Growth)',
    designations: ['Growth Marketing Lead', 'Performance Marketing Specialist', 'Content Strategist', 'SEO Director', 'Brand Designer']
  },
  {
    name: 'Human Resources',
    manager: 'Sophia Anderson (Chief People Officer)',
    designations: ['Senior Talent Partner', 'People Operations Lead', 'Technical Recruiter', 'HR Business Partner', 'L&D Specialist']
  },
  {
    name: 'Finance',
    manager: 'Robert Sterling (Chief Financial Officer)',
    designations: ['Senior Financial Analyst', 'Corporate Controller', 'FP&A Manager', 'Senior Accountant', 'Compliance Specialist']
  }
];

const FIRST_NAMES = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Charlotte', 'Elijah', 'Amelia',
  'James', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
  'Henry', 'Evelyn', 'Alexander', 'Harper', 'Daniel', 'Camila', 'Matthew', 'Gianna',
  'Jackson', 'Abigail', 'Sebastian', 'Luna', 'Jack', 'Ella', 'Aiden', 'Elizabeth',
  'Owen', 'Sofia', 'Samuel', 'Emily', 'Ryan', 'Avery', 'Nathan', 'Mila'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
];

const SKILL_POOLS = {
  Engineering: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'GraphQL', 'CI/CD', 'PostgreSQL'],
  'Product Management': ['Product Strategy', 'Agile/Scrum', 'User Research', 'Wireframing', 'Figma', 'Data Analytics', 'Roadmapping'],
  Sales: ['Enterprise B2B', 'CRM / Salesforce', 'Negotiation', 'Account Management', 'SaaS Solutioning', 'Contract Closing'],
  Marketing: ['SEO', 'Google Ads', 'Content Marketing', 'HubSpot', 'Brand Strategy', 'Data Visualization', 'Conversion Optimization'],
  'Human Resources': ['Talent Acquisition', 'Compensation & Benefits', 'HRIS / Workday', 'Employee Relations', 'Org Design', 'DE&I'],
  Finance: ['Financial Modeling', 'Excel Mastery', 'FP&A', 'SAP ERP', 'Internal Audit', 'GAAP Reporting', 'Budgeting']
};

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min, max, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return decimals === 0 ? Math.round(val) : parseFloat(val.toFixed(decimals));
}

  export function generateRealisticEmployees(userId, count = 75) {
    const employees = [];
    let empNum = 101;

    for (let i = 0; i < count; i++) {
      const deptInfo = sample(DEPARTMENTS);
      const firstName = sample(FIRST_NAMES);
      const lastName = sample(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const designation = sample(deptInfo.designations);
      const skillsList = SKILL_POOLS[deptInfo.name] || ['Communication', 'Project Management'];
      const empSkills = [sample(skillsList), sample(skillsList), sample(skillsList)].filter((v, idx, a) => a.indexOf(v) === idx);

      // Profile distribution for balanced multi-class ML dataset:
      // ~25% High Performers, ~25% Low/Struggling, ~50% Medium/Average
      const profileType = i % 4 === 0 ? 'high' : (i % 4 === 1 ? 'struggling' : 'medium');

      let perf, prod, att, quality, targetRate, exp, projects, tasks, workingHours, trainingHours, jobSatisfaction, workload, prevRating;

      if (profileType === 'high') {
        perf = randRange(82, 98, 1);
        prod = randRange(85, 99, 1);
        att = randRange(92, 100, 1);
        quality = randRange(88, 98, 1);
        targetRate = randRange(90, 100, 1);
        exp = randRange(3.5, 12, 1);
        projects = randRange(6, 18);
        tasks = randRange(45, 95);
        workingHours = randRange(42, 52, 1);
        trainingHours = randRange(25, 60, 1);
        jobSatisfaction = randRange(4.0, 5.0, 1);
        workload = randRange(3.0, 4.2, 1);
        prevRating = randRange(4.2, 5.0, 1);
      } else if (profileType === 'struggling') {
        perf = randRange(42, 63, 1);
        prod = randRange(45, 64, 1);
        att = randRange(62, 74, 1);
        quality = randRange(55, 68, 1);
        targetRate = randRange(50, 68, 1);
        exp = randRange(0.8, 4.0, 1);
        projects = randRange(1, 4);
        tasks = randRange(12, 28);
        workingHours = randRange(32, 40, 1);
        trainingHours = randRange(4, 16, 1);
        jobSatisfaction = randRange(1.8, 3.1, 1);
        workload = randRange(1.5, 2.8, 1);
        prevRating = randRange(1.8, 2.9, 1);
      } else {
        perf = randRange(66, 79, 1);
        prod = randRange(68, 81, 1);
        att = randRange(80, 94, 1);
        quality = randRange(72, 85, 1);
        targetRate = randRange(72, 88, 1);
        exp = randRange(1.5, 8.5, 1);
        projects = randRange(3, 10);
        tasks = randRange(26, 58);
        workingHours = randRange(38, 45, 1);
        trainingHours = randRange(15, 35, 1);
        jobSatisfaction = randRange(3.2, 4.1, 1);
        workload = randRange(2.8, 3.8, 1);
        prevRating = randRange(3.2, 4.1, 1);
      }

      const salaryBase = 55000 + (exp * 8500) + (perf * 350);
      const salary = Math.round(salaryBase / 1000) * 1000;

      const empId = `EMP${empNum++}`;
      const joiningDate = new Date();
      joiningDate.setFullYear(joiningDate.getFullYear() - Math.floor(exp));
      joiningDate.setMonth(randRange(0, 11));

      const rec = {
        userId,
        employeeId: empId,
        employeeName: fullName,
        department: deptInfo.name,
        designation,
        experience: exp,
        attendancePercentage: att,
        performanceScore: perf,
        productivityScore: prod,
        workingHours,
        trainingHours,
        jobSatisfaction,
        workload,
        previousPerformanceRating: prevRating,
        qualityScore: quality,
        targetCompletionRate: targetRate,
        projectsCompleted: projects,
        tasksCompleted: tasks,
        salary,
        joiningDate,
        managerName: deptInfo.manager,
        skills: empSkills,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@workforce.io`,
        phone: `+1 (555) ${randRange(200, 899)}-${randRange(1000, 9999)}`,
        status: profileType === 'struggling' && att < 68 ? 'Under Review' : 'Active'
      };

      const metrics = calculateEmployeeMetrics(rec);
      rec.epi = metrics.epi;
      rec.performanceCategory = metrics.performanceCategory;
      rec.riskLevel = metrics.riskLevel;

      if (rec.riskLevel === 'Critical') {
        rec.interventions = [{
          actionType: 'PIP',
          note: '30-day Performance Improvement Plan scheduled due to declining attendance and low KPI achievement.',
          assignedBy: deptInfo.manager,
          actionDate: new Date()
        }];
      }

      employees.push(rec);
    }

    return employees;
  }

  export async function seedInitialAdminAndData() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    let user = await User.findOne({ email: adminEmail });

    if (!user) {
      user = new User({
        email: adminEmail,
        name: 'Alex Morgan',
        password: adminPassword,
        organization: 'Nexus Global Enterprises',
        role: 'HR Administrator'
      });
      await user.save();
      console.log(`[Seed] Created default HR Administrator: ${adminEmail} (password: Admin@123)`);
    }

    const existingEmployees = await Employee.countDocuments({ userId: user._id });
    if (existingEmployees === 0) {
      const dummyData = generateRealisticEmployees(user._id, 75);
      await Employee.insertMany(dummyData);
      console.log(`[Seed] Successfully seeded ${dummyData.length} realistic employee profiles for ${adminEmail}`);
    } else {
      // If fewer than 40 records, refresh with new attributes
      const firstEmp = await Employee.findOne({ userId: user._id });
      if (!firstEmp || firstEmp.workingHours === undefined) {
        await Employee.deleteMany({ userId: user._id });
        const dummyData = generateRealisticEmployees(user._id, 75);
        await Employee.insertMany(dummyData);
        console.log(`[Seed] Updated ${dummyData.length} employee records with extended academic ML attributes.`);
      } else {
        console.log(`[Seed] Found ${existingEmployees} existing employee records with academic ML attributes.`);
      }
    }

    return user;
  }

  if (process.argv[1]?.endsWith('seedDatabase.js')) {
    (async () => {
      try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee-dashboard';
        await mongoose.connect(uri);
        console.log('MongoDB connected for seeding script.');
        await seedInitialAdminAndData();
        console.log('Seed completed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('Seed script error:', err);
        process.exit(1);
      }
    })();
  }
