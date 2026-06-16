# Service Integration Guide

## Overview

This guide explains how the Node.js backend integrates with the Python analytics service and communicates with the frontend.

## Architecture Flow

```
Frontend (React)
       ↓ (HTTP REST)
Backend (Node.js)
       ├─ Student Management
       ├─ File Uploads
       └─ Analytics Integration
              ↓ (HTTP REST)
       Analytics Service (Python)
              ├─ Performance Analysis
              ├─ Detention Detection
              ├─ Predictions
              └─ Visualizations
              ↓
       MongoDB Database
```

## Inter-Service Communication

### 1. Frontend to Backend

**Example: Fetch Student Analytics**

```javascript
// Frontend (React)
const response = await axios.post(
  'http://localhost:5000/api/analytics/performance/analyze',
  students
);
```

**Backend Route Handler**

```javascript
// backend/routes/analytics-integrated.js
router.post('/performance/analyze', async (req, res) => {
  try {
    const data = await withErrorHandling(
      performanceAPI.analyze(req.body)
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Backend to Python Service

**Analytics Client Service**

```javascript
// backend/services/analytics-client.js
import axios from 'axios';

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';

export const performanceAPI = {
  analyze: (students) => 
    axios.post(`${ANALYTICS_SERVICE_URL}/api/analytics/performance/analyze`, students)
};
```

**Python FastAPI Endpoint**

```python
# analytics/routes/performance.py
@router.post("/analyze")
async def analyze_student_performance(students: List[StudentData]):
    """Analyze performance for list of students"""
    try:
        results = []
        for student in students:
            # Process with analytics engine
            analysis = perform_analysis(student)
            results.append(analysis)
        
        return {
            'success': True,
            'data': results,
            'total': len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Data Flow Examples

### Example 1: File Upload Flow

```
1. User selects Excel file in React UI
   ↓
2. Frontend sends multipart/form-data to backend
   POST /api/upload
   ↓
3. Backend receives file via Multer
   - Validates format
   - Parses Excel/CSV
   - Transforms data
   ↓
4. Backend stores in MongoDB
   ↓
5. Frontend shows success message
   ↓
6. User views dashboard
   ↓
7. Frontend requests analytics
   POST /api/analytics/performance/analyze
   ↓
8. Backend fetches students from MongoDB
   ↓
9. Backend sends to Python service
   POST http://analytics:8000/api/analytics/performance/analyze
   ↓
10. Python analyzes with Pandas/NumPy
    ↓
11. Returns results to backend
    ↓
12. Backend returns to frontend
    ↓
13. Frontend displays charts
```

### Example 2: Detention Detection Flow

```
1. Backend receives request to identify detained students
   POST /api/analytics/detention/identify
   ↓
2. Backend fetches all students from MongoDB
   ↓
3. Backend sends to Python service
   POST http://analytics:8000/api/analytics/detention/identify
   ↓
4. Python analytics engine:
   - Checks attendance percentage
   - Marks students with attendance < 75%
   - Calculates risk levels
   - Generates recommendations
   ↓
5. Returns detained list to backend
   ↓
6. Backend caches results (optional)
   ↓
7. Returns to frontend
   ↓
8. Frontend displays detention report
   - Shows students in red
   - Displays contact information
   - Provides export options
```

### Example 3: ML Predictions Flow

```
1. User requests risk predictions
   POST /api/analytics/predictions/at-risk
   ↓
2. Backend fetches student data from MongoDB
   ↓
3. Sends to Python service
   POST http://analytics:8000/api/analytics/predictions/at-risk-students
   ↓
4. Python ML engine:
   - Analyzes multiple factors
   - Calculates risk scores
   - Predicts failure probability
   - Generates recommendations
   ↓
5. Returns predictions to backend
   ↓
6. Backend processes results
   ↓
7. Frontend displays:
   - Risk levels (High/Medium/Low)
   - Confidence scores
   - Risk factors
   - Recommendations
```

## API Response Formats

### Standard Success Response

```json
{
  "success": true,
  "data": {
    // Actual data
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Analytics Response with Summary

```json
{
  "success": true,
  "data": [...],
  "summary": {
    "total": 300,
    "processed": 300,
    "errors": 0
  }
}
```

## Environment Variable Integration

### Backend Configuration

```env
# Connect to Python analytics service
ANALYTICS_SERVICE_URL=http://localhost:8000
# For Docker: http://analytics:8000

# Connect to MongoDB
MONGODB_URI=mongodb://localhost:27017/student-dashboard
# For Docker: mongodb://mongodb:27017/student-dashboard

# CORS settings
CORS_ORIGIN=http://localhost:3000
# For Docker: http://frontend:3000
```

### Python Service Configuration

```env
# Analytics service settings
ANALYTICS_PORT=8000
ENVIRONMENT=production

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/student-dashboard
# For Docker: mongodb://mongodb:27017/student-dashboard

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
# For Docker: http://frontend:3000,http://backend:5000
```

## Error Handling Strategy

### Frontend → Backend Error

```javascript
try {
  const response = await api.post('/analytics/performance/analyze', students);
  return response.data;
} catch (error) {
  if (error.response?.status === 503) {
    // Analytics service unavailable
    showError('Analytics service temporarily unavailable');
  } else {
    showError(error.response?.data?.error || 'Request failed');
  }
}
```

### Backend → Python Service Error

```javascript
try {
  const response = await performanceAPI.analyze(students);
  return response.data;
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Analytics service not responding');
    throw new Error('Analytics service unavailable');
  }
  throw new Error(error.response?.data?.detail || error.message);
}
```

## Performance Optimization

### 1. Response Caching

```javascript
// backend/middleware/cache.js
const cache = new Map();

