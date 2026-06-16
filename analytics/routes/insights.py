from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData
from analytics_engine import AnalyticsEngine

router = APIRouter()


@router.post("/generate")
async def generate_insights(students: List[StudentData]):
    """Generate dynamic academic insights from data analysis."""
    try:
        insights = AnalyticsEngine.generate_dynamic_insights(students)
        return {
            'success': True,
            'data': insights,
            'total': len(insights)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/correlation")
async def correlation_analysis(students: List[StudentData]):
    """Get attendance-GPA correlation with full interpretation."""
    try:
        result = AnalyticsEngine.calculate_correlation_with_interpretation(students)
        return {
            'success': True,
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk-scores")
async def risk_scores(students: List[StudentData]):
    """Calculate risk scores for all students."""
    try:
        results = []
        for student in students:
            risk = AnalyticsEngine.calculate_risk_score(student)
            results.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'department': student.department,
                'semester': student.semester,
                'section': student.section,
                **risk
            })

        # Summary counts
        high_risk = len([r for r in results if r['risk_level'] == 'High Risk'])
        medium_risk = len([r for r in results if r['risk_level'] == 'Medium Risk'])
        low_risk = len([r for r in results if r['risk_level'] == 'Low Risk'])

        return {
            'success': True,
            'data': results,
            'summary': {
                'high_risk': high_risk,
                'medium_risk': medium_risk,
                'low_risk': low_risk,
                'total': len(results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/academic-health")
async def academic_health(students: List[StudentData]):
    """Calculate Academic Health Index for all students."""
    try:
        results = []
        for student in students:
            health = AnalyticsEngine.calculate_academic_health_index(student)
            results.append({
                'usn': student.usn,
                'studentName': student.studentName,
                **health
            })

        # Average health index
        avg_health = sum(r['health_index'] for r in results) / len(results) if results else 0

        return {
            'success': True,
            'data': results,
            'average_health_index': round(avg_health, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gpa-prediction")
async def gpa_prediction(students: List[StudentData]):
    """Predict GPA using Linear Regression model."""
    try:
        if len(students) < 5:
            raise HTTPException(status_code=400, detail="Need at least 5 students for predictions")

        result = AnalyticsEngine.predict_gpa(students)
        return {
            'success': True,
            'data': result['predictions'],
            'model_info': result['model_info']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/department-ranking")
async def department_ranking(students: List[StudentData]):
    """Rank departments by weighted performance formula."""
    try:
        rankings = AnalyticsEngine.department_ranking(students)
        return {
            'success': True,
            'data': rankings,
            'total_departments': len(rankings)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detention-priority")
async def detention_priority(students: List[StudentData]):
    """Classify detained students by priority with intervention suggestions."""
    try:
        results = []
        for student in students:
            if student.attendancePercentage < 75 or student.gpa < 5.0:
                priority_info = AnalyticsEngine.classify_detention_priority(student)
                results.append({
                    'usn': student.usn,
                    'studentName': student.studentName,
                    'department': student.department,
                    'semester': student.semester,
                    'section': student.section,
                    'attendancePercentage': student.attendancePercentage,
                    'gpa': student.gpa,
                    **priority_info
                })

        # Sort by severity (highest first)
        results.sort(key=lambda x: x['severity_score'], reverse=True)

        # Summary
        critical = len([r for r in results if r['priority'] == 'Critical'])
        high = len([r for r in results if r['priority'] == 'High'])
        medium = len([r for r in results if r['priority'] == 'Medium'])
        low = len([r for r in results if r['priority'] == 'Low'])

        return {
            'success': True,
            'data': results,
            'summary': {
                'critical': critical,
                'high': high,
                'medium': medium,
                'low': low,
                'total': len(results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/student-recommendations")
async def student_recommendations(students: List[StudentData]):
    """Generate per-student recommendations, strengths, and weaknesses."""
    try:
        results = []
        for student in students:
            recs = AnalyticsEngine.generate_student_recommendations(student)
            results.append(recs)

        return {
            'success': True,
            'data': results,
            'total': len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
