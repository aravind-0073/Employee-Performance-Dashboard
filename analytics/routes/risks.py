from fastapi import APIRouter, HTTPException
from models import BatchEmployeeRequest, RiskAssessmentResponse
from analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/risks", tags=["Risk Management"])

@router.post("/assessment", response_model=RiskAssessmentResponse)
def assess_risks(payload: BatchEmployeeRequest):
    """
    Evaluates multi-factor underperformance risks, assigns priority matrix,
    and returns actionable managerial interventions.
    """
    try:
        return AnalyticsEngine.assess_performance_risks(payload.employees, payload.thresholds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assess risks: {str(e)}")
