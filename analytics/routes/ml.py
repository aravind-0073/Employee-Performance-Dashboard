from fastapi import APIRouter, HTTPException
from models import (
    BatchEmployeeRequest, MLModelComparisonResponse, MLPredictionRequest,
    MLPredictionResult, EDAVisualizationsResponse, PreprocessingReport
)
from analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/ml", tags=["Data Mining & Machine Learning"])

@router.post("/train-evaluate", response_model=MLModelComparisonResponse)
def train_and_evaluate(payload: BatchEmployeeRequest):
    """
    Executes Data Mining Preprocessing & Trains 3 Classification Algorithms:
    - Decision Tree Classifier
    - Random Forest Classifier
    - Logistic Regression
    Computes Accuracy, Precision, Recall, F1 (macro & weighted), and 3x3 Confusion Matrices.
    """
    try:
        return AnalyticsEngine.train_and_evaluate_models(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML training failed: {str(e)}")

@router.post("/predict", response_model=MLPredictionResult)
def predict_performance(payload: MLPredictionRequest):
    """
    Interactive performance classification using user-selected ML model.
    Classifies employee into Low, Medium, or High performance.
    """
    try:
        return AnalyticsEngine.predict_performance_category(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML prediction failed: {str(e)}")

@router.post("/eda-visualizations", response_model=EDAVisualizationsResponse)
def get_eda_visualizations(payload: BatchEmployeeRequest):
    """
    Calculates data points for the 6 Academic Visualizations:
    1. Performance Level Distribution (Low, Medium, High)
    2. Attendance vs Performance
    3. Training Hours vs Performance
    4. Experience vs Performance
    5. Job Satisfaction vs Performance
    6. Department-wise Performance Comparison
    """
    try:
        return AnalyticsEngine.get_eda_visualizations(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EDA visualizations failed: {str(e)}")
