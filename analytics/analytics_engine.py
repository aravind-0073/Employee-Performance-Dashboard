import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Any, Tuple, Optional
from models import (
    EmployeeData, KPISummary, DepartmentMetric, StatisticalInsightsResponse,
    InsightItem, DistributionsResponse, DistributionBucket, PredictionResponse,
    RiskAssessmentResponse, RiskAssessmentItem, EmployeeDeepDiveResponse
)

class AnalyticsEngine:
    """
    Enterprise Workforce Analytics & Machine Learning Engine
    Executes vectorized computations, statistical correlation testing,
    predictive performance regression, and automated risk scoring.
    """

    @staticmethod
    def to_dataframe(employees: List[EmployeeData]) -> pd.DataFrame:
        if not employees:
            return pd.DataFrame()
        data = [e.model_dump() for e in employees]
        df = pd.DataFrame(data)

        # Ensure correct numeric types with sane defaults
        numeric_cols = [
            'experience', 'attendancePercentage', 'performanceScore',
            'productivityScore', 'qualityScore', 'targetCompletionRate',
            'projectsCompleted', 'tasksCompleted', 'salary', 'trainingHours'
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            else:
                df[col] = 0.0

        # Calculate Task Completion Score (0-100 based on standard tasks benchmark)
        # Standard benchmark: ~20 tasks completed per quarter/eval period
        df['taskCompletionScore'] = np.clip(df['tasksCompleted'] * 5.0, 0, 100)
        df.loc[df['tasksCompleted'] == 0, 'taskCompletionScore'] = np.clip(df['targetCompletionRate'], 0, 100)

        # Vectorized Employee Performance Index (EPI):
        # EPI = (30% * Productivity) + (25% * Quality) + (20% * Attendance) + (15% * TargetAchievement) + (10% * TaskCompletion)
        df['epi'] = (
            (0.30 * df['productivityScore']) +
            (0.25 * df['qualityScore']) +
            (0.20 * df['attendancePercentage']) +
            (0.15 * df['targetCompletionRate']) +
            (0.10 * df['taskCompletionScore'])
        ).round(2)

        # Determine Category
        conditions = [
            df['epi'] >= 85.0,
            (df['epi'] >= 75.0) & (df['epi'] < 85.0),
            (df['epi'] >= 65.0) & (df['epi'] < 75.0),
            (df['epi'] >= 50.0) & (df['epi'] < 65.0),
            df['epi'] < 50.0
        ]
        categories = ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Critical']
        df['performanceCategory'] = np.select(conditions, categories, default='Average')

        # Determine Risk Level
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
            totalProjectsCompleted=int(df['projectsCompleted'].sum()),
            totalTrainingHours=round(float(df['trainingHours'].sum()), 1)
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

        # Weighted Formula: (40% * Performance) + (30% * Productivity) + (20% * Attendance) + (10% * TargetAchievement)
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

        # Performance Distribution Histogram
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

        # Attendance Distribution
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

        # Category Ratios (EPI based)
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

        # Risk Ratios
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

        # Department Comparisons
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

        # Productivity vs Target Scatter Sample (first 50 for clean chart)
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

        # Top 10 and Bottom 10
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

            # Multi-criteria ranking formula:
            # Score = (40% * Performance) + (30% * Productivity) + (20% * Attendance) + (10% * TargetAchievement)
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

        # Sort by composite score descending and assign rank
        results.sort(key=lambda x: x['compositeScore'], reverse=True)
        for i, item in enumerate(results):
            item['rank'] = i + 1

        return [DepartmentMetric(**r) for r in results]

    @classmethod
    def train_and_predict_performance(cls, peers: List[EmployeeData], target: EmployeeData) -> PredictionResponse:
        """
        Trains a multivariate Scikit-learn Linear Regression model on peers and
        predicts expected performance for the target employee, assessing positive/negative delta.
        """
        all_emps = peers if peers else [target]
        # Include target in peer set if not already present
        if not any(e.employeeId == target.employeeId for e in all_emps):
            all_emps = all_emps + [target]

        df = cls.to_dataframe(all_emps)

        feature_cols = [
            'productivityScore', 'attendancePercentage', 'qualityScore',
            'targetCompletionRate', 'experience', 'trainingHours'
        ]

        X = df[feature_cols].values
        y = df['performanceScore'].values

        # If we have at least 3 samples with variance, fit LinearRegression
        if len(df) >= 3 and np.var(y) > 0.01:
            model = LinearRegression()
            model.fit(X, y)
            r2 = float(np.clip(model.score(X, y), 0.1, 0.98))
            coefficients = model.coef_
        else:
            # Fallback deterministic weights if small sample
            r2 = 0.85
            coefficients = np.array([0.45, 0.25, 0.20, 0.10, 0.5, 0.2])

        target_features = np.array([[
            float(target.productivityScore),
            float(target.attendancePercentage),
            float(target.qualityScore),
            float(target.targetCompletionRate),
            float(target.experience),
            float(target.trainingHours)
        ]])

        if len(df) >= 3 and np.var(y) > 0.01:
            predicted_raw = float(model.predict(target_features)[0])
        else:
            predicted_raw = float(
                (0.35 * target.productivityScore) +
                (0.25 * target.qualityScore) +
                (0.20 * target.attendancePercentage) +
                (0.15 * target.targetCompletionRate) +
                (0.05 * min(100, target.experience * 10))
            )

        predicted = round(float(np.clip(predicted_raw, 0, 100)), 1)
        actual = round(float(target.performanceScore), 1)
        delta = round(actual - predicted, 1)

        # Trend interpretation
        if delta > 4.0:
            trend = "Positive"
            forecast_summary = f"{target.employeeName} is outperforming baseline regression expectations by +{delta} pts. High operational velocity and execution quality."
        elif delta < -4.0:
            trend = "Negative"
            forecast_summary = f"{target.employeeName} is underperforming baseline regression expectations by {delta} pts. Suggests potential blockers or disengagement."
        else:
            trend = "Aligned"
            forecast_summary = f"{target.employeeName}'s evaluated score closely aligns with multivariate peer performance models (delta: {delta:+0.1f} pts)."

        feature_names = ["Productivity", "Attendance", "Quality", "Target Completion", "Experience", "Training"]
        feature_importances = {}
        for name, coef in zip(feature_names, coefficients):
            feature_importances[name] = round(float(abs(coef)), 3)

        # Key drivers
        drivers = []
        if target.productivityScore >= 85:
            drivers.append("Exceptional daily productivity score")
        elif target.productivityScore < 60:
            drivers.append("Productivity deficit holding back performance")

        if target.attendancePercentage >= 95:
            drivers.append("Near-perfect workplace attendance")
        elif target.attendancePercentage < 75:
            drivers.append("Attendance below minimum organizational threshold")

        if target.qualityScore >= 85:
            drivers.append("High deliverable quality and low error rate")

        if not drivers:
            drivers.append("Balanced baseline across operational inputs")

        # Target EPI
        task_score = np.clip(target.tasksCompleted * 5.0, 0, 100) if target.tasksCompleted > 0 else target.targetCompletionRate
        epi = round(
            (0.30 * target.productivityScore) +
            (0.25 * target.qualityScore) +
            (0.20 * target.attendancePercentage) +
            (0.15 * target.targetCompletionRate) +
            (0.10 * task_score),
            1
        )

        return PredictionResponse(
            employeeId=target.employeeId,
            employeeName=target.employeeName,
            actualPerformance=actual,
            predictedPerformance=predicted,
            performanceDelta=delta,
            trend=trend,
            confidenceScore=round(r2, 2),
            featureImportances=feature_importances,
            expectedEPI=epi,
            keyDrivers=drivers,
            forecastSummary=forecast_summary
        )

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

        # Configurable thresholds
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

            # Multi-factor penalty scoring (0 = safe, 100 = extreme risk)
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

            # Categorize priority
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

            # Only include in at-risk list if medium, high or critical
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

        # Sort at_risk_list by risk score descending
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

        # Calculate Percentiles
        workforce_rank = (df['performanceScore'] < emp['performanceScore']).sum()
        workforce_pct = round((workforce_rank / max(1, len(df) - 1)) * 100, 1)

        dept_df = df[df['department'] == emp['department']]
        dept_rank = (dept_df['performanceScore'] < emp['performanceScore']).sum()
        dept_pct = round((dept_rank / max(1, len(dept_df) - 1)) * 100, 1) if len(dept_df) > 1 else 100.0

        # Radar chart metrics (all 0-100)
        radar_scores = {
            "Productivity": float(emp['productivityScore']),
            "Quality": float(emp['qualityScore']),
            "Attendance": float(emp['attendancePercentage']),
            "TargetAchievement": float(emp['targetCompletionRate']),
            "TaskCompletion": float(emp['taskCompletionScore'])
        }

        # Strengths & Weaknesses
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

        if emp['targetCompletionRate'] >= 85:
            strengths.append(f"High target completion rate ({emp['targetCompletionRate']:.1f}%)")
        elif emp['targetCompletionRate'] < 70:
            weaknesses.append(f"Target completion lagging at {emp['targetCompletionRate']:.1f}%")
            recommendations.append("Break quarterly milestones into weekly actionable sprints.")

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
