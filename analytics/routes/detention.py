from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData
from analytics_engine import AnalyticsEngine

router = APIRouter()

@router.post("/identify")
async def identify_detained_students(students: List[StudentData]):
    """Identify students who should be detained (attendance < 75%)"""
    try:
        if not students:
            raise HTTPException(status_code=400, detail="No students provided")
        
        detained = AnalyticsEngine.identify_detained_students(students)
        
        return {
            'success': True,
            'data': detained,
            'total': len(detained),
            'percentage': round((len(detained) / len(students)) * 100, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/by-department")
async def detained_by_department(students: List[StudentData], department: str = None):
    """Get detained students by department"""
    try:
        detained = AnalyticsEngine.identify_detained_students(students)
        
        if department:
            detained = [d for d in detained if d['department'] == department]
        
        return {
            'success': True,
            'data': detained,
            'total': len(detained),
            'department': department
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/risk-analysis")
async def analyze_detention_risk(students: List[StudentData]):
    """Analyze detention risk across all students"""
    try:
        detainedstudents = AnalyticsEngine.identify_detained_students(students)
        
        # Risk levels
        high_risk = [s for s in detainedstudents if s['riskLevel'] == 'High']
        medium_risk = [s for s in detainedstudents if s['riskLevel'] == 'Medium']
        
        return {
            'success': True,
            'detention_summary': {
                'total_detained': len(detainedstudents),
                'high_risk': len(high_risk),
                'medium_risk': len(medium_risk),
                'percentage_detained': round((len(detainedstudents) / len(students)) * 100, 2)
            },
            'high_risk_students': high_risk[:10],  # Top 10
            'data': {
                'detained': detainedstudents,
                'high_risk': high_risk,
                'medium_risk': medium_risk
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/counselor-list")
async def generate_counselor_list(students: List[StudentData]):
    """Generate counselor action list"""
    try:
        detained = AnalyticsEngine.identify_detained_students(students)
        
        # Sort by attendance (most critical first)
        counselor_list = sorted(detained, key=lambda x: x['attendancePercentage'])
        
        # Add action items
        for student in counselor_list:
            student['actionRequired'] = True
            student['priority'] = 'High' if student['attendancePercentage'] < 60 else 'Medium'
            student['followUpDate'] = 'Immediate'
        
        return {
            'success': True,
            'total_actions': len(counselor_list),
            'data': counselor_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/criteria")
async def detention_criteria():
    """Get detention criteria"""
    return {
        'success': True,
        'data': {
            'detention_rule': 'Attendance percentage < 75%',
            'criteria': {
                'attendance_threshold': 75,
                'operator': 'less_than',
                'action': 'Automatic detention'
            },
            'additional_factors': [
                'GPA below 5.5',
                'Average marks below 40',
                'Weak academic performance'
            ]
        }
    }
