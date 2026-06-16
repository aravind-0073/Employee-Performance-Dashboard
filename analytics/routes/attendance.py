from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData
from analytics_engine import AnalyticsEngine
import numpy as np

router = APIRouter()

@router.post("/analyze")
async def analyze_attendance(students: List[StudentData]):
    """Analyze attendance patterns"""
    try:
        if not students:
            raise HTTPException(status_code=400, detail="No students provided")
        
        attendance_data = []
        for student in students:
            attendance_data.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'department': student.department,
                'attendance': student.attendancePercentage,
                'status': classify_attendance(student.attendancePercentage),
                'riskLevel': determine_attendance_risk(student.attendancePercentage)
            })
        
        return {
            'success': True,
            'data': attendance_data,
            'summary': calculate_attendance_summary(students)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/distribution")
async def attendance_distribution(students: List[StudentData]):
    """Get attendance distribution statistics"""
    try:
        distribution = AnalyticsEngine.attendance_distribution(students)
        
        return {
            'success': True,
            'data': distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/by-department")
async def attendance_by_department(students: List[StudentData]):
    """Analyze attendance by department"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        dept_analysis = {}
        for dept in df['department'].unique():
            dept_data = df[df['department'] == dept]
            
            dept_analysis[dept] = {
                'total_students': len(dept_data),
                'mean_attendance': float(dept_data['attendancePercentage'].mean()),
                'max_attendance': float(dept_data['attendancePercentage'].max()),
                'min_attendance': float(dept_data['attendancePercentage'].min()),
                'below_75_percent': len(dept_data[dept_data['attendancePercentage'] < 75]),
                'below_80_percent': len(dept_data[dept_data['attendancePercentage'] < 80]),
                'excellent': len(dept_data[dept_data['attendancePercentage'] >= 90])
            }
        
        return {
            'success': True,
            'data': dept_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/at-risk")
async def at_risk_students(students: List[StudentData]):
    """Identify students at risk of detention (60-75% attendance)"""
    try:
        at_risk = []
        
        for student in students:
            if 60 <= student.attendancePercentage < 75:
                avg_marks = np.mean([
                    student.subject1Marks, student.subject2Marks,
                    student.subject3Marks, student.subject4Marks,
                    student.subject5Marks
                ])
                
                at_risk.append({
                    'usn': student.usn,
                    'studentName': student.studentName,
                    'department': student.department,
                    'attendance': student.attendancePercentage,
                    'gpa': student.gpa,
                    'average_marks': round(avg_marks, 2),
                    'warning_level': determine_warning_level(student.attendancePercentage),
                    'recommendation': 'Immediate action required to improve attendance'
                })
        
        return {
            'success': True,
            'data': at_risk,
            'total': len(at_risk)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trend-analysis")
async def attendance_trend(students: List[StudentData]):
    """Analyze attendance trends"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        attendance = df['attendancePercentage']
        
        trend = {
            'mean': float(attendance.mean()),
            'median': float(attendance.median()),
            'std': float(attendance.std()),
            'min': float(attendance.min()),
            'max': float(attendance.max()),
            'q1': float(attendance.quantile(0.25)),
            'q3': float(attendance.quantile(0.75)),
            'iqr': float(attendance.quantile(0.75) - attendance.quantile(0.25))
        }
        
        return {
            'success': True,
            'data': trend
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def classify_attendance(attendance: float) -> str:
    """Classify attendance status"""
    if attendance >= 90:
        return "Excellent"
    elif attendance >= 80:
        return "Good"
    elif attendance >= 75:
        return "Satisfactory"
    elif attendance >= 60:
        return "At Risk"
    else:
        return "Critical"

def determine_attendance_risk(attendance: float) -> str:
    """Determine attendance risk level"""
    if attendance < 60:
        return "Critical"
    elif attendance < 75:
        return "High"
    elif attendance < 85:
        return "Medium"
    else:
        return "Low"

def determine_warning_level(attendance: float) -> str:
    """Determine warning level for at-risk students"""
    if 60 <= attendance < 65:
        return "Critical Warning"
    elif 65 <= attendance < 70:
        return "Severe Warning"
    elif 70 <= attendance < 75:
        return "Final Warning"
    return "At Risk"

def calculate_attendance_summary(students: List[StudentData]) -> dict:
    """Calculate attendance summary statistics"""
    import pandas as pd
    df = AnalyticsEngine.create_dataframe(students)
    
    return {
        'total_students': len(df),
        'mean_attendance': float(df['attendancePercentage'].mean()),
        'median_attendance': float(df['attendancePercentage'].median()),
        'critical_students': len(df[df['attendancePercentage'] < 60]),
        'at_risk_students': len(df[(df['attendancePercentage'] >= 60) & (df['attendancePercentage'] < 75)]),
        'satisfactory_students': len(df[df['attendancePercentage'] >= 75])
    }
