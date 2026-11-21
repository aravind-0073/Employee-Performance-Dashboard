"""
Integration test for the Python FastAPI ML endpoints.
Uses correct field names matching the Pydantic models in models.py.
"""
import json
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import app

client = TestClient(app)

# ── Build 75 realistic employees (mimics Node.js fetchUserEmployees shape) ─────
departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product']
records = []
for i in range(1, 76):
    dept = departments[i % len(departments)]
    exp = (i % 12) + 1
    att = 60 + (i * 7) % 40
    wh = 35 + (i * 3) % 25
    th = 5 + (i * 5) % 40
    js = round(1 + (i % 5) + 0.5 * (i % 2), 1)   # 1.0 – 5.5 → clipped to 5.0
    js = min(js, 5.0)
    wl = round(1 + (i % 4) + 0.3 * (i % 3), 1)   # workload 1–5
    wl = min(wl, 5.0)
    ppr = round(1 + (i % 5) * 0.9, 1)              # previousPerformanceRating 1–5
    ppr = min(ppr, 5.0)
    prod = 45 + (i * 9) % 55
    # perf bucketed into Low / Medium / High so we get all 3 classes
    if i % 3 == 0:
        perf = 50 + (i * 3) % 15     # Low  (< 65)
    elif i % 3 == 1:
        perf = 65 + (i * 2) % 15     # Medium (65–79)
    else:
        perf = 80 + (i * 2) % 20     # High (>= 80)

    records.append({
        'employeeId': f'EMP{i:03d}',
        'employeeName': f'Employee {i}',          # ← correct field name
        'department': dept,
        'designation': 'Specialist',
        'experience': exp,
        'attendancePercentage': att,
        'workingHours': wh,
        'trainingHours': th,
        'jobSatisfaction': js,
        'workload': wl,
        'previousPerformanceRating': ppr,
        'productivityScore': prod,
        'performanceScore': perf,
        'qualityScore': 70 + (i * 4) % 30,
        'targetCompletionRate': 70 + (i * 3) % 30,
        'projectsCompleted': i % 15,
        'tasksCompleted': i % 20,
        'salary': 40000 + (i * 1500) % 60000,
    })

print(f"Test dataset: {len(records)} employees")
low_c = sum(1 for r in records if r['performanceScore'] < 65)
med_c = sum(1 for r in records if 65 <= r['performanceScore'] < 80)
high_c = sum(1 for r in records if r['performanceScore'] >= 80)
print(f"Class distribution  Low={low_c}, Medium={med_c}, High={high_c}")

# ── 1. Health Check ─────────────────────────────────────────────────────────────
print("\n=== HEALTH CHECK ===")
res_health = client.get('/health')
print(f"Status: {res_health.status_code}  |  {res_health.json()}")

# ── 2. Train & Evaluate ─────────────────────────────────────────────────────────
print("\n=== TRAIN & EVALUATE (POST /api/analytics/ml/train-evaluate) ===")
res_train = client.post('/api/analytics/ml/train-evaluate', json={'employees': records})
print(f"Status: {res_train.status_code}")
if res_train.status_code == 200:
    td = res_train.json()
    prep = td.get('preprocessingReport', {})
    print(f"Preprocessing:")
    print(f"  Raw records       : {prep.get('totalRawRecords')}")
    print(f"  Processed records : {prep.get('finalProcessedRecords')}")
    print(f"  Missing handled   : {prep.get('missingValuesHandled')}")
    print(f"  Duplicates removed: {prep.get('duplicateRecordsRemoved')}")
    print(f"  Class dist.       : {prep.get('classDistribution')}")
    print(f"Best model: {td.get('bestModel')}")
    print(f"Reason    : {td.get('bestModelReason')}")
    for key in ['decisionTree', 'randomForest', 'logisticRegression']:
        m = td.get(key, {})
        print(f"\n  [{m.get('modelName')}]")
        print(f"  Accuracy  : {m.get('accuracy')}")
        print(f"  F1 Macro  : {m.get('f1Macro')}")
        print(f"  F1 Weighted: {m.get('f1Weighted')}")
        print(f"  Train/Test: {m.get('trainingSamples')} / {m.get('testingSamples')}")
        print(f"  Conf Matrix: {m.get('confusionMatrix')}")
    print(f"\n  Feature Importances (RF): {td.get('featureImportances')}")
else:
    print(f"ERROR: {res_train.text}")

# ── 3. EDA Visualizations ───────────────────────────────────────────────────────
print("\n=== EDA VISUALIZATIONS (POST /api/analytics/ml/eda-visualizations) ===")
res_eda = client.post('/api/analytics/ml/eda-visualizations', json={'employees': records})
print(f"Status: {res_eda.status_code}")
if res_eda.status_code == 200:
    ed = res_eda.json()
    for key, label in [
        ('performanceLevelDistribution', '1. Performance Level Dist'),
        ('attendanceVsPerformance',      '2. Attendance vs Performance'),
        ('trainingHoursVsPerformance',   '3. Training Hours vs Performance'),
        ('experienceVsPerformance',      '4. Experience vs Performance'),
        ('jobSatisfactionVsPerformance', '5. Job Satisfaction vs Performance'),
        ('departmentPerformanceComparison', '6. Dept-wise Comparison'),
    ]:
        rows = ed.get(key, [])
        print(f"  {label}: {len(rows)} data points  |  sample={rows[:2]}")
else:
    print(f"ERROR: {res_eda.text}")

# ── 4. Interactive Predictions (all 3 models) ───────────────────────────────────
print("\n=== INTERACTIVE PREDICTION (POST /api/analytics/ml/predict) ===")
test_cases = [
    ('decision_tree',       'High performer profile', 90, 97, 50, 4.8, 2.5, 4.9),
    ('random_forest',       'Medium performer profile', 72, 85, 20, 3.0, 3.5, 3.0),
    ('logistic_regression', 'Low performer profile',   52, 70, 8,  2.0, 4.5, 2.0),
]
for model_name, label, prod, att, th, js, wl, ppr in test_cases:
    payload = {
        'experience': 5,
        'attendancePercentage': att,
        'workingHours': 42.0,
        'trainingHours': th,
        'jobSatisfaction': js,
        'workload': wl,
        'department': 'Engineering',
        'previousPerformanceRating': ppr,
        'productivityScore': prod,
        'modelChoice': model_name,              # ← correct field name
        'employeesContext': records            # provide training context
    }
    res_pred = client.post('/api/analytics/ml/predict', json=payload)
    if res_pred.status_code == 200:
        p = res_pred.json()
        print(f"\n  [{label}] using {model_name}")
        print(f"  Predicted: {p.get('predictedCategory')}  (confidence={p.get('confidence')})")
        print(f"  Probs: {p.get('classProbabilities')}")
        print(f"  Model used: {p.get('modelUsed')}")
        print(f"  Drivers: {p.get('featureDrivers')}")
    else:
        print(f"\n  [{label}] STATUS {res_pred.status_code}: {res_pred.text}")

print("\n=== ALL TESTS COMPLETE ===")
