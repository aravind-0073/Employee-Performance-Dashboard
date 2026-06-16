# Student Dashboard - Backend

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure .env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-dashboard
NODE_ENV=development
```

For MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-dashboard?retryWrites=true&w=majority
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

### Seed Dummy Data

To populate the database with sample student data (300 students):

```bash
node scripts/seedDatabase.js
```

This will:
- Connect to MongoDB
- Clear existing data
- Insert 300 sample students across 5 departments and 8 semesters
- Include students with various attendance percentages
- Automatically mark detained students (attendance < 75%)

### API Endpoints

#### Students
- `GET /api/students` - Get all students (with pagination)
- `GET /api/students/:usn` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:usn` - Update student
- `DELETE /api/students/:usn` - Delete student
- `POST /api/students/search` - Search students with filters

#### Upload
- `POST /api/upload` - Upload Excel/CSV file
- `DELETE /api/upload/all/data` - Clear all student data

#### Analytics
- `GET /api/analytics/kpi` - Get KPI metrics
- `GET /api/analytics/attendance-distribution` - Attendance stats
- `GET /api/analytics/subject-performance` - Subject averages
- `GET /api/analytics/gpa-distribution` - GPA distribution
- `GET /api/analytics/department-comparison` - Department stats
- `GET /api/analytics/semester-comparison` - Semester stats
- `GET /api/analytics/top-performers` - Top 10 students
- `GET /api/analytics/weak-performers` - Bottom 10 students
- `GET /api/analytics/detained-analysis` - Detained students analysis
- `GET /api/analytics/risk-students` - Students at risk (60-75% attendance)

#### Export
- `GET /api/export/detained-excel` - Export detained students (Excel)
- `GET /api/export/detained-pdf` - Export detained students (PDF)
- `GET /api/export/all-students-excel` - Export all students (Excel)

### File Upload Format

**Required Columns:**
- USN
- StudentName
- Department
- Semester
- Section
- AttendancePercentage

**Optional Columns:**
- Subject1Marks to Subject5Marks
- InternalMarks
- GPA
- CGPA
- Email
- Phone
- ParentName
- ParentPhone
- CounselorName

### Troubleshooting

**MongoDB connection error:**
- Ensure MongoDB is running locally: `mongod`
- Or update MONGODB_URI in .env for MongoDB Atlas

**Port already in use:**
- Change PORT in .env to another available port

**Module not found:**
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`

### Deployment

#### Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set Build Command: `cd backend && npm install`
5. Set Start Command: `npm start`
6. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: production

#### Deploy to Railway

1. Create Railway project
2. Add GitHub repository
3. Add MongoDB plugin
4. Deploy with environment variables

### Testing

Test API health:
```bash
curl http://localhost:5000/api/health
```

### Database Schema

**Student Collection:**
```javascript
{
  usn: String,
  studentName: String,
  department: String,
  semester: Number,
  section: String,
  attendancePercentage: Number,
  subject1-5Marks: Number,
  internalMarks: Number,
  gpa: Number,
  cgpa: Number,
  email: String,
  phone: String,
  parentName: String,
  parentPhone: String,
  counselorName: String,
  isDetained: Boolean,
  detentionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Performance Optimization

- Indexes on: department, semester, section, USN, isDetained
- Pagination limit: 10 records per page
- API timeout: 30 seconds
- File upload limit: 50MB

### Security Notes

For production:
- Add JWT authentication
- Implement rate limiting
- Use HTTPS
- Add request validation
- Implement CORS properly
- Add database authentication
- Use environment variables for sensitive data
