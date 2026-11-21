from fastapi import APIRouter, HTTPException
from models import BatchEmployeeRequest, StatisticalInsightsResponse, DistributionsResponse
from analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/statistics", tags=["Statistics"])

@router.post("/insights", response_model=StatisticalInsightsResponse)
def get_insights(payload: BatchEmployeeRequest):
    """Generates Pearson correlations, top/lowest departments, and narrative AI insights"""
    try:
        return AnalyticsEngine.generate_insights(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@router.post("/distributions", response_model=DistributionsResponse)
def get_distributions(payload: BatchEmployeeRequest):
    """Calculates performance & attendance histograms, category ratios, and leaderboards"""
    try:
        return AnalyticsEngine.calculate_distributions(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate distributions: {str(e)}")
