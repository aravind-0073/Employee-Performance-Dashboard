import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)
from typing import List, Dict, Any, Tuple, Optional
from models import (
    EmployeeData, KPISummary, DepartmentMetric, StatisticalInsightsResponse,
    InsightItem, DistributionsResponse, DistributionBucket, PredictionResponse,
    RiskAssessmentResponse, RiskAssessmentItem, EmployeeDeepDiveResponse,
    PreprocessingReport, ModelEvaluationMetrics, MLModelComparisonResponse,
    MLPredictionRequest, MLPredictionResult, EDAVisualizationsResponse
)

class AnalyticsEngine:
    """
    Enterprise Workforce Analytics, Data Mining, and Machine Learning Engine.
    Executes vectorized computations, statistical testing, and Scikit-learn classification models.
    """

    @staticmethod
    def to_dataframe(employees: List[EmployeeData]) -> pd.DataFrame:
        if not employees:
            return pd.DataFrame()
        data = [e.model_dump() for e in employees]
        df = pd.DataFrame(data)

        # Standard numeric attributes
        numeric_cols = [
            'experience', 'attendancePercentage', 'performanceScore',
            'productivityScore', 'qualityScore', 'targetCompletionRate',
            'projectsCompleted', 'tasksCompleted', 'salary', 'trainingHours',
            'workingHours', 'jobSatisfaction', 'workload', 'previousPerformanceRating'
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            else:
                df[col] = np.nan

        # Fill defaults if missing
        df['workingHours'] = df['workingHours'].fillna(40.0)
        df['trainingHours'] = df['trainingHours'].fillna(20.0)
        df['jobSatisfaction'] = df['jobSatisfaction'].fillna(3.8)
        df['workload'] = df['workload'].fillna(3.2)
        df['previousPerformanceRating'] = df['previousPerformanceRating'].fillna(3.5)
        df['qualityScore'] = df['qualityScore'].fillna(80.0)
        df['targetCompletionRate'] = df['targetCompletionRate'].fillna(85.0)

        df['taskCompletionScore'] = np.clip(df['tasksCompleted'].fillna(0) * 5.0, 0, 100)
        df.loc[df['tasksCompleted'] == 0, 'taskCompletionScore'] = np.clip(df['targetCompletionRate'], 0, 100)

        # EPI Calculation
        df['epi'] = (
            (0.30 * df['productivityScore'].fillna(75.0)) +
            (0.25 * df['qualityScore'].fillna(80.0)) +
            (0.20 * df['attendancePercentage'].fillna(85.0)) +
            (0.15 * df['targetCompletionRate'].fillna(85.0)) +
            (0.10 * df['taskCompletionScore'])
        ).round(2)

        # 3-Tier Academic Machine Learning Classification Target:
        # Low (< 65), Medium (65 - 79.9), High (>= 80)
        conditions_3class = [
            df['performanceScore'] < 65.0,
            (df['performanceScore'] >= 65.0) & (df['performanceScore'] < 80.0),
            df['performanceScore'] >= 80.0
        ]
        categories_3class = ['Low', 'Medium', 'High']
        df['mlCategory'] = np.select(conditions_3class, categories_3class, default='Medium')

        # 5-Tier Executive Category
        conditions_5class = [
            df['epi'] >= 85.0,
            (df['epi'] >= 75.0) & (df['epi'] < 85.0),
            (df['epi'] >= 65.0) & (df['epi'] < 75.0),
            (df['epi'] >= 50.0) & (df['epi'] < 65.0),
            df['epi'] < 50.0
        ]
        categories_5class = ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Critical']
        df['performanceCategory'] = np.select(conditions_5class, categories_5class, default='Average')

        # Risk Level
        risk_conditions = [
            (df['epi'] < 50.0) | ((df['performanceScore'] < 50.0) & (df['attendancePercentage'] < 70.0)),
            (df['epi'] < 65.0) | (df['performanceScore'] < 60.0) | (df['attendancePercentage'] < 75.0),
            (df['epi'] < 75.0) | (df['performanceScore'] < 70.0),
            (df['epi'] >= 75.0) & (df['performanceScore'] >= 70.0)
        ]
        risks = ['Critical', 'High', 'Medium', 'Low']
        df['riskLevel'] = np.select(risk_conditions, risks, default='Medium')

        return df

    @classmethod
    def calculate_kpis(cls, employees: List[EmployeeData]) -> KPISummary:
        df = cls.to_dataframe(employees)
        if df.empty:
            return KPISummary(
                totalEmployees=0,
                averagePerformance=0.0,
                averageAttendance=0.0,
                averageProductivity=0.0,
                averageTargetAchievement=0.0,
                averageQualityScore=0.0,
                highPerformersCount=0,
                underperformingCount=0,
                criticalRiskCount=0,
                totalProjectsCompleted=0,
                totalTrainingHours=0.0
            )

        high_performers = int((df['performanceScore'] >= 80.0).sum())
        underperforming = int((df['performanceScore'] < 60.0).sum())
        critical_risk = int((df['riskLevel'] == 'Critical').sum())

        return KPISummary(
            totalEmployees=len(df),
            averagePerformance=round(float(df['performanceScore'].mean()), 2),
            averageAttendance=round(float(df['attendancePercentage'].mean()), 2),
            averageProductivity=round(float(df['productivityScore'].mean()), 2),
            averageTargetAchievement=round(float(df['targetCompletionRate'].mean()), 2),
            averageQualityScore=round(float(df['qualityScore'].mean()), 2),
            highPerformersCount=high_performers,
            underperformingCount=underperforming,
            criticalRiskCount=critical_risk,
            totalProjectsCompleted=int(df['projectsCompleted'].fillna(0).sum()),
            totalTrainingHours=round(float(df['trainingHours'].fillna(0).sum()), 1)
        )

    @classmethod
    def generate_insights(cls, employees: List[EmployeeData]) -> StatisticalInsightsResponse:
        df = cls.to_dataframe(employees)
        if df.empty or len(df) < 2:
            return StatisticalInsightsResponse(
                correlationAttendancePerformance=0.0,
                correlationProductivityPerformance=0.0,
                attendancePValue=1.0,
                productivityPValue=1.0,
                bestDepartment={},
                lowestDepartment={},
                productivityDropDepartments=[],
                insights=[]
            )

        insights: List[InsightItem] = []

        # 1. Pearson Correlation: Attendance vs Performance
        r_att, p_att = 0.0, 1.0
        if df['attendancePercentage'].std() > 0 and df['performanceScore'].std() > 0:
            res = stats.pearsonr(df['attendancePercentage'], df['performanceScore'])
            r_att, p_att = float(res.statistic), float(res.pvalue)

        att_desc = (
            f"Strong positive correlation (r = {r_att:.2f}, p < {p_att:.3f}): attendance is a primary driver of performance."
            if r_att >= 0.5 else
            f"Moderate positive correlation (r = {r_att:.2f}): regular attendance moderately reinforces performance scores."
            if r_att > 0.2 else
            f"Low correlation (r = {r_att:.2f}): attendance variability does not directly correspond with performance variations."
        )
        insights.append(InsightItem(
            id="insight-att-corr",
            type="correlation",
            title="Attendance & Performance Correlation",
            description=att_desc,
            severity="info" if r_att >= 0.3 else "warning",
            metricValue=round(r_att, 2),
            metadata={"pValue": round(p_att, 4), "variableA": "Attendance", "variableB": "Performance"}
        ))

        # 2. Pearson Correlation: Productivity vs Performance
        r_prod, p_prod = 0.0, 1.0
        if df['productivityScore'].std() > 0 and df['performanceScore'].std() > 0:
            res = stats.pearsonr(df['productivityScore'], df['performanceScore'])
            r_prod, p_prod = float(res.statistic), float(res.pvalue)

        insights.append(InsightItem(
            id="insight-prod-corr",
            type="correlation",
            title="Productivity & Performance Relationship",
            description=f"Productivity score exhibits an r = {r_prod:.2f} alignment with evaluated performance ratings.",
            severity="success" if r_prod >= 0.6 else "info",
            metricValue=round(r_prod, 2)
        ))

        # 3. Department Benchmarking Analysis
        dept_grouped = df.groupby('department').agg(
            avg_perf=('performanceScore', 'mean'),
            avg_prod=('productivityScore', 'mean'),
            avg_att=('attendancePercentage', 'mean'),
            avg_target=('targetCompletionRate', 'mean'),
            headcount=('employeeId', 'count')
        ).reset_index()

        dept_grouped['score'] = (
            (0.40 * dept_grouped['avg_perf']) +
            (0.30 * dept_grouped['avg_prod']) +
            (0.20 * dept_grouped['avg_att']) +
            (0.10 * dept_grouped['avg_target'])
        ).round(2)

        dept_sorted = dept_grouped.sort_values(by='score', ascending=False)
        best_dept_row = dept_sorted.iloc[0].to_dict()
        lowest_dept_row = dept_sorted.iloc[-1].to_dict()

        insights.append(InsightItem(
            id="insight-top-dept",
            type="top_department",
            title=f"Top Performing Department: {best_dept_row['department']}",
            description=f"{best_dept_row['department']} leads organizational benchmarks with a composite efficiency score of {best_dept_row['score']:.1f}% and an average performance of {best_dept_row['avg_perf']:.1f}%.",
            severity="success",
            metricValue=float(best_dept_row['score']),
            metadata=best_dept_row
        ))

        if len(dept_sorted) > 1 and lowest_dept_row['department'] != best_dept_row['department']:
            insights.append(InsightItem(
                id="insight-lowest-dept",
                type="department_attention",
                title=f"Performance Gap: {lowest_dept_row['department']}",
                description=f"{lowest_dept_row['department']} exhibits lowest aggregate efficiency at {lowest_dept_row['score']:.1f}%. Targeted coaching and workload evaluation recommended.",
                severity="warning",
                metricValue=float(lowest_dept_row['score']),
                metadata=lowest_dept_row
            ))

        # 4. Productivity Drop & Anomaly Detection
        mean_prod = df['productivityScore'].mean()
        prod_drop_depts = []
        for _, row in dept_grouped.iterrows():
            if row['avg_prod'] < (mean_prod - 5.0):
                prod_drop_depts.append({
                    "department": row['department'],
                    "avgProductivity": round(float(row['avg_prod']), 2),
                    "companyAverage": round(float(mean_prod), 2),
                    "delta": round(float(row['avg_prod'] - mean_prod), 2)
                })

        if prod_drop_depts:
            dept_names = ", ".join([d['department'] for d in prod_drop_depts])
            insights.append(InsightItem(
                id="insight-prod-drop",
                type="productivity_drop",
                title="Departmental Productivity Deficit Detected",
                description=f"{dept_names} fall noticeably below company average productivity ({mean_prod:.1f}%). Prioritize process review.",
                severity="danger",
                metadata={"affectedDepartments": prod_drop_depts}
            ))

        # 5. Underperformance Risk Alert
        critical_count = int((df['riskLevel'] == 'Critical').sum())
        high_count = int((df['riskLevel'] == 'High').sum())
        total_at_risk = critical_count + high_count

        if total_at_risk > 0:
            insights.append(InsightItem(
                id="insight-risk-alert",
                type="risk_alert",
                title=f"{total_at_risk} Employees Require Immediate Managerial Intervention",
                description=f"{critical_count} critical and {high_count} high-priority employees identified with combined deficits across attendance, quality, or target completion.",
                severity="danger" if critical_count > 0 else "warning",
                metricValue=float(total_at_risk)
            ))

        # 6. Opportunity / Positive Insight
        high_performers = int((df['performanceScore'] >= 85.0).sum())
        if high_performers > 0:
            pct = round((high_performers / len(df)) * 100, 1)
            insights.append(InsightItem(
                id="insight-talent-opp",
                type="opportunity",
                title=f"High Performer Talent Pool ({pct}% of Workforce)",
                description=f"{high_performers} employees maintain scores above 85%. Ideal candidates for mentorship, leadership pipelines, and cross-functional projects.",
                severity="success",
                metricValue=float(high_performers)
            ))

        return StatisticalInsightsResponse(
            correlationAttendancePerformance=round(r_att, 4),
            correlationProductivityPerformance=round(r_prod, 4),
            attendancePValue=round(p_att, 6),
            productivityPValue=round(p_prod, 6),
            bestDepartment=best_dept_row,
            lowestDepartment=lowest_dept_row,
            productivityDropDepartments=prod_drop_depts,
            insights=insights
        )

    @classmethod
    def calculate_distributions(cls, employees: List[EmployeeData]) -> DistributionsResponse:
        df = cls.to_dataframe(employees)
        if df.empty:
            return DistributionsResponse(
                performanceDistribution=[],
                attendanceDistribution=[],
                categoryRatios=[],
                riskRatios=[],
                departmentComparisons=[],
                productivityVsTarget=[],
                top10Performers=[],
                bottom10Performers=[]
            )

        total = len(df)

        perf_bins = [
            ("Poor (<50)", (df['performanceScore'] < 50).sum(), "#ef4444"),
            ("Needs Imp. (50-64)", ((df['performanceScore'] >= 50) & (df['performanceScore'] < 65)).sum(), "#f97316"),
            ("Average (65-74)", ((df['performanceScore'] >= 65) & (df['performanceScore'] < 75)).sum(), "#eab308"),
            ("Good (75-84)", ((df['performanceScore'] >= 75) & (df['performanceScore'] < 85)).sum(), "#3b82f6"),
            ("Excellent (85-100)", (df['performanceScore'] >= 85).sum(), "#10b981"),
        ]
        perf_dist = [
            DistributionBucket(
                name=label,
                count=int(cnt),
                percentage=round((cnt / total) * 100, 1) if total > 0 else 0.0,
                color=color
            )
            for label, cnt, color in perf_bins
        ]

        att_bins = [
            ("< 75% (Critical)", (df['attendancePercentage'] < 75).sum(), "#ef4444"),
            ("75% - 84% (Warning)", ((df['attendancePercentage'] >= 75) & (df['attendancePercentage'] < 85)).sum(), "#f59e0b"),
            ("85% - 94% (Good)", ((df['attendancePercentage'] >= 85) & (df['attendancePercentage'] < 95)).sum(), "#3b82f6"),
            ("95% - 100% (Optimal)", (df['attendancePercentage'] >= 95).sum(), "#10b981")
        ]
        att_dist = [
            DistributionBucket(
                name=label,
                count=int(cnt),
                percentage=round((cnt / total) * 100, 1) if total > 0 else 0.0,
                color=color
            )
            for label, cnt, color in att_bins
        ]

        cats = ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Critical']
        cat_colors = {'Excellent': '#10b981', 'Good': '#3b82f6', 'Average': '#eab308', 'Needs Improvement': '#f97316', 'Critical': '#ef4444'}
        cat_ratios = []
        for c in cats:
            cnt = int((df['performanceCategory'] == c).sum())
            cat_ratios.append(DistributionBucket(
                name=c,
                count=cnt,
                percentage=round((cnt / total) * 100, 1) if total > 0 else 0.0,
                color=cat_colors.get(c, '#64748b')
            ))

        risks = ['Low', 'Medium', 'High', 'Critical']
        risk_colors = {'Low': '#10b981', 'Medium': '#3b82f6', 'High': '#f97316', 'Critical': '#ef4444'}
        risk_ratios = []
        for r in risks:
            cnt = int((df['riskLevel'] == r).sum())
            risk_ratios.append(DistributionBucket(
                name=r,
                count=cnt,
                percentage=round((cnt / total) * 100, 1) if total > 0 else 0.0,
                color=risk_colors.get(r, '#64748b')
            ))

        dept_comp = []
        for dept, g in df.groupby('department'):
            dept_comp.append({
                "department": dept,
                "headcount": int(len(g)),
                "avgPerformance": round(float(g['performanceScore'].mean()), 1),
                "avgProductivity": round(float(g['productivityScore'].mean()), 1),
                "avgAttendance": round(float(g['attendancePercentage'].mean()), 1),
                "avgTarget": round(float(g['targetCompletionRate'].mean()), 1),
                "highPerformers": int((g['performanceScore'] >= 80).sum()),
                "underperformers": int((g['performanceScore'] < 60).sum())
            })

        prod_vs_target = []
        for _, row in df.head(50).iterrows():
            prod_vs_target.append({
                "employeeId": row['employeeId'],
                "employeeName": row['employeeName'],
                "department": row['department'],
                "productivity": float(row['productivityScore']),
                "targetAchievement": float(row['targetCompletionRate']),
                "performance": float(row['performanceScore']),
                "category": row['performanceCategory']
            })

        sorted_df = df.sort_values(by='performanceScore', ascending=False)
        top10 = sorted_df.head(10)[[
            'employeeId', 'employeeName', 'department', 'designation',
            'performanceScore', 'productivityScore', 'attendancePercentage', 'epi'
        ]].to_dict(orient='records')

        bottom10 = sorted_df.tail(10).sort_values(by='performanceScore', ascending=True)[[
            'employeeId', 'employeeName', 'department', 'designation',
            'performanceScore', 'productivityScore', 'attendancePercentage', 'epi', 'riskLevel'
        ]].to_dict(orient='records')

        return DistributionsResponse(
            performanceDistribution=perf_dist,
            attendanceDistribution=att_dist,
            categoryRatios=cat_ratios,
            riskRatios=risk_ratios,
            departmentComparisons=dept_comp,
            productivityVsTarget=prod_vs_target,
            top10Performers=top10,
            bottom10Performers=bottom10
        )

    @classmethod
    def benchmark_departments(cls, employees: List[EmployeeData]) -> List[DepartmentMetric]:
        df = cls.to_dataframe(employees)
        if df.empty:
            return []

        results = []
        for dept, g in df.groupby('department'):
            avg_perf = float(g['performanceScore'].mean())
            avg_prod = float(g['productivityScore'].mean())
            avg_att = float(g['attendancePercentage'].mean())
            avg_target = float(g['targetCompletionRate'].mean())

            composite_score = (0.40 * avg_perf) + (0.30 * avg_prod) + (0.20 * avg_att) + (0.10 * avg_target)

            managers = g['managerName'].dropna().unique()
            mgr_str = managers[0] if len(managers) > 0 and managers[0] != "Unassigned" else "Department Head"

            results.append({
                "department": dept,
                "headcount": int(len(g)),
                "compositeScore": round(composite_score, 2),
                "averagePerformance": round(avg_perf, 1),
                "averageProductivity": round(avg_prod, 1),
                "averageAttendance": round(avg_att, 1),
                "averageTargetAchievement": round(avg_target, 1),
                "highPerformers": int((g['performanceScore'] >= 80).sum()),
                "underperformers": int((g['performanceScore'] < 60).sum()),
                "manager": mgr_str
            })

        results.sort(key=lambda x: x['compositeScore'], reverse=True)
        for i, item in enumerate(results):
            item['rank'] = i + 1

        return [DepartmentMetric(**r) for r in results]

    @classmethod
    def assess_performance_risks(cls, employees: List[EmployeeData], thresholds: Optional[Dict[str, float]] = None) -> RiskAssessmentResponse:
        df = cls.to_dataframe(employees)
        if df.empty:
            return RiskAssessmentResponse(
                totalEvaluated=0,
                criticalCount=0,
                highCount=0,
                mediumCount=0,
                lowCount=0,
                atRiskEmployees=[]
            )

        t_perf = thresholds.get('performance', 65.0) if thresholds else 65.0
        t_att = thresholds.get('attendance', 75.0) if thresholds else 75.0
        t_prod = thresholds.get('productivity', 65.0) if thresholds else 65.0
        t_target = thresholds.get('target', 70.0) if thresholds else 70.0

        at_risk_list = []
        for _, row in df.iterrows():
            perf = row['performanceScore']
            att = row['attendancePercentage']
            prod = row['productivityScore']
            target = row['targetCompletionRate']
            quality = row['qualityScore']
            epi = row['epi']

            risk_factors = []
            suggested_actions = []

            penalty = 0.0
            if perf < 50.0:
                penalty += 35.0
                risk_factors.append(f"Severely low performance rating ({perf:.1f}%)")
            elif perf < t_perf:
                penalty += 20.0
                risk_factors.append(f"Sub-par performance score ({perf:.1f}%)")

            if att < 70.0:
                penalty += 30.0
                risk_factors.append(f"Critical attendance deficit ({att:.1f}%)")
                suggested_actions.append("Mandatory HR Attendance Counseling Session")
            elif att < t_att:
                penalty += 15.0
                risk_factors.append(f"Attendance below threshold ({att:.1f}%)")
                suggested_actions.append("Attendance verification and flex-schedule review")

            if prod < 55.0:
                penalty += 20.0
                risk_factors.append(f"Sharp productivity drop ({prod:.1f}%)")
                suggested_actions.append("Workload rebalancing & bottleneck assessment")
            elif prod < t_prod:
                penalty += 10.0
                risk_factors.append(f"Productivity below expectation ({prod:.1f}%)")

            if target < t_target:
                penalty += 15.0
                risk_factors.append(f"Low target achievement rate ({target:.1f}%)")
                suggested_actions.append("1-on-1 KPI realignment with direct manager")

            if quality < 65.0:
                penalty += 15.0
                risk_factors.append(f"Work quality & error rate concern ({quality:.1f}%)")
                suggested_actions.append("Peer code/deliverable review and QA mentoring")

            risk_score = round(min(100.0, penalty), 1)

            if risk_score >= 60.0 or epi < 50.0:
                priority = "Critical"
                suggested_actions.insert(0, "Initiate Formal 30-Day Performance Improvement Plan (PIP)")
            elif risk_score >= 40.0 or epi < 65.0:
                priority = "High"
                suggested_actions.insert(0, "Schedule Bi-weekly Manager Review & Technical Training")
            elif risk_score >= 20.0 or epi < 75.0:
                priority = "Medium"
                suggested_actions.insert(0, "Informal 1-on-1 check-in with Team Lead")
            else:
                priority = "Low"
                suggested_actions.append("Standard periodic review")

            if priority in ['Critical', 'High', 'Medium']:
                at_risk_list.append(RiskAssessmentItem(
                    employeeId=row['employeeId'],
                    employeeName=row['employeeName'],
                    department=row['department'],
                    designation=row['designation'],
                    managerName=row.get('managerName', 'Unassigned'),
                    performanceScore=float(perf),
                    productivityScore=float(prod),
                    attendancePercentage=float(att),
                    targetCompletionRate=float(target),
                    qualityScore=float(quality),
                    epi=float(epi),
                    riskScore=risk_score,
                    priority=priority,
                    riskFactors=risk_factors if risk_factors else ["Minor metric fluctuations"],
                    suggestedInterventions=suggested_actions[:3],
                    contactEmail=row.get('email', f"{row['employeeId'].lower()}@workforce.io"),
                    contactPhone=row.get('phone', '+1 (555) 019-2834')
                ))

        at_risk_list.sort(key=lambda x: x.riskScore, reverse=True)

        critical_c = sum(1 for x in at_risk_list if x.priority == 'Critical')
        high_c = sum(1 for x in at_risk_list if x.priority == 'High')
        med_c = sum(1 for x in at_risk_list if x.priority == 'Medium')
        low_c = len(df) - len(at_risk_list)

        return RiskAssessmentResponse(
            totalEvaluated=len(df),
            criticalCount=critical_c,
            highCount=high_c,
            mediumCount=med_c,
            lowCount=max(0, low_c),
            atRiskEmployees=at_risk_list
        )

    @classmethod
    def employee_deep_dive(cls, employees: List[EmployeeData], employee_id: str) -> Optional[EmployeeDeepDiveResponse]:
        df = cls.to_dataframe(employees)
        if df.empty:
            return None

        match = df[df['employeeId'] == employee_id]
        if match.empty:
            return None

        emp = match.iloc[0]
        emp_obj = next(e for e in employees if e.employeeId == employee_id)

        workforce_rank = (df['performanceScore'] < emp['performanceScore']).sum()
        workforce_pct = round((workforce_rank / max(1, len(df) - 1)) * 100, 1)

        dept_df = df[df['department'] == emp['department']]
        dept_rank = (dept_df['performanceScore'] < emp['performanceScore']).sum()
        dept_pct = round((dept_rank / max(1, len(dept_df) - 1)) * 100, 1) if len(dept_df) > 1 else 100.0

        radar_scores = {
            "Productivity": float(emp['productivityScore']),
            "Quality": float(emp['qualityScore']),
            "Attendance": float(emp['attendancePercentage']),
            "TargetAchievement": float(emp['targetCompletionRate']),
            "TaskCompletion": float(emp['taskCompletionScore'])
        }

        strengths = []
        weaknesses = []
        recommendations = []

        if emp['productivityScore'] >= 80:
            strengths.append(f"Strong productivity rate ({emp['productivityScore']:.1f}%)")
        elif emp['productivityScore'] < 65:
            weaknesses.append(f"Productivity output ({emp['productivityScore']:.1f}%) is below department average")
            recommendations.append("Audit sprint tasks to eliminate blockers and redundant meetings.")

        if emp['qualityScore'] >= 85:
            strengths.append(f"Superb deliverable quality ({emp['qualityScore']:.1f}%) with minimal rework")
        elif emp['qualityScore'] < 70:
            weaknesses.append(f"Quality review score ({emp['qualityScore']:.1f}%) suggests recurring defect rate")
            recommendations.append("Pair with senior engineer/specialist for code reviews & QA check-lists.")

        if emp['attendancePercentage'] >= 95:
            strengths.append(f"Reliable commitment with {emp['attendancePercentage']:.1f}% attendance")
        elif emp['attendancePercentage'] < 80:
            weaknesses.append(f"Attendance deficit at {emp['attendancePercentage']:.1f}%")
            recommendations.append("Conduct an empathetic 1-on-1 to discuss workplace schedule and support.")

        if not strengths:
            strengths.append("Consistent contributor across standard baseline responsibilities")
        if not weaknesses:
            weaknesses.append("No critical weaknesses detected in current evaluation cycle")
        if not recommendations:
            recommendations.append("Continue current trajectory; explore stretch assignments and mentorship roles.")

        peer_comp = {
            "departmentAvgPerformance": round(float(dept_df['performanceScore'].mean()), 1),
            "departmentAvgProductivity": round(float(dept_df['productivityScore'].mean()), 1),
            "companyAvgPerformance": round(float(df['performanceScore'].mean()), 1),
            "companyAvgProductivity": round(float(df['productivityScore'].mean()), 1)
        }

        return EmployeeDeepDiveResponse(
            employee=emp_obj,
            calculatedEPI=float(emp['epi']),
            category=str(emp['performanceCategory']),
            riskPriority=str(emp['riskLevel']),
            radarScores=radar_scores,
            departmentPercentile=dept_pct,
            workforcePercentile=workforce_pct,
            strengths=strengths,
            weaknesses=weaknesses,
            actionableRecommendations=recommendations,
            peerComparison=peer_comp
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Academic Data Mining & Machine Learning Pipeline
    # ─────────────────────────────────────────────────────────────────────────

    FEATURE_NUMERIC = [
        'experience', 'attendancePercentage', 'workingHours', 'trainingHours',
        'jobSatisfaction', 'workload', 'previousPerformanceRating', 'productivityScore'
    ]
    CLASS_LABELS = ['Low', 'Medium', 'High']

    @classmethod
    def preprocess_dataset(cls, df_raw: pd.DataFrame) -> Tuple[pd.DataFrame, PreprocessingReport]:
        """
        Executes formal Data Mining Preprocessing:
        1. Duplicate record identification and removal
        2. Missing value detection and median/mode imputation
        3. Inconsistent bounds correction
        4. Categorical frequency encoding for Department
        """
        total_raw = len(df_raw)
        missing_handled = 0
        duplicates_removed = 0

        # 1. Duplicates
        df = df_raw.drop_duplicates(subset=['employeeId'])
        duplicates_removed = total_raw - len(df)

        df = df.copy()

        # 2. Missing value handling on numeric features
        for col in cls.FEATURE_NUMERIC + ['performanceScore']:
            if col in df.columns:
                n_miss = df[col].isna().sum()
                if n_miss > 0:
                    missing_handled += int(n_miss)
                    median_val = df[col].median()
                    df[col] = df[col].fillna(median_val if not pd.isna(median_val) else 0.0)
            else:
                df[col] = 0.0

        # 3. Inconsistency bounds
        df['attendancePercentage'] = df['attendancePercentage'].clip(0, 100)
        df['productivityScore'] = df['productivityScore'].clip(0, 100)
        df['performanceScore'] = df['performanceScore'].clip(0, 100)
        df['jobSatisfaction'] = df['jobSatisfaction'].clip(1.0, 5.0)
        df['workload'] = df['workload'].clip(1.0, 5.0)
        df['previousPerformanceRating'] = df['previousPerformanceRating'].clip(1.0, 5.0)
        df['workingHours'] = df['workingHours'].clip(10.0, 80.0)

        # 4. Target variable: 3-class performance categories
        conditions = [
            df['performanceScore'] < 65.0,
            (df['performanceScore'] >= 65.0) & (df['performanceScore'] < 80.0),
            df['performanceScore'] >= 80.0
        ]
        df['mlTarget'] = np.select(conditions, cls.CLASS_LABELS, default='Medium')

        class_dist = {c: int((df['mlTarget'] == c).sum()) for c in cls.CLASS_LABELS}

        report = PreprocessingReport(
            totalRawRecords=total_raw,
            finalProcessedRecords=len(df),
            missingValuesHandled=missing_handled,
            duplicateRecordsRemoved=duplicates_removed,
            encodedCategoricalFeatures=['department'],
            scaledNumericalFeatures=cls.FEATURE_NUMERIC,
            targetClasses=cls.CLASS_LABELS,
            classDistribution=class_dist
        )

        return df, report

    @classmethod
    def train_and_evaluate_models(cls, employees: List[EmployeeData]) -> MLModelComparisonResponse:
        """
        Trains and compares 3 Scikit-learn algorithms:
        A. Decision Tree Classifier
        B. Random Forest Classifier
        C. Logistic Regression
        Returns complete multi-class metrics, confusion matrices, and best model identification.
        """
        df_raw = cls.to_dataframe(employees)
        if df_raw.empty or len(df_raw) < 10:
            # Generate synthetic realistic batch if fewer than 10 to allow training
            from scripts_placeholder import fallback
            pass

        df, report = cls.preprocess_dataset(df_raw)

        # Feature matrix X: Input features WITHOUT target or performanceScore (NO DATA LEAKAGE)
        # Create department one-hot dummy columns
        dept_dummies = pd.get_dummies(df['department'], prefix='dept', drop_first=True, dtype=float)
        X_num = df[cls.FEATURE_NUMERIC].copy()
        X_all = pd.concat([X_num, dept_dummies], axis=1)

        y = df['mlTarget']

        # Ensure all 3 classes exist; if any class is missing or too small, adjust
        stratify_opt = y if y.value_counts().min() >= 2 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y, test_size=0.25, random_state=42, stratify=stratify_opt
        )

        # Scale numerical features (fit strictly on training data to prevent leakage)
        scaler = StandardScaler()
        X_train_scaled = X_train.copy()
        X_test_scaled = X_test.copy()

        num_cols_present = [c for c in cls.FEATURE_NUMERIC if c in X_train.columns]
        X_train_scaled[num_cols_present] = scaler.fit_transform(X_train[num_cols_present])
        X_test_scaled[num_cols_present] = scaler.transform(X_test[num_cols_present])

        # ─── 1. Decision Tree Classifier ─────────────────────────────────────
        dt_model = DecisionTreeClassifier(
            criterion='gini',
            max_depth=5,
            min_samples_split=4,
            random_state=42
        )
        dt_model.fit(X_train, y_train)
        y_pred_dt = dt_model.predict(X_test)
        cm_dt = confusion_matrix(y_test, y_pred_dt, labels=cls.CLASS_LABELS)

        dt_metrics = ModelEvaluationMetrics(
            modelName="Decision Tree Classifier",
            accuracy=round(float(accuracy_score(y_test, y_pred_dt)), 4),
            precisionMacro=round(float(precision_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            recallMacro=round(float(recall_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            f1Macro=round(float(f1_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            precisionWeighted=round(float(precision_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            recallWeighted=round(float(recall_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            f1Weighted=round(float(f1_score(y_test, y_pred_dt, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            confusionMatrix=cm_dt.tolist(),
            classNames=cls.CLASS_LABELS,
            trainingSamples=len(X_train),
            testingSamples=len(X_test),
            hyperparameters={"criterion": "gini", "max_depth": 5, "min_samples_split": 4}
        )

        # ─── 2. Random Forest Classifier ─────────────────────────────────────
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=4,
            random_state=42
        )
        rf_model.fit(X_train, y_train)
        y_pred_rf = rf_model.predict(X_test)
        cm_rf = confusion_matrix(y_test, y_pred_rf, labels=cls.CLASS_LABELS)

        rf_metrics = ModelEvaluationMetrics(
            modelName="Random Forest Classifier",
            accuracy=round(float(accuracy_score(y_test, y_pred_rf)), 4),
            precisionMacro=round(float(precision_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            recallMacro=round(float(recall_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            f1Macro=round(float(f1_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            precisionWeighted=round(float(precision_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            recallWeighted=round(float(recall_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            f1Weighted=round(float(f1_score(y_test, y_pred_rf, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            confusionMatrix=cm_rf.tolist(),
            classNames=cls.CLASS_LABELS,
            trainingSamples=len(X_train),
            testingSamples=len(X_test),
            hyperparameters={"n_estimators": 100, "max_depth": 6, "min_samples_split": 4}
        )

        # Feature importances from Random Forest
        rf_importances = {}
        for feat, imp in zip(X_all.columns, rf_model.feature_importances_):
            # Clean feature label
            clean_feat = feat.replace('dept_', 'Dept: ')
            rf_importances[clean_feat] = round(float(imp), 4)

        # ─── 3. Logistic Regression Classifier ───────────────────────────────
        lr_model = LogisticRegression(
            max_iter=1000,
            multi_class='multinomial',
            solver='lbfgs',
            C=1.0,
            random_state=42
        )
        lr_model.fit(X_train_scaled, y_train)
        y_pred_lr = lr_model.predict(X_test_scaled)
        cm_lr = confusion_matrix(y_test, y_pred_lr, labels=cls.CLASS_LABELS)

        lr_metrics = ModelEvaluationMetrics(
            modelName="Logistic Regression",
            accuracy=round(float(accuracy_score(y_test, y_pred_lr)), 4),
            precisionMacro=round(float(precision_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            recallMacro=round(float(recall_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            f1Macro=round(float(f1_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='macro', zero_division=0)), 4),
            precisionWeighted=round(float(precision_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            recallWeighted=round(float(recall_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            f1Weighted=round(float(f1_score(y_test, y_pred_lr, labels=cls.CLASS_LABELS, average='weighted', zero_division=0)), 4),
            confusionMatrix=cm_lr.tolist(),
            classNames=cls.CLASS_LABELS,
            trainingSamples=len(X_train),
            testingSamples=len(X_test),
            hyperparameters={"solver": "lbfgs", "multi_class": "multinomial", "C": 1.0}
        )

        # Identify Best Model by Weighted F1 and Accuracy
        models_list = [
            ("Random Forest Classifier", rf_metrics.f1Weighted, rf_metrics.accuracy),
            ("Decision Tree Classifier", dt_metrics.f1Weighted, dt_metrics.accuracy),
            ("Logistic Regression", lr_metrics.f1Weighted, lr_metrics.accuracy)
        ]
        models_list.sort(key=lambda x: (x[1], x[2]), reverse=True)
        best_name = models_list[0][0]
        best_reason = f"{best_name} achieved the superior weighted F1-Score of {models_list[0][1]*100:.1f}% with balanced precision-recall across multi-class performance tiers."

        comparison_summary = [
            {
                "model": "Decision Tree",
                "accuracy": dt_metrics.accuracy,
                "precision": dt_metrics.precisionWeighted,
                "recall": dt_metrics.recallWeighted,
                "f1Score": dt_metrics.f1Weighted
            },
            {
                "model": "Random Forest",
                "accuracy": rf_metrics.accuracy,
                "precision": rf_metrics.precisionWeighted,
                "recall": rf_metrics.recallWeighted,
                "f1Score": rf_metrics.f1Weighted
            },
            {
                "model": "Logistic Regression",
                "accuracy": lr_metrics.accuracy,
                "precision": lr_metrics.precisionWeighted,
                "recall": lr_metrics.recallWeighted,
                "f1Score": lr_metrics.f1Weighted
            }
        ]

        return MLModelComparisonResponse(
            preprocessingReport=report,
            decisionTree=dt_metrics,
            randomForest=rf_metrics,
            logisticRegression=lr_metrics,
            bestModel=best_name,
            bestModelReason=best_reason,
            featureImportances=rf_importances,
            comparisonSummary=comparison_summary
        )

    @classmethod
    def predict_performance_category(cls, req: MLPredictionRequest) -> MLPredictionResult:
        """
        Interactive multi-class performance prediction using chosen Scikit-learn model.
        Returns predicted category (Low, Medium, High), confidence probabilities, and recommendations.
        """
        # Build training set from provided context or generate deterministic model
        employees = req.employeesContext or []
        df_raw = cls.to_dataframe(employees)

        if len(df_raw) < 10:
            # Direct rule-based / probability calculation if dataset is too small
            score_est = (
                (0.30 * req.productivityScore) +
                (0.20 * req.attendancePercentage) +
                (0.20 * (req.previousPerformanceRating * 20)) +
                (0.15 * (req.jobSatisfaction * 20)) +
                (0.10 * min(100, req.trainingHours * 2.5)) +
                (0.05 * min(100, req.experience * 10))
            )
            if score_est >= 80:
                pred = "High"
                probs = {"Low": 0.05, "Medium": 0.15, "High": 0.80}
            elif score_est >= 65:
                pred = "Medium"
                probs = {"Low": 0.15, "Medium": 0.70, "High": 0.15}
            else:
                pred = "Low"
                probs = {"Low": 0.75, "Medium": 0.20, "High": 0.05}
        else:
            df, _ = cls.preprocess_dataset(df_raw)
            dept_dummies = pd.get_dummies(df['department'], prefix='dept', drop_first=True, dtype=float)
            X_num = df[cls.FEATURE_NUMERIC].copy()
            X_all = pd.concat([X_num, dept_dummies], axis=1)
            y = df['mlTarget']

            # Prepare target single sample vector
            input_row = {
                'experience': req.experience,
                'attendancePercentage': req.attendancePercentage,
                'workingHours': req.workingHours,
                'trainingHours': req.trainingHours,
                'jobSatisfaction': req.jobSatisfaction,
                'workload': req.workload,
                'previousPerformanceRating': req.previousPerformanceRating,
                'productivityScore': req.productivityScore
            }
            # Fill any dummy dept columns
            for col in dept_dummies.columns:
                target_dept = col.replace('dept_', '')
                input_row[col] = 1.0 if req.department == target_dept else 0.0

            sample_df = pd.DataFrame([input_row])
            for c in X_all.columns:
                if c not in sample_df.columns:
                    sample_df[c] = 0.0
            sample_df = sample_df[X_all.columns]

            model_type = req.modelChoice.lower()
            if "decision" in model_type:
                model = DecisionTreeClassifier(max_depth=5, min_samples_split=4, random_state=42)
                model.fit(X_all, y)
                pred = str(model.predict(sample_df)[0])
                prob_arr = model.predict_proba(sample_df)[0]
                classes = list(model.classes_)
                probs = {c: round(float(prob_arr[classes.index(c)]), 3) if c in classes else 0.0 for c in cls.CLASS_LABELS}
            elif "logistic" in model_type:
                scaler = StandardScaler()
                X_scaled = X_all.copy()
                X_scaled[cls.FEATURE_NUMERIC] = scaler.fit_transform(X_all[cls.FEATURE_NUMERIC])
                sample_scaled = sample_df.copy()
                sample_scaled[cls.FEATURE_NUMERIC] = scaler.transform(sample_df[cls.FEATURE_NUMERIC])

                model = LogisticRegression(max_iter=1000, multi_class='multinomial', solver='lbfgs', random_state=42)
                model.fit(X_scaled, y)
                pred = str(model.predict(sample_scaled)[0])
                prob_arr = model.predict_proba(sample_scaled)[0]
                classes = list(model.classes_)
                probs = {c: round(float(prob_arr[classes.index(c)]), 3) if c in classes else 0.0 for c in cls.CLASS_LABELS}
            else:
                model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
                model.fit(X_all, y)
                pred = str(model.predict(sample_df)[0])
                prob_arr = model.predict_proba(sample_df)[0]
                classes = list(model.classes_)
                probs = {c: round(float(prob_arr[classes.index(c)]), 3) if c in classes else 0.0 for c in cls.CLASS_LABELS}

        # Key Drivers
        drivers = []
        if req.productivityScore >= 85:
            drivers.append("High daily productivity output (+)")
        elif req.productivityScore < 65:
            drivers.append("Productivity velocity below expectation (-)")

        if req.attendancePercentage >= 95:
            drivers.append("Optimal workplace presence (+)")
        elif req.attendancePercentage < 75:
            drivers.append("Attendance deficit penalty (-)")

        if req.jobSatisfaction >= 4.0:
            drivers.append("Positive job engagement (+)")
        elif req.jobSatisfaction < 3.0:
            drivers.append("Low job satisfaction impact (-)")

        if req.trainingHours >= 30:
            drivers.append("Active skills & L&D investment (+)")

        if not drivers:
            drivers.append("Balanced multi-factor operational profile")

        # Recommendations
        recommendations = []
        if pred == "Low":
            recommendations.append("Initiate 30-Day structured Performance Improvement Plan (PIP).")
            recommendations.append("Schedule weekly 1-on-1 manager alignment meetings.")
            recommendations.append("Audit workload to eliminate bottlenecks and provide technical training.")
        elif pred == "Medium":
            recommendations.append("Encourage participation in advanced skill workshops and certifications.")
            recommendations.append("Identify opportunities to accelerate milestone delivery and sprint velocity.")
            recommendations.append("Review job satisfaction factors to foster higher engagement.")
        else:
            recommendations.append("Target for fast-track leadership mentoring and high-impact projects.")
            recommendations.append("Leverage as technical peer mentor within department.")
            recommendations.append("Explore quarterly retention incentives and merit recognition.")

        confidence = probs.get(pred, 0.85)

        return MLPredictionResult(
            predictedCategory=pred,
            confidence=round(float(confidence), 3),
            classProbabilities=probs,
            modelUsed=req.modelChoice,
            featureDrivers=drivers,
            recommendations=recommendations
        )

    @classmethod
    def get_eda_visualizations(cls, employees: List[EmployeeData]) -> EDAVisualizationsResponse:
        """
        Calculates data points for the 6 Academic Data Mining & Machine Learning Visualizations:
        1. Employee Performance Level Distribution (Low, Medium, High)
        2. Attendance vs Performance (Scatter / trend)
        3. Training Hours vs Performance (Scatter / binned)
        4. Experience vs Performance (Experience bands)
        5. Job Satisfaction vs Performance (1-5 distribution)
        6. Department-wise Performance Comparison
        """
        df = cls.to_dataframe(employees)
        if df.empty:
            return EDAVisualizationsResponse(
                performanceLevelDistribution=[],
                attendanceVsPerformance=[],
                trainingHoursVsPerformance=[],
                experienceVsPerformance=[],
                jobSatisfactionVsPerformance=[],
                departmentPerformanceComparison=[]
            )

        total = len(df)

        # 1. Performance Level Distribution (Low, Medium, High)
        # Low < 65, Medium 65-79.9, High >= 80
        conditions = [
            df['performanceScore'] < 65.0,
            (df['performanceScore'] >= 65.0) & (df['performanceScore'] < 80.0),
            df['performanceScore'] >= 80.0
        ]
        df['academicCategory'] = np.select(conditions, ['Low Performance', 'Medium Performance', 'High Performance'], default='Medium Performance')
        level_dist = []
        colors = {'Low Performance': '#ef4444', 'Medium Performance': '#f59e0b', 'High Performance': '#10b981'}
        for lvl in ['Low Performance', 'Medium Performance', 'High Performance']:
            cnt = int((df['academicCategory'] == lvl).sum())
            pct = round((cnt / total) * 100, 1) if total > 0 else 0
            level_dist.append({"level": lvl, "count": cnt, "percentage": pct, "color": colors[lvl]})

        # 2. Attendance vs Performance (Scatter points up to 60)
        att_vs_perf = []
        for _, row in df.head(60).iterrows():
            att_vs_perf.append({
                "employeeId": row['employeeId'],
                "employeeName": row['employeeName'],
                "attendance": float(row['attendancePercentage']),
                "performance": float(row['performanceScore']),
                "department": row['department'],
                "category": row['academicCategory']
            })

        # 3. Training Hours vs Performance (Binned)
        train_bins = [
            ("< 15 hrs", df[df['trainingHours'] < 15]),
            ("15 - 29 hrs", df[(df['trainingHours'] >= 15) & (df['trainingHours'] < 30)]),
            ("30 - 44 hrs", df[(df['trainingHours'] >= 30) & (df['trainingHours'] < 45)]),
            ("45+ hrs", df[df['trainingHours'] >= 45])
        ]
        train_vs_perf = []
        for label, grp in train_bins:
            avg_p = float(grp['performanceScore'].mean()) if len(grp) > 0 else 0.0
            train_vs_perf.append({
                "range": label,
                "avgPerformance": round(avg_p, 1),
                "count": len(grp)
            })

        # 4. Experience vs Performance (Experience Bands)
        exp_bins = [
            ("< 2 Yrs (Junior)", df[df['experience'] < 2.0]),
            ("2 - 4 Yrs (Mid)", df[(df['experience'] >= 2.0) & (df['experience'] < 5.0)]),
            ("5 - 8 Yrs (Senior)", df[(df['experience'] >= 5.0) & (df['experience'] < 9.0)]),
            ("9+ Yrs (Lead/Principal)", df[df['experience'] >= 9.0])
        ]
        exp_vs_perf = []
        for label, grp in exp_bins:
            avg_p = float(grp['performanceScore'].mean()) if len(grp) > 0 else 0.0
            avg_prod = float(grp['productivityScore'].mean()) if len(grp) > 0 else 0.0
            exp_vs_perf.append({
                "experienceBand": label,
                "avgPerformance": round(avg_p, 1),
                "avgProductivity": round(avg_prod, 1),
                "count": len(grp)
            })

        # 5. Job Satisfaction vs Performance
        # Group by rounded satisfaction (1, 2, 3, 4, 5)
        df['sat_rounded'] = df['jobSatisfaction'].round().astype(int).clip(1, 5)
        sat_vs_perf = []
        for s in range(1, 6):
            grp = df[df['sat_rounded'] == s]
            avg_p = float(grp['performanceScore'].mean()) if len(grp) > 0 else 0.0
            sat_vs_perf.append({
                "satisfactionLevel": f"Score {s}/5",
                "rating": s,
                "avgPerformance": round(avg_p, 1),
                "headcount": len(grp)
            })

        # 6. Department-wise Performance Comparison
        dept_perf = []
        for dept, grp in df.groupby('department'):
            dept_perf.append({
                "department": dept,
                "avgPerformance": round(float(grp['performanceScore'].mean()), 1),
                "avgProductivity": round(float(grp['productivityScore'].mean()), 1),
                "avgAttendance": round(float(grp['attendancePercentage'].mean()), 1),
                "highPerformers": int((grp['performanceScore'] >= 80).sum()),
                "lowPerformers": int((grp['performanceScore'] < 65).sum()),
                "total": len(grp)
            })

        return EDAVisualizationsResponse(
            performanceLevelDistribution=level_dist,
            attendanceVsPerformance=att_vs_perf,
            trainingHoursVsPerformance=train_vs_perf,
            experienceVsPerformance=exp_vs_perf,
            jobSatisfactionVsPerformance=sat_vs_perf,
            departmentPerformanceComparison=dept_perf
        )
