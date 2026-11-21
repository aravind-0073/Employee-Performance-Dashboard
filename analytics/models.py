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
    workingHours: float = 40.0
    trainingHours: float = 20.0
    jobSatisfaction: float = 3.8
    workload: float = 3.2
    previousPerformanceRating: float = 3.5
    qualityScore: float = 80.0
    targetCompletionRate: float = 85.0
    projectsCompleted: int = 0
    tasksCompleted: int = 0
    salary: float = 0.0
    joiningDate: Optional[str] = None
    managerName: Optional[str] = "Unassigned"
    skills: Optional[List[str]] = []
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
    id: str
    type: str
    title: str
    description: str
    severity: str
    metricValue: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class StatisticalInsightsResponse(BaseModel):
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
    trend: str
    confidenceScore: float
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
    riskScore: float
    priority: str
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
    radarScores: Dict[str, float]
    departmentPercentile: float
    workforcePercentile: float
    strengths: List[str]
    weaknesses: List[str]
    actionableRecommendations: List[str]
    peerComparison: Dict[str, Any]

# ─────────────────────────────────────────────────────────────────────────────
# Academic Data Mining & Machine Learning Schemas
# ─────────────────────────────────────────────────────────────────────────────

class PreprocessingReport(BaseModel):
    totalRawRecords: int
    finalProcessedRecords: int
    missingValuesHandled: int
    duplicateRecordsRemoved: int
    encodedCategoricalFeatures: List[str]
    scaledNumericalFeatures: List[str]
    targetClasses: List[str]
    classDistribution: Dict[str, int]

class ModelEvaluationMetrics(BaseModel):
    modelName: str
    accuracy: float
    precisionMacro: float
    recallMacro: float
    f1Macro: float
    precisionWeighted: float
    recallWeighted: float
    f1Weighted: float
    confusionMatrix: List[List[int]]
    classNames: List[str]
    trainingSamples: int
    testingSamples: int
    hyperparameters: Dict[str, Any]

class MLModelComparisonResponse(BaseModel):
    preprocessingReport: PreprocessingReport
    decisionTree: ModelEvaluationMetrics
    randomForest: ModelEvaluationMetrics
    logisticRegression: ModelEvaluationMetrics
    bestModel: str
    bestModelReason: str
    featureImportances: Dict[str, float]
    comparisonSummary: List[Dict[str, Any]]

class MLPredictionRequest(BaseModel):
    experience: float
    attendancePercentage: float
    workingHours: float
    trainingHours: float
    jobSatisfaction: float
    workload: float
    department: str
    previousPerformanceRating: float
    productivityScore: float
    modelChoice: Optional[str] = "Random Forest"
    employeesContext: Optional[List[EmployeeData]] = []

class MLPredictionResult(BaseModel):
    predictedCategory: str  # "Low", "Medium", "High"
    confidence: float
    classProbabilities: Dict[str, float]
    modelUsed: str
    featureDrivers: List[str]
    recommendations: List[str]

class EDAVisualizationsResponse(BaseModel):
    performanceLevelDistribution: List[Dict[str, Any]]
    attendanceVsPerformance: List[Dict[str, Any]]
    trainingHoursVsPerformance: List[Dict[str, Any]]
    experienceVsPerformance: List[Dict[str, Any]]
    jobSatisfactionVsPerformance: List[Dict[str, Any]]
    departmentPerformanceComparison: List[Dict[str, Any]]
