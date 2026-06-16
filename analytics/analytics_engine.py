import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from models import StudentData

class AnalyticsEngine:
    """Core analytics engine for student performance analysis"""
    
    @staticmethod
    def create_dataframe(students: List[StudentData]) -> pd.DataFrame:
        """Convert student list to pandas DataFrame"""
        data = [s.dict() for s in students]
        df = pd.DataFrame(data)
        return df
    
    @staticmethod
    def calculate_average_marks(df: pd.DataFrame) -> pd.Series:
        """Calculate average marks for each student"""
        subject_columns = ['subject1Marks', 'subject2Marks', 'subject3Marks', 
                          'subject4Marks', 'subject5Marks']
        avg_marks = df[subject_columns].mean(axis=1)
        return avg_marks
    
    @staticmethod
    def identify_weak_subjects(student_data: StudentData) -> List[str]:
        """Identify weak subjects for a student"""
        subject_marks = {
            'Subject 1': student_data.subject1Marks,
            'Subject 2': student_data.subject2Marks,
            'Subject 3': student_data.subject3Marks,
            'Subject 4': student_data.subject4Marks,
            'Subject 5': student_data.subject5Marks
        }
        
        # Weak if marks < 40
        weak_subjects = [subject for subject, marks in subject_marks.items() 
                        if marks < 40]
        return weak_subjects
    
    @staticmethod
    def identify_strong_subjects(student_data: StudentData) -> List[str]:
        """Identify strong subjects for a student"""
        subject_marks = {
            'Subject 1': student_data.subject1Marks,
            'Subject 2': student_data.subject2Marks,
            'Subject 3': student_data.subject3Marks,
            'Subject 4': student_data.subject4Marks,
            'Subject 5': student_data.subject5Marks
        }
        
        # Strong if marks >= 80
        strong_subjects = [subject for subject, marks in subject_marks.items() 
                          if marks >= 80]
        return strong_subjects
    
    @staticmethod
    def classify_performance(gpa: float, attendance: float, avg_marks: float) -> str:
        """Classify student performance"""
        if gpa >= 8.5 and attendance >= 90 and avg_marks >= 85:
            return "Excellent"
        elif gpa >= 7.5 and attendance >= 75:
            return "Very Good"
        elif gpa >= 6.5 and attendance >= 75:
            return "Good"
        elif gpa >= 5.5 and attendance >= 60:
            return "Average"
        else:
            return "Poor"
    
    @staticmethod
    def determine_risk_level(attendance: float, gpa: float, avg_marks: float) -> str:
        """Determine student risk level"""
        if attendance < 75:
            return "High"
        elif attendance < 80 or gpa < 5.5 or avg_marks < 40:
            return "Medium"
        else:
            return "Low"
    
    @staticmethod
    def identify_detained_students(students: List[StudentData]) -> List[Dict]:
        """Identify students with attendance < 75%"""
        detained = []
        
        for student in students:
            if student.attendancePercentage < 75:
                avg_marks = np.mean([
                    student.subject1Marks, student.subject2Marks,
                    student.subject3Marks, student.subject4Marks,
                    student.subject5Marks
                ])
                
                risk_level = AnalyticsEngine.determine_risk_level(
                    student.attendancePercentage, student.gpa, avg_marks
                )
                
                detention_record = {
                    'usn': student.usn,
                    'studentName': student.studentName,
                    'department': student.department,
                    'semester': student.semester,
                    'section': student.section,
                    'attendancePercentage': student.attendancePercentage,
                    'gpa': student.gpa,
                    'detentionReason': 'Attendance below 75%',
                    'riskLevel': risk_level,
                    'counselorRecommendation': f"Immediate counseling required. Attendance: {student.attendancePercentage}%"
                }
                detained.append(detention_record)
        
        return detained
    
    @staticmethod
    def calculate_statistics(students: List[StudentData]) -> Dict:
        """Calculate statistical measures"""
        df = AnalyticsEngine.create_dataframe(students)
        
        # GPA statistics
        gpa_values = df['gpa'].dropna()
        
        # Attendance statistics
        attendance_values = df['attendancePercentage']
        
        # Average marks
        subject_columns = ['subject1Marks', 'subject2Marks', 'subject3Marks', 
                          'subject4Marks', 'subject5Marks']
        avg_marks = df[subject_columns].mean().mean()
        
        # Correlation between attendance and GPA
        correlation = attendance_values.corr(gpa_values)
        
        # Risk students
        risk_students = df[df['attendancePercentage'] < 75]
        
        return {
            'mean_gpa': float(gpa_values.mean()),
            'median_gpa': float(gpa_values.median()),
            'std_gpa': float(gpa_values.std()),
            'min_gpa': float(gpa_values.min()),
            'max_gpa': float(gpa_values.max()),
            'mean_attendance': float(attendance_values.mean()),
            'median_attendance': float(attendance_values.median()),
            'std_attendance': float(attendance_values.std()),
            'mean_marks': float(avg_marks),
            'correlation_attendance_gpa': float(correlation) if not np.isnan(correlation) else 0,
            'students_at_risk': len(risk_students),
            'total_students': len(df)
        }
    
    @staticmethod
    def identify_top_performers(students: List[StudentData], limit: int = 10) -> List[Dict]:
        """Identify top performing students"""
        df = AnalyticsEngine.create_dataframe(students)
        top_students = df.nlargest(limit, 'gpa')
        
        return top_students.to_dict(orient='records')
    
    @staticmethod
    def identify_weak_performers(students: List[StudentData], limit: int = 10) -> List[Dict]:
        """Identify weak performing students"""
        df = AnalyticsEngine.create_dataframe(students)
        weak_students = df.nsmallest(limit, 'gpa')
        
        return weak_students.to_dict(orient='records')
    
    @staticmethod
    def department_analysis(students: List[StudentData]) -> Dict:
        """Analyze performance by department"""
        df = AnalyticsEngine.create_dataframe(students)
        
        analysis = {}
        for dept in df['department'].unique():
            dept_data = df[df['department'] == dept]
            
            analysis[dept] = {
                'total_students': len(dept_data),
                'mean_gpa': float(dept_data['gpa'].mean()),
                'mean_attendance': float(dept_data['attendancePercentage'].mean()),
                'detained_count': len(dept_data[dept_data['attendancePercentage'] < 75]),
                'pass_rate': float((dept_data['gpa'] >= 5.5).sum() / len(dept_data) * 100)
            }
        
        return analysis
    
    @staticmethod
    def semester_analysis(students: List[StudentData]) -> Dict:
        """Analyze performance by semester"""
        df = AnalyticsEngine.create_dataframe(students)
        
        analysis = {}
        for sem in sorted(df['semester'].unique()):
            sem_data = df[df['semester'] == sem]
            
            analysis[f'Semester {int(sem)}'] = {
                'total_students': len(sem_data),
                'mean_gpa': float(sem_data['gpa'].mean()),
                'mean_attendance': float(sem_data['attendancePercentage'].mean()),
                'detained_count': len(sem_data[sem_data['attendancePercentage'] < 75])
            }
        
        return analysis
    
    @staticmethod
    def gpa_distribution(students: List[StudentData]) -> Dict:
        """Get GPA distribution"""
        df = AnalyticsEngine.create_dataframe(students)
        
        ranges = {
            'Excellent (8.5-10)': len(df[df['gpa'] >= 8.5]),
            'Very Good (7.5-8.5)': len(df[(df['gpa'] >= 7.5) & (df['gpa'] < 8.5)]),
            'Good (6.5-7.5)': len(df[(df['gpa'] >= 6.5) & (df['gpa'] < 7.5)]),
            'Average (5.5-6.5)': len(df[(df['gpa'] >= 5.5) & (df['gpa'] < 6.5)]),
            'Poor (<5.5)': len(df[df['gpa'] < 5.5])
        }
        
        return ranges
    
    @staticmethod
    def attendance_distribution(students: List[StudentData]) -> Dict:
        """Get attendance distribution"""
        df = AnalyticsEngine.create_dataframe(students)
        
        ranges = {
            'Excellent (>= 90)': len(df[df['attendancePercentage'] >= 90]),
            'Good (80-90)': len(df[(df['attendancePercentage'] >= 80) & (df['attendancePercentage'] < 90)]),
            'Average (75-80)': len(df[(df['attendancePercentage'] >= 75) & (df['attendancePercentage'] < 80)]),
            'Poor (< 75)': len(df[df['attendancePercentage'] < 75])
        }
        
        return ranges

    # ─── NEW: ML & Advanced Analytics Methods ─────────────────────────────────

    @staticmethod
    def calculate_risk_score(student: StudentData) -> Dict:
        """Calculate composite risk score (0-100) for a student.
        Higher score = higher risk."""
        avg_marks = np.mean([
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ])

        risk_score = 0.0

        # Attendance factor (max 35 pts)
        if student.attendancePercentage < 60:
            risk_score += 35
        elif student.attendancePercentage < 70:
            risk_score += 25
        elif student.attendancePercentage < 75:
            risk_score += 18
        elif student.attendancePercentage < 80:
            risk_score += 8

        # GPA factor (max 25 pts)
        if student.gpa < 4.0:
            risk_score += 25
        elif student.gpa < 5.0:
            risk_score += 18
        elif student.gpa < 5.5:
            risk_score += 12
        elif student.gpa < 6.5:
            risk_score += 5

        # Internal marks factor (max 15 pts)
        if student.internalMarks < 15:
            risk_score += 15
        elif student.internalMarks < 20:
            risk_score += 10
        elif student.internalMarks < 25:
            risk_score += 5

        # Subject failures factor (max 15 pts)
        weak_count = sum(1 for m in [
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ] if m < 40)
        risk_score += min(weak_count * 5, 15)

        # Average marks factor (max 10 pts)
        if avg_marks < 35:
            risk_score += 10
        elif avg_marks < 45:
            risk_score += 6
        elif avg_marks < 55:
            risk_score += 3

        risk_score = min(risk_score, 100)

        # Classify
        if risk_score >= 60:
            level = "High Risk"
        elif risk_score >= 35:
            level = "Medium Risk"
        else:
            level = "Low Risk"

        return {
            'risk_score': round(risk_score, 1),
            'risk_level': level,
            'factors': {
                'attendance': student.attendancePercentage,
                'gpa': student.gpa,
                'internal_marks': student.internalMarks,
                'weak_subjects': weak_count,
                'avg_marks': round(avg_marks, 2)
            }
        }

    @staticmethod
    def predict_gpa(students: List[StudentData]) -> List[Dict]:
        """Use Linear Regression to predict GPA from attendance + internal marks."""
        from sklearn.linear_model import LinearRegression

        df = AnalyticsEngine.create_dataframe(students)

        subject_cols = ['subject1Marks', 'subject2Marks', 'subject3Marks',
                        'subject4Marks', 'subject5Marks']
        df['avg_marks'] = df[subject_cols].mean(axis=1)

        features = df[['attendancePercentage', 'internalMarks', 'avg_marks']].values
        target = df['gpa'].values

        model = LinearRegression()
        model.fit(features, target)
        predictions = model.predict(features)

        # Clamp predictions to valid GPA range
        predictions = np.clip(predictions, 0, 10)

        results = []
        for i, student in enumerate(students):
            results.append({
                'usn': student.usn,
                'studentName': student.studentName,
                'current_gpa': student.gpa,
                'predicted_gpa': round(float(predictions[i]), 2),
                'difference': round(float(predictions[i]) - student.gpa, 2)
            })

        r_squared = model.score(features, target)

        return {
            'predictions': results,
            'model_info': {
                'r_squared': round(float(r_squared), 4),
                'features_used': ['attendancePercentage', 'internalMarks', 'avg_marks'],
                'model_type': 'Linear Regression'
            }
        }

    @staticmethod
    def calculate_academic_health_index(student: StudentData) -> Dict:
        """Generate Academic Health Index (0-100) based on weighted factors."""
        avg_marks = np.mean([
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ])

        # Weighted components
        attendance_score = (student.attendancePercentage / 100) * 30  # 30% weight
        gpa_score = (student.gpa / 10) * 40  # 40% weight
        marks_score = (avg_marks / 100) * 20  # 20% weight
        internal_score = (student.internalMarks / 50) * 10  # 10% weight

        health_index = round(attendance_score + gpa_score + marks_score + internal_score, 1)
        health_index = min(health_index, 100)

        # Classification
        if health_index >= 85:
            classification = "Excellent"
        elif health_index >= 70:
            classification = "Good"
        elif health_index >= 55:
            classification = "Average"
        elif health_index >= 40:
            classification = "Needs Improvement"
        else:
            classification = "Critical"

        return {
            'health_index': health_index,
            'classification': classification,
            'breakdown': {
                'attendance_component': round(attendance_score, 1),
                'gpa_component': round(gpa_score, 1),
                'marks_component': round(marks_score, 1),
                'internal_component': round(internal_score, 1)
            }
        }

    @staticmethod
    def generate_dynamic_insights(students: List[StudentData]) -> List[Dict]:
        """Generate dynamic insight statements from data analysis."""
        df = AnalyticsEngine.create_dataframe(students)
        insights = []

        if len(df) == 0:
            return [{'type': 'info', 'message': 'No data available to generate insights.'}]

        # 1. Correlation insight
        corr = df['attendancePercentage'].corr(df['gpa'])
        if not np.isnan(corr):
            if abs(corr) >= 0.7:
                strength = "strong"
            elif abs(corr) >= 0.4:
                strength = "moderate"
            else:
                strength = "weak"
            direction = "positive" if corr > 0 else "negative"
            insights.append({
                'type': 'correlation',
                'icon': 'trending',
                'message': f"Attendance and GPA have a {strength} {direction} relationship (r = {corr:.2f})."
            })

        # 2. Best performing department
        dept_stats = df.groupby('department').agg(
            mean_gpa=('gpa', 'mean'),
            mean_attendance=('attendancePercentage', 'mean')
        ).reset_index()

        if len(dept_stats) > 0:
            best_dept = dept_stats.loc[dept_stats['mean_gpa'].idxmax()]
            insights.append({
                'type': 'positive',
                'icon': 'trophy',
                'message': f"{best_dept['department']} department achieved the highest average GPA ({best_dept['mean_gpa']:.2f})."
            })

            # Worst performing department
            worst_dept = dept_stats.loc[dept_stats['mean_gpa'].idxmin()]
            if worst_dept['department'] != best_dept['department']:
                insights.append({
                    'type': 'warning',
                    'icon': 'alert',
                    'message': f"{worst_dept['department']} department has the lowest average GPA ({worst_dept['mean_gpa']:.2f}) and needs attention."
                })

        # 3. Detention rate by department
        detained_df = df[df['attendancePercentage'] < 75]
        if len(detained_df) > 0:
            dept_detention = detained_df.groupby('department').size().reset_index(name='count')
            dept_totals = df.groupby('department').size().reset_index(name='total')
            merged = dept_detention.merge(dept_totals, on='department')
            merged['rate'] = (merged['count'] / merged['total'] * 100).round(1)
            worst_detention = merged.loc[merged['rate'].idxmax()]
            insights.append({
                'type': 'danger',
                'icon': 'alert',
                'message': f"{worst_detention['department']} department has the highest detention rate ({worst_detention['rate']}%)."
            })

        # 4. Risk students count
        risk_count = len(df[(df['attendancePercentage'] < 75) | (df['gpa'] < 5)])
        if risk_count > 0:
            insights.append({
                'type': 'danger',
                'icon': 'warning',
                'message': f"{risk_count} students are classified as academically at-risk (attendance <75% or GPA <5)."
            })

        # 5. Semester trend insights
        sem_stats = df.groupby('semester').agg(
            mean_attendance=('attendancePercentage', 'mean')
        ).sort_index()
        if len(sem_stats) >= 2:
            # Find semesters with declining attendance
            for i in range(1, len(sem_stats)):
                curr_sem = sem_stats.index[i]
                prev_sem = sem_stats.index[i - 1]
                drop = sem_stats.loc[prev_sem, 'mean_attendance'] - sem_stats.loc[curr_sem, 'mean_attendance']
                if drop > 5:
                    insights.append({
                        'type': 'warning',
                        'icon': 'trending_down',
                        'message': f"Semester {int(curr_sem)} shows declining attendance compared to Semester {int(prev_sem)} (drop of {drop:.1f}%)."
                    })

        # 6. Overall pass rate
        pass_rate = (df['gpa'] >= 5.5).sum() / len(df) * 100
        if pass_rate >= 80:
            insights.append({
                'type': 'positive',
                'icon': 'check',
                'message': f"Overall pass rate is strong at {pass_rate:.1f}%."
            })
        elif pass_rate < 60:
            insights.append({
                'type': 'danger',
                'icon': 'alert',
                'message': f"Overall pass rate is concerning at {pass_rate:.1f}%."
            })

        # 7. High-performing students
        excellent_count = len(df[df['gpa'] >= 8.5])
        if excellent_count > 0:
            pct = (excellent_count / len(df) * 100)
            insights.append({
                'type': 'positive',
                'icon': 'star',
                'message': f"{excellent_count} students ({pct:.1f}%) have achieved Excellent GPA (≥8.5)."
            })

        return insights

    @staticmethod
    def department_ranking(students: List[StudentData]) -> List[Dict]:
        """Rank departments using weighted formula:
        40% GPA + 30% Attendance + 20% Pass% + 10% Detention Rate (inverted)"""
        df = AnalyticsEngine.create_dataframe(students)

        if len(df) == 0:
            return []

        rankings = []
        for dept in df['department'].unique():
            dept_data = df[df['department'] == dept]
            total = len(dept_data)
            mean_gpa = float(dept_data['gpa'].mean())
            mean_att = float(dept_data['attendancePercentage'].mean())
            pass_pct = float((dept_data['gpa'] >= 5.5).sum() / total * 100)
            detained_count = len(dept_data[dept_data['attendancePercentage'] < 75])
            detention_rate = (detained_count / total * 100)

            # Normalize to 0-100 scales
            gpa_norm = (mean_gpa / 10) * 100
            att_norm = mean_att  # already 0-100
            pass_norm = pass_pct  # already 0-100
            detention_norm = 100 - detention_rate  # invert: lower detention = higher score

            weighted_score = (
                gpa_norm * 0.40 +
                att_norm * 0.30 +
                pass_norm * 0.20 +
                detention_norm * 0.10
            )

            # Find top student
            top_student = dept_data.loc[dept_data['gpa'].idxmax()]

            # Average subject marks
            subject_cols = ['subject1Marks', 'subject2Marks', 'subject3Marks',
                           'subject4Marks', 'subject5Marks']
            avg_subject_marks = float(dept_data[subject_cols].mean().mean())

            rankings.append({
                'department': dept,
                'weighted_score': round(weighted_score, 2),
                'total_students': total,
                'mean_gpa': round(mean_gpa, 2),
                'mean_attendance': round(mean_att, 2),
                'pass_percentage': round(pass_pct, 2),
                'fail_percentage': round(100 - pass_pct, 2),
                'detained_count': detained_count,
                'detention_rate': round(detention_rate, 2),
                'top_student': {
                    'usn': top_student['usn'],
                    'name': top_student['studentName'],
                    'gpa': float(top_student['gpa'])
                },
                'avg_subject_marks': round(avg_subject_marks, 2)
            })

        rankings.sort(key=lambda x: x['weighted_score'], reverse=True)
        for i, r in enumerate(rankings):
            r['rank'] = i + 1

        return rankings

    @staticmethod
    def classify_detention_priority(student: StudentData) -> Dict:
        """Classify detention priority level and generate intervention suggestions."""
        avg_marks = np.mean([
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ])
        weak_count = sum(1 for m in [
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ] if m < 40)

        reasons = []
        if student.attendancePercentage < 75:
            reasons.append('Low Attendance')
        if student.gpa < 5.0:
            reasons.append('Low GPA')
        if weak_count >= 3:
            reasons.append('Multiple Backlogs')

        # Priority classification
        severity = 0
        if student.attendancePercentage < 60:
            severity += 3
        elif student.attendancePercentage < 70:
            severity += 2
        elif student.attendancePercentage < 75:
            severity += 1

        if student.gpa < 4.0:
            severity += 3
        elif student.gpa < 5.0:
            severity += 2
        elif student.gpa < 5.5:
            severity += 1

        if weak_count >= 4:
            severity += 2
        elif weak_count >= 2:
            severity += 1

        if severity >= 6:
            priority = 'Critical'
        elif severity >= 4:
            priority = 'High'
        elif severity >= 2:
            priority = 'Medium'
        else:
            priority = 'Low'

        # Generate intervention suggestions
        interventions = []
        if priority == 'Critical':
            interventions.append('Immediate meeting with HOD and parents')
            interventions.append('Daily attendance monitoring')
            interventions.append('Assign dedicated academic mentor')
        if priority in ('Critical', 'High'):
            interventions.append('Immediate faculty counseling session')
            interventions.append('Weekly progress review meetings')
        if 'Low Attendance' in reasons:
            interventions.append('Attendance monitoring and daily check-in')
            interventions.append('Identify and address root cause of absenteeism')
        if 'Low GPA' in reasons:
            interventions.append('Enroll in remedial classes')
            interventions.append('Peer tutoring program')
        if 'Multiple Backlogs' in reasons:
            interventions.append('Subject-specific tutoring for backlog subjects')
            interventions.append('Structured study plan with milestone tracking')
        if not interventions:
            interventions.append('Academic counseling recommended')

        return {
            'priority': priority,
            'severity_score': severity,
            'reasons': reasons,
            'interventions': interventions,
            'category': 'Multiple Reasons' if len(reasons) > 1 else (reasons[0] if reasons else 'Other')
        }

    @staticmethod
    def generate_student_recommendations(student: StudentData) -> Dict:
        """Generate per-student strengths, weaknesses, and recommendations."""
        avg_marks = np.mean([
            student.subject1Marks, student.subject2Marks,
            student.subject3Marks, student.subject4Marks,
            student.subject5Marks
        ])

        strong_subjects = AnalyticsEngine.identify_strong_subjects(student)
        weak_subjects = AnalyticsEngine.identify_weak_subjects(student)
        performance = AnalyticsEngine.classify_performance(
            student.gpa, student.attendancePercentage, avg_marks
        )

        strengths = []
        weaknesses = []
        recommendations = []

        # Attendance analysis
        if student.attendancePercentage >= 90:
            strengths.append('Excellent attendance record')
        elif student.attendancePercentage >= 75:
            strengths.append('Adequate attendance')
        else:
            weaknesses.append(f'Low attendance ({student.attendancePercentage}%)')
            recommendations.append(f'Improve attendance — currently at {student.attendancePercentage}%, target 75%+')

        # GPA analysis
        if student.gpa >= 8.5:
            strengths.append(f'Outstanding GPA ({student.gpa})')
        elif student.gpa >= 7.5:
            strengths.append(f'Strong GPA ({student.gpa})')
        elif student.gpa < 5.5:
            weaknesses.append(f'Below-average GPA ({student.gpa})')
            recommendations.append('Focus on core concepts and fundamentals to improve GPA')

        # Subject analysis
        if strong_subjects:
            strengths.append(f'Excellent performance in {", ".join(strong_subjects)}')
        if weak_subjects:
            weaknesses.append(f'Needs improvement in {", ".join(weak_subjects)}')
            recommendations.append(f'Seek tutoring or extra practice in {", ".join(weak_subjects)}')

        # Internal marks
        if student.internalMarks >= 40:
            strengths.append('Strong internal assessment scores')
        elif student.internalMarks < 20:
            weaknesses.append('Low internal marks')
            recommendations.append('Improve preparation for internal assessments')

        # General recommendations
        if not recommendations:
            recommendations.append('Maintain current performance level')
            if student.gpa < 9.0:
                recommendations.append('Aim for higher GPA in upcoming semester')

        return {
            'usn': student.usn,
            'studentName': student.studentName,
            'performance_class': performance,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations
        }

    @staticmethod
    def calculate_correlation_with_interpretation(students: List[StudentData]) -> Dict:
        """Calculate Pearson correlation between attendance and GPA with full interpretation."""
        df = AnalyticsEngine.create_dataframe(students)

        corr = df['attendancePercentage'].corr(df['gpa'])
        if np.isnan(corr):
            corr = 0.0

        abs_corr = abs(corr)
        if abs_corr >= 0.7:
            strength = "Strong"
        elif abs_corr >= 0.4:
            strength = "Moderate"
        elif abs_corr >= 0.2:
            strength = "Weak"
        else:
            strength = "Very Weak"

        direction = "Positive" if corr > 0 else "Negative"

        if corr > 0.4:
            interpretation = "Students with better attendance tend to achieve significantly higher GPAs."
        elif corr > 0.2:
            interpretation = "There is a noticeable trend of higher GPAs among students with better attendance."
        elif corr > 0:
            interpretation = "Attendance has a slight positive influence on GPA, but other factors play a larger role."
        elif corr < -0.2:
            interpretation = "Unusually, attendance shows a negative relationship with GPA — this may indicate data quality issues."
        else:
            interpretation = "Attendance and GPA show minimal linear relationship in this dataset."

        return {
            'coefficient': round(float(corr), 4),
            'strength': strength,
            'direction': direction,
            'label': f"{strength} {direction} Correlation",
            'interpretation': interpretation
        }
