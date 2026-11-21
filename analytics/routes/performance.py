from fastapi import APIRouter, HTTPException
from models import BatchEmployeeRequest, KPISummary, EmployeeDeepDiveResponse, EmployeeData
from analytics_engine import AnalyticsEngine
from typing import Dict, Any

router = APIRouter(prefix="/performance", tags=["Performance"])

@router.post("/kpis", response_model=KPISummary)
def get_kpis(payload: BatchEmployeeRequest):
    """Calculates all executive KPI metrics from the employee dataset"""
    try:
        return AnalyticsEngine.calculate_kpis(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate KPIs: {str(e)}")

@router.post("/deep-dive/{employee_id}", response_model=EmployeeDeepDiveResponse)
def get_deep_dive(employee_id: str, payload: BatchEmployeeRequest):
    """Calculates EPI, radar attributes, percentiles, and personalized recommendations for an employee"""
    try:
        res = AnalyticsEngine.employee_deep_dive(payload.employees, employee_id)
        if not res:
            raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found in dataset")
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform deep dive: {str(e)}")