const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const result = await pythonService(params);
cache.set(cacheKey, result);
setTimeout(() => cache.delete(cacheKey), 300000); // 5 min TTL
```

### 2. Batch Processing

```javascript
// Process large datasets in chunks
const chunkSize = 100;
for (let i = 0; i < students.length; i += chunkSize) {
  const chunk = students.slice(i, i + chunkSize);
  const results = await analyzeChunk(chunk);
  allResults.push(...results);
}
```

### 3. Async Processing

```javascript
// backend/routes/analytics-integrated.js
router.post('/performance/analyze', async (req, res) => {
  // Return immediately
  res.json({ 
    success: true, 
    message: 'Analysis started',
    jobId: generateJobId()
  });
  
  // Process in background
  analyzeInBackground(req.body).then(results => {
    // Store in cache or database
    cacheResults(jobId, results);
  });
});
```

## Monitoring & Debugging

### Health Checks

```bash
# Check Frontend
curl http://localhost:3000

# Check Backend
curl http://localhost:5000/api/health

# Check Analytics Service
curl http://localhost:8000/health

# Check MongoDB
mongosh mongodb://localhost:27017/student-dashboard
```

### Service Logs

```bash
# Backend logs
docker logs student-dashboard-api

# Analytics logs
docker logs student-analytics-service

# Frontend logs
docker logs student-dashboard-web
```

### Debugging Failed Requests

```javascript
// Enable detailed logging
process.env.DEBUG = 'analytics:*';

// Log all requests/responses
analyticsClient.interceptors.request.use(config => {
  console.log('Request:', config.method.toUpperCase(), config.url);
  return config;
});

analyticsClient.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('Error:', error.message, error.response?.data);
    return Promise.reject(error);
  }
);
```

## Testing Inter-Service Communication

### Manual Testing with cURL

```bash
# Test Backend Health
curl http://localhost:5000/api/health

# Test Analytics Health
curl http://localhost:8000/health

# Test Analytics Performance Endpoint
curl -X POST http://localhost:8000/api/analytics/performance/analyze \
  -H "Content-Type: application/json" \
  -d '[{
    "usn": "CS001",
    "studentName": "Test Student",
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
  }]'
```

### Automated Testing

```javascript
// test/integration.test.js
describe('Analytics Integration', () => {
  test('Performance analysis returns correct structure', async () => {
    const students = [/* test data */];
    const response = await performanceAPI.analyze(students);
    
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeArray();
    expect(response.data.data[0]).toHaveProperty('overall_performance');
  });
});
```

## Troubleshooting Common Issues

### Issue: Backend can't reach Analytics service

**Solutions:**
1. Check Analytics service is running: `curl http://localhost:8000/health`
2. Check `ANALYTICS_SERVICE_URL` in backend .env
3. Check firewall/network settings
4. Check port 8000 is accessible

### Issue: Slow Analytics responses

**Solutions:**
1. Check dataset size (limit to 1000 students per request)
2. Enable caching in backend
3. Use batch processing for large datasets
4. Check Python service logs for bottlenecks

### Issue: MongoDB connection errors

**Solutions:**
1. Ensure MongoDB is running
2. Check connection string format
3. Verify IP whitelisting in MongoDB Atlas
4. Check database name is correct

### Issue: CORS errors between services

**Solutions:**
1. Check `ALLOWED_ORIGINS` in Python service
2. Check `CORS_ORIGIN` in Node.js backend
3. Verify header configurations
4. Check for trailing slashes in URLs

## Best Practices

1. **Always validate input** at both frontend and backend
2. **Use environment variables** for all service URLs
3. **Implement retry logic** for failed requests
4. **Add request timeouts** to prevent hanging
5. **Log all requests** for debugging
6. **Cache responses** when appropriate
7. **Monitor service health** continuously
8. **Document API contracts** clearly
9. **Version APIs** for backward compatibility
10. **Use transactions** for database consistency

## Deployment Considerations

### Development
- All services on localhost with different ports
- Direct HTTP connections
- Full logging enabled

### Production (Docker)
- Services communicate via container network
- Use service names instead of localhost
- Enable health checks
- Use environment variables for configuration

### Cloud Deployment
- Services in separate containers/pods
- Load balancers for frontend and backend
- Message queues for async processing
- CDN for static assets
- Monitoring and alerting

---

**For more details, see individual service README files.**
