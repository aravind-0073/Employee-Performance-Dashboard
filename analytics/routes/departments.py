from fastapi import APIRouter, HTTPException
from typing import List
from models import BatchEmployeeRequest, DepartmentMetric
from analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.post("/benchmark", response_model=List[DepartmentMetric])
def benchmark_departments(payload: BatchEmployeeRequest):
    """
    Ranks and benchmarks departments using the weighted multi-criteria formula:
    Score = (40% * Performance) + (30% * Productivity) + (20% * Attendance) + (10% * TargetAchievement)
    """
    try:
        return AnalyticsEngine.benchmark_departments(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to benchmark departments: {str(e)}")
