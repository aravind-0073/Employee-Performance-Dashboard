from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from routes import (
    performance,
    statistics,
    departments,
    predictions,
    risks
)

app = FastAPI(
    title="Workforce Analytics & ML Engine",
    description="Python FastAPI microservice for employee performance evaluation, risk assessment, and predictive analytics",
    version="2.0.0"
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(performance.router, prefix="/api/analytics")
app.include_router(statistics.router, prefix="/api/analytics")
app.include_router(departments.router, prefix="/api/analytics")
app.include_router(predictions.router, prefix="/api/analytics")
app.include_router(risks.router, prefix="/api/analytics")

@app.get("/health")
async def health_check():
    """Service health check endpoint used by Node.js auto-orchestration"""
    return {
        "status": "healthy",
        "service": "Workforce Analytics & ML Engine",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Workforce Analytics & ML Engine is active",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ANALYTICS_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
