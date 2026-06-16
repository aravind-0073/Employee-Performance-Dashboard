from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData
from analytics_engine import AnalyticsEngine
import numpy as np

router = APIRouter()

@router.post("/at-risk-students")
async def predict_at_risk_students(students: List[StudentData]):
    """Predict students at risk of failing"""
    try:
        predictions = []
        
        for student in students:
            avg_marks = np.mean([
                student.subject1Marks, student.subject2Marks,
                student.subject3Marks, student.subject4Marks,
                student.subject5Marks
            ])
            
            risk_factors = []
            risk_score = 0
            
            # Check risk factors
            if student.attendancePercentage < 75:
                risk_factors.append("Low attendance")
                risk_score += 30
            
            if student.gpa < 5.5:
                risk_factors.append("Low GPA")
                risk_score += 25
            
            if avg_marks < 40:
                risk_factors.append("Low average marks")
                risk_score += 25
            
            if student.internalMarks < 20:
                risk_factors.append("Low internal marks")
                risk_score += 10
            
            # Count weak subjects
            weak_count = sum(1 for marks in [student.subject1Marks, student.subject2Marks,
                                            student.subject3Marks, student.subject4Marks,
                                            student.subject5Marks] if marks < 40)
            if weak_count >= 3:
                risk_factors.append(f"{weak_count} weak subjects")
                risk_score += 10
            
            # Predict
            if risk_score >= 50:
                prediction = "High Risk"
                confidence = min(risk_score / 100, 1.0)
            elif risk_score >= 30:
                prediction = "Medium Risk"
                confidence = min(risk_score / 100, 1.0)
            else:
                prediction = "Low Risk"
                confidence = 1 - (risk_score / 100)
            
            recommendations = generate_risk_recommendations(student, risk_factors)
            
            predictions.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'prediction': prediction,
                'risk_score': risk_score,
                'confidence': round(confidence, 3),
                'risk_factors': risk_factors,
                'recommendations': recommendations
            })
        
        return {
            'success': True,
            'data': predictions,
            'summary': {
                'high_risk': len([p for p in predictions if p['prediction'] == 'High Risk']),
                'medium_risk': len([p for p in predictions if p['prediction'] == 'Medium Risk']),
                'low_risk': len([p for p in predictions if p['prediction'] == 'Low Risk'])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subject-wise-prediction")
async def subject_wise_prediction(students: List[StudentData]):
    """Predict performance for each subject"""
    try:
        predictions = []
        
        for student in students:
            subjects = [
                ('Subject 1', student.subject1Marks),
                ('Subject 2', student.subject2Marks),
                ('Subject 3', student.subject3Marks),
                ('Subject 4', student.subject4Marks),
                ('Subject 5', student.subject5Marks)
            ]
            
            subject_predictions = []
            for subject_name, marks in subjects:
                if marks < 40:
                    status = "Weak"
                    action = "Requires immediate tutoring"
                elif marks < 60:
                    status = "Needs Improvement"
                    action = "Additional study recommended"
                elif marks < 80:
                    status = "Good"
                    action = "Maintain current performance"
                else:
                    status = "Excellent"
                    action = "Continue strong performance"
                
                subject_predictions.append({
                    'subject': subject_name,
                    'marks': marks,
                    'status': status,
                    'action': action
                })
            
            predictions.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'subjects': subject_predictions
            })
        
        return {
            'success': True,
            'data': predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance-improvement-score")
async def performance_improvement_potential(students: List[StudentData]):
    """Estimate improvement potential based on current performance"""
    try:
        results = []
        
        for student in students:
            avg_marks = np.mean([
                student.subject1Marks, student.subject2Marks,
                student.subject3Marks, student.subject4Marks,
                student.subject5Marks
            ])
            
            # Calculate improvement potential
            potential_score = 100
            
            # Deduct based on current performance
            if student.gpa >= 8:
                potential_score -= 40  # Already performing well
            elif student.gpa >= 6:
                potential_score -= 20
            
            if student.attendancePercentage >= 90:
                potential_score -= 10  # Already good attendance
            
            if avg_marks >= 80:
                potential_score -= 15
            
            potential_percentage = max(potential_score, 10)  # Minimum 10%
            
            results.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'current_gpa': student.gpa,
                'improvement_potential': round(potential_percentage, 2),
                'possible_gpa_range': {
                    'current': student.gpa,
                    'potential': round(student.gpa + (potential_percentage / 100), 2),
                    'max': 10.0
                }
            })
        
        return {
            'success': True,
            'data': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_risk_recommendations(student: StudentData, risk_factors: List[str]) -> List[str]:
    """Generate recommendations based on risk factors"""
    recommendations = []
    
    if "Low attendance" in risk_factors:
        recommendations.append("Attend all remaining classes without fail")
        recommendations.append("Meet with academic advisor about attendance issues")
    
    if "Low GPA" in risk_factors:
        recommendations.append("Focus on core subjects and fundamentals")
        recommendations.append("Consider weekly study groups")
    
    if "Low average marks" in risk_factors:
        recommendations.append("Increase study hours")
        recommendations.append("Seek peer or professional tutoring")
    
    if "Low internal marks" in risk_factors:
        recommendations.append("Prepare better for internal assessments")
        recommendations.append("Practice with previous years' question papers")
    
    for factor in risk_factors:
        if "weak subjects" in factor:
            recommendations.append("Prioritize weak subjects in study schedule")
    
    if len(recommendations) == 0:
        recommendations.append("Maintain current performance level")
    
    return recommendations
