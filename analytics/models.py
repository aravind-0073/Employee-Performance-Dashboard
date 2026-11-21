from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EmployeeData(BaseModel):
    """Core Employee Data Schema matching MongoDB model and CSV/Excel uploads"""
    employeeId: str
    employeeName: str
    department: str
    designation: str
    experience: float
    attendancePercentage: float
    performanceScore: float
    productivityScore: float
    qualityScore: float = 80.0
    targetCompletionRate: float = 85.0
    projectsCompleted: int = 0
    tasksCompleted: int = 0
    salary: float = 0.0
    joiningDate: Optional[str] = None
    managerName: Optional[str] = "Unassigned"
    skills: Optional[List[str]] = []
    trainingHours: float = 0.0
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "Active"
    epi: Optional[float] = None
    performanceCategory: Optional[str] = None
    riskLevel: Optional[str] = None

class BatchEmployeeRequest(BaseModel):
    """Request payload containing employee records"""
    employees: List[EmployeeData]
    thresholds: Optional[Dict[str, float]] = None

class SingleEmployeeAnalysisRequest(BaseModel):
    """Request payload for single employee analysis alongside workforce peers"""
    employee: EmployeeData
    peers: Optional[List[EmployeeData]] = []

class KPISummary(BaseModel):
    """Executive KPI summary"""
    totalEmployees: int
    averagePerformance: float
    averageAttendance: float
    averageProductivity: float
    averageTargetAchievement: float
    averageQualityScore: float
    highPerformersCount: int
    underperformingCount: int
    criticalRiskCount: int
    totalProjectsCompleted: int
    totalTrainingHours: float

class DepartmentMetric(BaseModel):
    """Department benchmark metric item"""
    department: str
    headcount: int
    compositeScore: float
    rank: int
    averagePerformance: float
    averageProductivity: float
    averageAttendance: float
    averageTargetAchievement: float
    highPerformers: int
    underperformers: int
    manager: Optional[str] = "Various"

class InsightItem(BaseModel):
    """Structured insight item"""
    id: str
    type: str  # 'correlation', 'top_department', 'risk_alert', 'productivity_drop', 'opportunity'
    title: str
    description: str
    severity: str  # 'info', 'success', 'warning', 'danger'
    metricValue: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class StatisticalInsightsResponse(BaseModel):
    """Comprehensive statistical insights"""
    correlationAttendancePerformance: float
    correlationProductivityPerformance: float
    attendancePValue: float
    productivityPValue: float
    bestDepartment: Dict[str, Any]
    lowestDepartment: Dict[str, Any]
    productivityDropDepartments: List[Dict[str, Any]]
    insights: List[InsightItem]

class DistributionBucket(BaseModel):
    name: str
    count: int
    percentage: float
    color: Optional[str] = None

class DistributionsResponse(BaseModel):
    performanceDistribution: List[DistributionBucket]
    attendanceDistribution: List[DistributionBucket]
    categoryRatios: List[DistributionBucket]
    riskRatios: List[DistributionBucket]
    departmentComparisons: List[Dict[str, Any]]
    productivityVsTarget: List[Dict[str, Any]]
    top10Performers: List[Dict[str, Any]]
    bottom10Performers: List[Dict[str, Any]]

class PredictionResponse(BaseModel):
    employeeId: str
    employeeName: str
    actualPerformance: float
    predictedPerformance: float
    performanceDelta: float
    trend: str  # 'Positive', 'Negative', 'Aligned'
    confidenceScore: float  # R2 or model confidence
    featureImportances: Dict[str, float]
    expectedEPI: float
    keyDrivers: List[str]
    forecastSummary: str

class RiskAssessmentItem(BaseModel):
    employeeId: str
    employeeName: str
    department: str
    designation: str
    managerName: Optional[str]
    performanceScore: float
    productivityScore: float
    attendancePercentage: float
    targetCompletionRate: float
    qualityScore: float
    epi: float
    riskScore: float  # 0-100
    priority: str  # 'Critical', 'High', 'Medium', 'Low'
    riskFactors: List[str]
    suggestedInterventions: List[str]
    contactEmail: Optional[str]
    contactPhone: Optional[str]

class RiskAssessmentResponse(BaseModel):
    totalEvaluated: int
    criticalCount: int
    highCount: int
    mediumCount: int
    lowCount: int
    atRiskEmployees: List[RiskAssessmentItem]

class EmployeeDeepDiveResponse(BaseModel):
    employee: EmployeeData
    calculatedEPI: float
    category: str
    riskPriority: str
    radarScores: Dict[str, float]  # Productivity, Quality, Attendance, TargetAchievement, TaskCompletion
    departmentPercentile: float
    workforcePercentile: float
    strengths: List[str]
    weaknesses: List[str]
    actionableRecommendations: List[str]
    peerComparison: Dict[str, Any]
