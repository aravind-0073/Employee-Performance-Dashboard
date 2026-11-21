from fastapi import APIRouter, HTTPException
from models import BatchEmployeeRequest, PredictionResponse, SingleEmployeeAnalysisRequest
from analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("/predict", response_model=PredictionResponse)
def predict_employee_performance(payload: SingleEmployeeAnalysisRequest):
    """
    Predicts expected employee performance using Scikit-learn Linear Regression
    trained on peer operational features, indicating positive/negative delta.
    """
    try:
        return AnalyticsEngine.train_and_predict_performance(payload.peers or [], payload.employee)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate performance prediction: {str(e)}")
