from fastapi import APIRouter, HTTPException
from typing import List
from models import StudentData, VisualizationRequest
from analytics_engine import AnalyticsEngine
import json

router = APIRouter()

@router.post("/gpa-distribution")
async def gpa_distribution_chart(students: List[StudentData]):
    """Generate GPA distribution chart"""
    try:
        distribution = AnalyticsEngine.gpa_distribution(students)
        
        import plotly.graph_objects as go
        
        chart = go.Figure(data=[
            go.Bar(
                x=list(distribution.keys()),
                y=list(distribution.values()),
                marker=dict(color=['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'])
            )
        ])
        
        chart.update_layout(
            title="GPA Distribution",
            xaxis_title="GPA Range",
            yaxis_title="Number of Students",
            hovermode="x unified"
        )
        
        return {
            'success': True,
            'chartType': 'GPA Distribution',
            'data': distribution,
            'chart': json.loads(chart.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/attendance-distribution")
async def attendance_distribution_chart(students: List[StudentData]):
    """Generate attendance distribution chart"""
    try:
        distribution = AnalyticsEngine.attendance_distribution(students)
        
        import plotly.graph_objects as go
        
        chart = go.Figure(data=[
            go.Pie(
                labels=list(distribution.keys()),
                values=list(distribution.values()),
                marker=dict(colors=['#10B981', '#3B82F6', '#F59E0B', '#EF4444'])
            )
        ])
        
        chart.update_layout(title="Attendance Distribution")
        
        return {
            'success': True,
            'chartType': 'Attendance Distribution',
            'data': distribution,
            'chart': json.loads(chart.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/department-comparison")
async def department_comparison_chart(students: List[StudentData]):
    """Generate department comparison chart"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        dept_data = []
        for dept in df['department'].unique():
            dept_df = df[df['department'] == dept]
            dept_data.append({
                'department': dept,
                'avgGPA': dept_df['gpa'].mean(),
                'avgAttendance': dept_df['attendancePercentage'].mean()
            })
        
        import plotly.graph_objects as go
        
        chart = go.Figure(data=[
            go.Bar(
                name='Avg GPA',
                x=[d['department'] for d in dept_data],
                y=[d['avgGPA'] for d in dept_data]
            ),
            go.Bar(
                name='Avg Attendance %',
                x=[d['department'] for d in dept_data],
                y=[d['avgAttendance'] for d in dept_data]
            )
        ])
        
        chart.update_layout(
            title="Department Comparison",
            xaxis_title="Department",
            yaxis_title="Value",
            barmode='group'
        )
        
        return {
            'success': True,
            'chartType': 'Department Comparison',
            'data': dept_data,
            'chart': json.loads(chart.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subject-performance")
async def subject_performance_chart(students: List[StudentData]):
    """Generate subject performance chart"""
    try:
        import pandas as pd
        df = AnalyticsEngine.create_dataframe(students)
        
        subject_avgs = {
            'Subject 1': df['subject1Marks'].mean(),
            'Subject 2': df['subject2Marks'].mean(),
            'Subject 3': df['subject3Marks'].mean(),
            'Subject 4': df['subject4Marks'].mean(),
            'Subject 5': df['subject5Marks'].mean()
        }
        
        import plotly.graph_objects as go
        
        chart = go.Figure(data=[
            go.Bar(
                x=list(subject_avgs.keys()),
                y=list(subject_avgs.values()),
                marker=dict(color='#0EA5E9')
            )
        ])
        
        chart.update_layout(
            title="Average Subject Performance",
            xaxis_title="Subject",
            yaxis_title="Average Marks",
            yaxis=dict(range=[0, 100])
        )
        
        return {
            'success': True,
            'chartType': 'Subject Performance',
            'data': subject_avgs,
            'chart': json.loads(chart.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scatter-gpa-vs-attendance")
async def scatter_plot(students: List[StudentData]):
    """Generate scatter plot of GPA vs Attendance"""
    try:
        import plotly.graph_objects as go
        
        scatter_data = {
            'x': [s.attendancePercentage for s in students],
            'y': [s.gpa for s in students],
            'text': [s.studentName for s in students],
            'mode': 'markers',
            'marker': dict(size=8, color='#0EA5E9')
        }
        
        chart = go.Figure(data=[go.Scatter(**scatter_data)])
        
        chart.update_layout(
            title="GPA vs Attendance",
            xaxis_title="Attendance %",
            yaxis_title="GPA",
            hovermode="closest"
        )
        
        return {
            'success': True,
            'chartType': 'Scatter Plot',
            'chart': json.loads(chart.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/box-plot")
async def box_plot_gpa(students: List[StudentData]):
    """Generate box plot of GPA distribution"""
    try:
        import pandas as pd
        import plotly.graph_objects as go
        
        df = AnalyticsEngine.create_dataframe(students)
        
        fig = go.Figure()
        
        for dept in df['department'].unique():
            dept_gpa = df[df['department'] == dept]['gpa']
            fig.add_trace(go.Box(y=dept_gpa, name=dept))
        
        fig.update_layout(
            title="GPA Distribution by Department (Box Plot)",
            yaxis_title="GPA",
            boxmean='sd'
        )
        
        return {
            'success': True,
            'chartType': 'Box Plot',
            'chart': json.loads(fig.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/heatmap")
async def correlation_heatmap(students: List[StudentData]):
    """Generate correlation heatmap"""
    try:
        import pandas as pd
        import plotly.graph_objects as go
        
        df = AnalyticsEngine.create_dataframe(students)
        
        # Select numeric columns
        numeric_cols = ['attendancePercentage', 'subject1Marks', 'subject2Marks',
                       'subject3Marks', 'subject4Marks', 'subject5Marks',
                       'internalMarks', 'gpa']
        
        corr_matrix = df[numeric_cols].corr()
        
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=numeric_cols,
            y=numeric_cols,
            colorscale='RdBu',
            zmid=0
        ))
        
        fig.update_layout(title="Correlation Matrix")
        
        return {
            'success': True,
            'chartType': 'Correlation Heatmap',
            'chart': json.loads(fig.to_json())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
