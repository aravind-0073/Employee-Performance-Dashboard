import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';

dotenv.config();

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
const sections = ['A', 'B', 'C'];
const counselors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];

function generateUSN(dept, index) {
  const deptCode = dept.substring(0, 2).toUpperCase();
  return `${deptCode}${String(index + 1).padStart(5, '0')}`;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDummyData(count = 300) {
  const data = [];
  let studentIndex = 0;

  departments.forEach(dept => {
    const studentsPerDept = count / departments.length;

    for (let i = 0; i < studentsPerDept; i++) {
      const semester = getRandomNumber(1, 8);
      const attendance = getRandomNumber(50, 100);
      const hasLowAttendance = attendance < 75;

      data.push({
        usn: generateUSN(dept, studentIndex),
        studentName: `Student ${studentIndex + 1}`,
        department: dept,
        semester,
        section: sections[getRandomNumber(0, 2)],
        attendancePercentage: attendance,
        subject1Marks: getRandomNumber(20, 100),
        subject2Marks: getRandomNumber(20, 100),
        subject3Marks: getRandomNumber(20, 100),
        subject4Marks: getRandomNumber(20, 100),
        subject5Marks: getRandomNumber(20, 100),
        internalMarks: getRandomNumber(15, 50),
        gpa: parseFloat((getRandomNumber(40, 100) / 10).toFixed(2)),
        cgpa: parseFloat((getRandomNumber(40, 100) / 10).toFixed(2)),
        email: `student${studentIndex + 1}@university.edu`,
        phone: `98${getRandomNumber(1000000000, 9999999999)}`,
        parentName: `Parent ${studentIndex + 1}`,
        parentPhone: `91${getRandomNumber(6000000000, 9999999999)}`,
        counselorName: counselors[getRandomNumber(0, counselors.length - 1)],
        isDetained: hasLowAttendance,
        detentionReason: hasLowAttendance ? 'Attendance below 75%' : null,
      });

      studentIndex++;
    }
  });

  return data;
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-dashboard');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Student.deleteMany({});
    console.log('Cleared existing data');

    // Generate and insert dummy data
    const dummyData = generateDummyData(300);
    const result = await Student.insertMany(dummyData);
    console.log(`✓ Inserted ${result.length} dummy students`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
