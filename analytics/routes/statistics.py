from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData
from analytics_engine import AnalyticsEngine

router = APIRouter()

@router.post("/summary")
async def statistical_summary(students: List[StudentData]):
    """Get statistical summary of student data"""
    try:
        stats = AnalyticsEngine.calculate_statistics(students)
        
        return {
            'success': True,
            'data': stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/correlation")
async def correlation_analysis(students: List[StudentData]):
    """Analyze correlation between attendance and GPA"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        correlation = df['attendancePercentage'].corr(df['gpa'])
        
        # Interpretation
        if abs(correlation) >= 0.7:
            strength = "Strong"
        elif abs(correlation) >= 0.4:
            strength = "Moderate"
        else:
            strength = "Weak"
        
        direction = "Positive" if correlation > 0 else "Negative"
        
        return {
            'success': True,
            'data': {
                'correlation': float(correlation),
                'strength': strength,
                'direction': direction,
                'interpretation': f"{strength} {direction} correlation between attendance and GPA",
                'meaning': "Students with better attendance tend to have higher GPA" if correlation > 0 else "Unexpected negative correlation"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/top-performers")
async def top_performers(students: List[StudentData], limit: int = 10, department: str = None):
    """Get top performing students"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        if department:
            df = df[df['department'] == department]
        
        top = df.nlargest(limit, 'gpa')
        top_list = top.to_dict(orient='records')
        
        return {
            'success': True,
            'data': top_list,
            'total': len(top_list),
            'department': department
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/weak-performers")
async def weak_performers(students: List[StudentData], limit: int = 10, department: str = None):
    """Get weak performing students"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        if department:
            df = df[df['department'] == department]
        
        weak = df.nsmallest(limit, 'gpa')
        weak_list = weak.to_dict(orient='records')
        
        return {
            'success': True,
            'data': weak_list,
            'total': len(weak_list),
            'department': department
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/department-stats")
async def department_statistics(students: List[StudentData]):
    """Get statistics by department"""
    try:
        dept_stats = AnalyticsEngine.department_analysis(students)
        
        return {
            'success': True,
            'data': dept_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/semester-stats")
async def semester_statistics(students: List[StudentData]):
    """Get statistics by semester"""
    try:
        sem_stats = AnalyticsEngine.semester_analysis(students)
        
        return {
            'success': True,
            'data': sem_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gpa-distribution")
async def gpa_distribution_stats(students: List[StudentData]):
    """Get GPA distribution"""
    try:
        distribution = AnalyticsEngine.gpa_distribution(students)
        
        return {
            'success': True,
            'data': distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pass-fail-analysis")
async def pass_fail_analysis(students: List[StudentData]):
    """Analyze pass/fail distribution"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        # Pass if GPA >= 5.5
        pass_count = len(df[df['gpa'] >= 5.5])
        fail_count = len(df[df['gpa'] < 5.5])
        
        return {
            'success': True,
            'data': {
                'pass_count': pass_count,
                'fail_count': fail_count,
                'pass_rate': round((pass_count / len(df)) * 100, 2),
                'fail_rate': round((fail_count / len(df)) * 100, 2),
                'total_students': len(df)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
