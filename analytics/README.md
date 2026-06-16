# Python Analytics Service - FastAPI Microservice

## Overview

The Python Analytics Service is a dedicated FastAPI microservice that handles all advanced analytics, data processing, and machine learning predictions for the Student Dashboard.

## Architecture

### Technology Stack

- **Framework**: FastAPI (async Python web framework)
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: Scikit-learn, SciPy
- **Visualizations**: Plotly, Matplotlib
- **Database**: MongoDB (via PyMongo)
- **Server**: Uvicorn ASGI server

### Service Structure

```
analytics/
├── main.py                 # FastAPI application setup
├── models.py               # Pydantic data models
├── analytics_engine.py     # Core analytics logic
├── routes/
│   ├── performance.py      # Student performance analysis
│   ├── attendance.py       # Attendance tracking and analysis
│   ├── detention.py        # Detention detection and counseling
│   ├── statistics.py       # Statistical analysis
│   ├── predictions.py      # ML-based predictions
│   └── visualizations.py   # Chart generation
├── requirements.txt        # Python dependencies
└── .env.example           # Configuration template
```

## Installation

### 1. Install Python 3.9+

```bash
python --version  # Verify Python 3.9 or higher
```

### 2. Create Virtual Environment

```bash
cd analytics
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

## Running the Service

### Development Mode

```bash
python main.py
```

Service will start on `http://localhost:8000`

### Production Mode with Uvicorn

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Documentation

FastAPI provides automatic API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. Performance Analysis (`/api/analytics/performance`)

#### POST `/analyze`
Analyze performance for multiple students

**Request:**
```json
[
  {
    "usn": "CS001",
    "studentName": "John Doe",
    "department": "Computer Science",
    "semester": 5,
    "section": "A",
    "attendancePercentage": 85,
    "subject1Marks": 78,
    "subject2Marks": 82,
    "subject3Marks": 88,
    "subject4Marks": 79,
    "subject5Marks": 85,
    "internalMarks": 38,
    "gpa": 8.2,
    "cgpa": 8.1
  }
]
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "usn": "CS001",
      "studentName": "John Doe",
      "overall_performance": "Excellent",
      "gpa": 8.2,
      "attendance": 85,
      "average_marks": 82.4,
      "weak_subjects": [],
      "strong_subjects": ["Subject 3", "Subject 5"],
      "risk_level": "Low"
    }
  ],
  "total": 1
}
```

#### POST `/individual/{usn}`
Detailed analysis for individual student

### 2. Attendance Analysis (`/api/analytics/attendance`)

#### POST `/analyze`
Comprehensive attendance analysis

#### POST `/at-risk`
Identify students at risk (60-75% attendance)

#### POST `/distribution`
Get attendance distribution statistics

### 3. Detention System (`/api/analytics/detention`)

#### POST `/identify`
Automatically identify detained students (attendance < 75%)

**Key Features:**
- Automatic detection of low attendance
- Risk level classification
- Counselor recommendations
- Follow-up scheduling

#### POST `/risk-analysis`
Analyze detention risk across institution

#### POST `/counselor-list`
Generate action list for counselors

### 4. Statistics (`/api/analytics/statistics`)

#### POST `/summary`
Overall statistical summary

**Returns:**
- Mean, Median, Std Dev for GPA
- Mean, Median, Std Dev for Attendance
- Correlation between Attendance and GPA
- Pass/Fail statistics
- At-risk student count

#### POST `/correlation`
Analyze correlation between metrics

#### POST `/top-performers`
Get top performing students

#### POST `/weak-performers`
Get weak performing students

#### POST `/department-stats`
Department-wise analysis

#### POST `/semester-stats`
Semester-wise analysis

### 5. Predictions (`/api/analytics/predictions`)

#### POST `/at-risk-students`
ML-based prediction of students at risk of failing

**Predicts based on:**
- Low attendance
- Low GPA
- Low average marks
- Weak subject performance
- Low internal marks

**Returns:**
- Risk prediction (High/Medium/Low)
- Confidence score (0-1)
- Risk factors
- Recommendations

#### POST `/subject-wise-prediction`
Performance prediction for each subject

#### POST `/performance-improvement-score`
Estimate improvement potential

### 6. Visualizations (`/api/analytics/visualizations`)

#### POST `/gpa-distribution`
GPA distribution bar chart (Plotly)

#### POST `/attendance-distribution`
Attendance distribution pie chart

#### POST `/department-comparison`
Department comparison chart

#### POST `/subject-performance`
Subject-wise performance chart

#### POST `/scatter`
GPA vs Attendance scatter plot

#### POST `/box-plot`
GPA distribution by department (Box plot)

#### POST `/heatmap`
Correlation matrix heatmap

## Core Analytics Engine

### AnalyticsEngine Class

Located in `analytics_engine.py`, provides core functionality:

```python
# Convert students to DataFrame
df = AnalyticsEngine.create_dataframe(students)

# Calculate metrics
avg_marks = AnalyticsEngine.calculate_average_marks(df)
weak_subjects = AnalyticsEngine.identify_weak_subjects(student)
strong_subjects = AnalyticsEngine.identify_strong_subjects(student)

# Classify and evaluate
performance = AnalyticsEngine.classify_performance(gpa, attendance, marks)
risk = AnalyticsEngine.determine_risk_level(attendance, gpa, marks)

# Identify detention students
detained = AnalyticsEngine.identify_detained_students(students)

# Statistical analysis
stats = AnalyticsEngine.calculate_statistics(students)
correlation = df['attendancePercentage'].corr(df['gpa'])
```

