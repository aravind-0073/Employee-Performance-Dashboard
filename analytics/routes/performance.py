from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData, PerformanceAnalysis, BatchAnalysisRequest
from analytics_engine import AnalyticsEngine
import numpy as np

router = APIRouter()

@router.post("/analyze")
async def analyze_student_performance(students: List[StudentData]):
    """Analyze performance for list of students"""
    try:
        if not students:
            raise HTTPException(status_code=400, detail="No students provided")
        
        results = []
        for student in students:
            avg_marks = np.mean([
                student.subject1Marks, student.subject2Marks,
                student.subject3Marks, student.subject4Marks,
                student.subject5Marks
            ])
            
            performance_class = AnalyticsEngine.classify_performance(
                student.gpa, student.attendancePercentage, avg_marks
            )
            
            weak_subjects = AnalyticsEngine.identify_weak_subjects(student)
            strong_subjects = AnalyticsEngine.identify_strong_subjects(student)
            
            analysis = {
                'usn': student.usn,
                'studentName': student.studentName,
                'overall_performance': performance_class,
                'gpa': student.gpa,
                'attendance': student.attendancePercentage,
                'average_marks': round(avg_marks, 2),
                'weak_subjects': weak_subjects,
                'strong_subjects': strong_subjects,
                'risk_level': AnalyticsEngine.determine_risk_level(
                    student.attendancePercentage, student.gpa, avg_marks
                )
            }
            results.append(analysis)
        
        return {
            'success': True,
            'data': results,
            'total': len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/individual/{usn}")
async def analyze_individual_student(usn: str, student: StudentData):
    """Analyze individual student performance"""
    try:
        avg_marks = np.mean([
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ])
        
        performance_class = AnalyticsEngine.classify_performance(
            student.gpa, student.attendancePercentage, avg_marks
        )
        
        weak_subjects = AnalyticsEngine.identify_weak_subjects(student)
        strong_subjects = AnalyticsEngine.identify_strong_subjects(student)
        
        analysis = {
            'usn': student.usn,
            'studentName': student.studentName,
            'overall_performance': performance_class,
            'gpa': student.gpa,
            'cgpa': student.cgpa,
            'attendance': student.attendancePercentage,
            'average_marks': round(avg_marks, 2),
            'weak_subjects': weak_subjects,
            'strong_subjects': strong_subjects,
            'risk_level': AnalyticsEngine.determine_risk_level(
                student.attendancePercentage, student.gpa, avg_marks
            ),
            'subject_marks': {
                'Subject 1': student.subject1Marks,
                'Subject 2': student.subject2Marks,
                'Subject 3': student.subject3Marks,
                'Subject 4': student.subject4Marks,
                'Subject 5': student.subject5Marks,
                'Internal': student.internalMarks
            },
            'recommendations': generate_recommendations(
                student, performance_class, weak_subjects, avg_marks
            )
        }
        
        return {
            'success': True,
            'data': analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def batch_analysis(request: BatchAnalysisRequest):
    """Perform batch analysis on multiple students"""
    try:
        if not request.students:
            raise HTTPException(status_code=400, detail="No students provided")
        
        if request.analysisType == "all" or request.analysisType == "performance":
            performances = []
            for student in request.students:
                avg_marks = np.mean([
                    student.subject1Marks, student.subject2Marks,
                    student.subject3Marks, student.subject4Marks,
                    student.subject5Marks
                ])
                
                performance_class = AnalyticsEngine.classify_performance(
                    student.gpa, student.attendancePercentage, avg_marks
                )
                
                performances.append({
                    'usn': student.usn,
                    'studentName': student.studentName,
                    'performance': performance_class,
                    'gpa': student.gpa
                })
        
        return {
            'success': True,
            'data': performances,
            'analysisType': request.analysisType
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_recommendations(student: StudentData, performance: str, 
                            weak_subjects: List[str], avg_marks: float) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []
    
    if performance == "Poor":
        recommendations.append("Immediate academic counseling recommended")
        recommendations.append("Consider tutoring for weak subjects")
    
    if student.attendancePercentage < 75:
        recommendations.append("Attendance is critical - attend all remaining classes")
    elif student.attendancePercentage < 85:
        recommendations.append("Improve attendance to maintain academic standing")
    
    if weak_subjects:
        recommendations.append(f"Focus on improving performance in: {', '.join(weak_subjects)}")
    
    if avg_marks < 40:
        recommendations.append("Seek additional academic support immediately")
    
    if student.gpa < 5.5:
        recommendations.append("Meet with academic advisor to discuss progress")
    
    return recommendations
