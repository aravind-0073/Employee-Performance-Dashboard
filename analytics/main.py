from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routes import (
    performance,
    attendance,
    detention,
    statistics,
    predictions,
    visualizations,
    insights
)

# Create FastAPI app
app = FastAPI(
    title="Student Analytics Engine",
    description="Python-based analytics microservice for student performance analysis",
    version="1.0.0"
)

# Configure CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(performance.router, prefix="/api/analytics/performance", tags=["Performance"])
app.include_router(attendance.router, prefix="/api/analytics/attendance", tags=["Attendance"])
app.include_router(detention.router, prefix="/api/analytics/detention", tags=["Detention"])
app.include_router(statistics.router, prefix="/api/analytics/statistics", tags=["Statistics"])
app.include_router(predictions.router, prefix="/api/analytics/predictions", tags=["Predictions"])
app.include_router(visualizations.router, prefix="/api/analytics/visualizations", tags=["Visualizations"])
app.include_router(insights.router, prefix="/api/analytics/insights", tags=["Insights"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Student Analytics Engine",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Student Performance Analytics Engine",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

# Error handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ANALYTICS_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