### Key Methods

- **`create_dataframe()`**: Convert student list to pandas DataFrame
- **`calculate_average_marks()`**: Calculate average marks per student
- **`identify_weak_subjects()`**: Find subjects with marks < 40
- **`identify_strong_subjects()`**: Find subjects with marks >= 80
- **`classify_performance()`**: Classify as Excellent/Very Good/Good/Average/Poor
- **`determine_risk_level()`**: Determine High/Medium/Low risk
- **`identify_detained_students()`**: Find students with attendance < 75%
- **`calculate_statistics()`**: Comprehensive statistical summary
- **`department_analysis()`**: Performance metrics by department
- **`semester_analysis()`**: Performance metrics by semester
- **`gpa_distribution()`**: GPA range distribution
- **`attendance_distribution()`**: Attendance range distribution

## Data Models (Pydantic)

### StudentData
```python
class StudentData(BaseModel):
    usn: str
    studentName: str
    department: str
    semester: int
    section: str
    attendancePercentage: float
    subject1Marks: float
    subject2Marks: float
    subject3Marks: float
    subject4Marks: float
    subject5Marks: float
    internalMarks: float
    gpa: float
    cgpa: float
```

### PerformanceAnalysis
```python
class PerformanceAnalysis(BaseModel):
    usn: str
    studentName: str
    overall_performance: str
    gpa: float
    attendance: float
    average_marks: float
    weak_subjects: List[str]
    strong_subjects: List[str]
    risk_level: str
```

## Integration with Node.js Backend

The Node.js backend communicates with Python via HTTP:

```javascript
// In Node.js backend
import { performanceAPI, detentionAPI, ... } from './services/analytics-client.js';

// Call Python analytics
const analysis = await performanceAPI.analyze(students);
const detained = await detentionAPI.identify(students);
const predictions = await predictionsAPI.atRiskStudents(students);
```

## Performance Characteristics

- **Data Processing**: Handles 1000+ students efficiently
- **Calculation Time**: < 500ms for typical dataset
- **Memory Efficient**: Uses pandas for optimized data handling
- **Async Support**: FastAPI async/await for concurrent requests

## Development Workflow

### Adding New Analytics

1. Create new route file in `routes/`
2. Add methods to `AnalyticsEngine` class
3. Define Pydantic models in `models.py`
4. Test with FastAPI docs at `/docs`
5. Update `main.py` to include new router

### Testing Endpoints

Use FastAPI Swagger UI at `http://localhost:8000/docs`:
1. Click "Try it out" on any endpoint
2. Enter test data
3. Click "Execute"
4. View response

### Debugging

Check logs:
```bash
# Set LOG_LEVEL in .env
# Available: DEBUG, INFO, WARNING, ERROR
```

## Deployment

### Docker

```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: analytics
        image: analytics-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: ANALYTICS_PORT
          value: "8000"
```

### Cloud Platforms

- **Render**: Deploy directly from GitHub
- **Railway**: One-click Python deployment
- **Heroku**: Free tier available
- **AWS Lambda**: With FastAPI adapter

## Monitoring & Logging

### Health Check

```bash
curl http://localhost:8000/health
```

### Logging Configuration

Set `LOG_LEVEL` in .env:
- `DEBUG`: Detailed information
- `INFO`: General information
- `WARNING`: Warning messages
- `ERROR`: Error messages

## Troubleshooting

### Module Not Found

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Port Already in Use

```bash
# Use different port
ANALYTICS_PORT=8001 python main.py
```

### MongoDB Connection Error

```bash
# Check connection string in .env
# Verify MongoDB is running
# Whitelist IP in MongoDB Atlas
```

### Memory Issues with Large Datasets

```python
# Process in chunks
for chunk in pd.read_csv('data.csv', chunksize=1000):
    process_chunk(chunk)
```

## Best Practices

1. **Data Validation**: Always validate input data with Pydantic
2. **Error Handling**: Use try-catch and appropriate HTTP status codes
3. **Performance**: Use pandas/numpy for data operations
4. **Caching**: Implement caching for repeated analyses
5. **Logging**: Log important operations and errors
6. **Testing**: Write unit tests for analytics functions
7. **Documentation**: Keep API documentation updated

## Performance Optimization Tips

1. **Use Pandas**: For data manipulation
2. **Vectorization**: Use numpy operations instead of loops
3. **Chunking**: Process large datasets in chunks
4. **Indexing**: Create proper database indexes
5. **Caching**: Cache frequently accessed results
6. **Async**: Leverage FastAPI's async capabilities

## Future Enhancements

- [ ] Advanced ML models (Neural Networks)
- [ ] Time series analysis for trend prediction
- [ ] Anomaly detection
- [ ] Natural language processing for counselor recommendations
- [ ] Real-time data streaming
- [ ] GraphQL API support
- [ ] WebSocket support for live analytics
- [ ] Multi-language support for reports

## Contributing

To contribute to analytics features:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pandas Documentation](https://pandas.pydata.org/)
- [Plotly Documentation](https://plotly.com/python/)
- [Scikit-learn Documentation](https://scikit-learn.org/)

---

**For support, open an issue on GitHub or contact the development team.**
