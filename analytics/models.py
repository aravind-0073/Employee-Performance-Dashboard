from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class StudentData(BaseModel):
    """Student data model"""
    usn: str
    studentName: str
    department: str
    semester: int
    section: str
    attendancePercentage: float
    subject1Marks: float = 0
    subject2Marks: float = 0
    subject3Marks: float = 0
    subject4Marks: float = 0
    subject5Marks: float = 0
    internalMarks: float = 0
    gpa: float = 0
    cgpa: float = 0
    email: Optional[str] = None
    phone: Optional[str] = None

class PerformanceAnalysis(BaseModel):
    """Performance analysis result"""
    usn: str
    studentName: str
    overall_performance: str
    gpa: float
    attendance: float
    average_marks: float
    weak_subjects: List[str]
    strong_subjects: List[str]
    risk_level: str

class DetainedStudent(BaseModel):
    """Detained student model"""
    usn: str
    studentName: str
    department: str
    semester: int
    section: str
    attendancePercentage: float
    gpa: float
    detentionReason: str
    riskLevel: str
    counselorRecommendation: str

class AttendanceAnalysis(BaseModel):
    """Attendance analysis model"""
    studentId: str
    totalClasses: int
    attended: int
    attendancePercentage: float
    status: str
    riskLevel: str

class StatisticalAnalysis(BaseModel):
    """Statistical analysis results"""
    mean_gpa: float
    median_gpa: float
    std_gpa: float
    mean_attendance: float
    correlation_attendance_gpa: float
    students_at_risk: int
    top_performers: int

class PredictionResult(BaseModel):
    """Prediction model result"""
    usn: str
    studentName: str
    prediction: str
    confidence: float
    risk_factors: List[str]
    recommendations: List[str]

class VisualizationRequest(BaseModel):
    """Visualization request model"""
    chartType: str
    department: Optional[str] = None
    semester: Optional[int] = None
    dataType: str = "all"

class BatchAnalysisRequest(BaseModel):
    """Batch analysis request"""
    students: List[StudentData]
    analysisType: str = "all"
