# Employee Performance Analysis & Management Dashboard

An enterprise-grade workforce monitoring, predictive analytics, and underperformance risk management platform built on a decoupled 3-tier microservices architecture. It combines a modern React 18 frontend with a Node.js Express API gateway, MongoDB database, and a high-performance Python FastAPI data science and machine learning engine.

> **Academic Project**: *"Employee Performance Analysis and Prediction Using Data Mining and Machine Learning"*  
> Subject: Data Analytics and Data Mining

---

## 🏗️ System Architecture & Data Flow

```text
                 ┌─────────────────────────────────────┐
                 │       React 18 + Vite Frontend      │
                 │    (Port 3000: Tailwind, Recharts)   │
                 └──────────────────┬──────────────────┘
                                    │
                             HTTP / REST (JWT)
                                    │
                 ┌──────────────────▼──────────────────┐
                 │     Node.js / Express Gateway      │
                 │     (Port 5000: Auth, CRUD, Export)│
                 └───────────┬──────────────────┬─────┘
                             │                  │
                   Mongoose Queries     HTTP Inter-Service
                             │                  │
                             ▼                  ▼
                  ┌────────────────┐  ┌─────────────────────┐
                  │ MongoDB Engine │  │ Python FastAPI      │
                  │ (Port 27017)   │  │ Analytics Engine    │
                  │ Workforce DB   │  │ (Port 8000)         │
                  └────────────────┘  └─────────────────────┘
```

1. **Auto-Service Orchestration:** When the Node.js backend starts (`server.js`), it performs a health check on `http://localhost:8000/health`. If the Python FastAPI service is offline, Node.js automatically spawns the Python virtual environment process as a managed child process.
2. **Multi-Tenancy & Data Isolation:** Each employee record is indexed to a specific authenticated organization or administrator (`userId`). All queries, uploads, analytics computations, and report exports are strictly scoped to the authenticated user.
3. **Managed Database Resilience:** Automatically connects to local MongoDB or MongoDB Atlas; if neither is detected in development, it boots an in-process managed `MongoMemoryServer` engine with auto-seeding.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.4, Recharts, Framer Motion, Lucide React, Axios, React Router DOM v6, React Toastify |
| **Backend Gateway** | Node.js (ESM), Express.js 4.18, Mongoose ODM, Multer, xlsx (SheetJS), ExcelJS, PDFKit, bcryptjs, JSON Web Tokens (JWT) |
| **Analytics & ML Service** | Python 3.9+, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn (DecisionTree, RandomForest, LogisticRegression, StandardScaler), SciPy (pearsonr), Pydantic |
| **Database** | MongoDB with compound indexing on `(userId, employeeId)` and `(userId, department, designation)` |

---

## 🧩 Core Modules & Functionalities

### 1. 🔐 Authentication & Multi-Tenancy
- **Secure Access:** Signup and login using hashed passwords (`bcryptjs`, 12 rounds) and signed JWT tokens with 7-day expiration.
- **Axios Interceptors:** Automatic token injection in HTTP headers with automated 401 redirection to `/login`.
- **Private Workspaces:** Every organization or administrator manages its own isolated employee dataset without cross-tenant interference.
- **Default Demo Credentials:**
  - **Email:** `admin@workforce.io`
  - **Password:** `Admin@123`

### 2. 📁 Employee Data Ingestion & Dataset Management (`/upload`)
- **File Ingestion:** Drag-and-drop parsing for `.xlsx`, `.xls`, and `.csv` files via Multer and SheetJS (`xlsx`).
- **Schema Validation:** Verifies required headers:
  - `EmployeeID`, `EmployeeName`, `Department`, `Designation`, `Experience`, `AttendancePercentage`, `PerformanceScore`, `ProductivityScore`
- **Academic ML Headers (Optional):**
  - `WorkingHours`, `TrainingHours`, `JobSatisfaction`, `Workload`, `PreviousPerformanceRating`
- **Additional Optional Headers:**
  - `Salary`, `JoiningDate`, `ProjectsCompleted`, `TasksCompleted`, `TargetCompletionRate`, `ManagerName`, `Skills`, `QualityScore`, `Email`, `Phone`
- **Flexible Modes:** Option to append/update records or completely overwrite existing datasets.
- **Sample Templates:** One-click download for both Excel (`.xlsx`) and CSV (`.csv`) pre-formatted templates.

### 3. 📊 Real-Time KPI Dashboard (`/`)
- **Executive Metrics:** Total Headcount, Average Performance Score, Average Attendance Rate, Overall Productivity, Target Achievement Rate, High Performers Count, and Underperforming Employees Count.
- **Dynamic AI / Statistical Insights Cards:**
  - Pearson correlation test between Attendance and Performance Score (r and p-value).
  - Pearson correlation test between Productivity and Performance.
  - Best and lowest-performing departments with composite efficiency scores.
  - Departmental productivity drop alerts (>5 pts below company average).
  - Identification of talent pool opportunities and underperformance warnings.
- **Interactive Visualizations:**
  - Performance Distribution Histogram (Poor <50 to Excellent 85-100).
  - Employee Performance Index (EPI) Ratio Donut Chart.
  - Department-Level Comparative Bar Chart (Performance vs Productivity vs Attendance).
  - Attendance Distribution Bar Chart (<75% deficit detection).
  - Top 10 High Performers and Bottom 10 Underperformers Leaderboards.

### 4. 👨‍💼 Employee Directory & Deep Analytics (`/employees` & `/employees/:employeeId`)
- **Search & Filters:** Search by ID or Name; filter by Department, Designation, Experience, Performance Category, and Risk Level.
- **Employee CRUD:** Add new employee modal, inline editing, and deletion.
- **Individual Employee Profiles:**
  - 5-Axis Performance Radar Chart: Productivity, Quality, Attendance, Target Achievement, Task Velocity.
  - **Employee Performance Index (EPI):** Weighted composite metric (0–100):
    ```
    EPI = (30% × Productivity) + (25% × Quality) + (20% × Attendance) + (15% × TargetAchievement) + (10% × TaskCompletion)
    ```
  - **Machine Learning Predictive Engine:** Uses Scikit-learn Linear Regression to forecast expected employee performance from peer operational inputs.
  - **Academic Attributes Displayed:** Working Hours, Job Satisfaction, Workload, Previous Performance Rating.
  - **Personalized Recommendations:** Dynamic strengths, weaknesses, and actionable coaching recommendations.
  - **Intervention Logger:** Audit trail to log PIPs, manager reviews, and technical training.

### 5. ⚠️ Automated Underperformance & Risk Management (`/performance-risks`)
- **Threshold Sensitivity Sliders:** Configurable organizational cutoffs for Performance, Attendance, and Productivity.
- **Multi-Factor Risk Scoring:** Evaluates attendance deficits (<75%), productivity drops, low target completion, and deliverable quality.
- **Priority Matrix:** Categorizes employees into Critical, High, Medium, or Low priority.
- **Actionable Interventions:** Automated assignment of 30-Day PIPs, 1-on-1 manager alignment, workload rebalancing, and technical training.

### 6. 🏢 Departmental Benchmarking & Ranking (`/departments`)
- **Multi-Criteria Ranking Formula:**
  ```
  Department Score = (40% × Performance) + (30% × Productivity) + (20% × Attendance) + (10% × TargetAchievement)
  ```
- Department comparison cards, rankings (1..N), comparative charts, and department rosters.

### 7. 🧠 Data Mining & ML Analysis (`/ml-analytics`)

This section implements the complete academic machine learning pipeline for employee performance classification.

#### Employee Dataset Attributes
The extended dataset supports the following attributes for ML:

| Attribute | Description | Range |
|---|---|---|
| `experience` | Years of work experience | 0.5–15 |
| `attendancePercentage` | Attendance rate | 0–100% |
| `workingHours` | Average working hours/week | 10–80 |
| `trainingHours` | Training hours completed | 0–80 |
| `jobSatisfaction` | Self-reported satisfaction | 1.0–5.0 |
| `workload` | Workload intensity rating | 1.0–5.0 |
| `previousPerformanceRating` | Prior period rating | 1.0–5.0 |
| `productivityScore` | Output productivity score | 0–100 |
| `performanceScore` | Ground-truth performance score | 0–100 |

#### Data Preprocessing Pipeline

The Python ML engine executes a formal data wrangling pipeline:

1. **Duplicate Removal** — Removes records with duplicate `employeeId`.
2. **Missing Value Imputation** — Detects NaN values and applies column-wise median imputation on numeric features.
3. **Bounds Correction** — Clips inconsistent values to valid ranges (attendance 0–100, jobSatisfaction 1–5, etc.).
4. **Target Variable Derivation** — Maps `performanceScore` to 3 classes:
   - `Low` → score < 65
   - `Medium` → score 65–79.9
   - `High` → score ≥ 80
5. **Categorical Encoding** — One-hot encodes the `department` column (`drop_first=True`).
6. **Feature Scaling** — `StandardScaler` fitted **only on training data** (no data leakage), then transforms test set and prediction samples.

#### Machine Learning Models

Three Scikit-learn classifiers are trained for multi-class performance prediction:

**A. Decision Tree Classifier**
- Hyperparameters: `criterion='gini'`, `max_depth=5`, `min_samples_split=4`
- Operates on unscaled feature matrix (tree-based, scale-invariant)

**B. Random Forest Classifier**
- Hyperparameters: `n_estimators=100`, `max_depth=6`, `min_samples_split=4`
- Provides feature importance analysis for identifying key performance drivers

**C. Logistic Regression (Multi-class)**
- Hyperparameters: `solver='lbfgs'`, `multi_class='multinomial'`, `C=1.0`, `max_iter=1000`
- Operates on StandardScaler-normalized features

#### Feature Matrix (No Target Leakage)
The feature set `X` excludes `performanceScore` and `epi` entirely:
```
X = [experience, attendancePercentage, workingHours, trainingHours,
     jobSatisfaction, workload, previousPerformanceRating, productivityScore,
     dept_Finance, dept_HR, dept_Marketing, ...]
```

#### Model Evaluation Metrics
All models are evaluated using stratified train/test split (75%/25%):
- **Accuracy**
- **Precision** (macro & weighted)
- **Recall** (macro & weighted)
- **F1-Score** (macro & weighted)
- **Confusion Matrix** (3×3 Low/Medium/High)

#### Academic EDA Visualizations
1. **Performance Level Distribution** — Low / Medium / High class counts and percentages
2. **Attendance vs Performance** — Individual scatter plot colored by performance category
3. **Training Hours vs Performance** — Binned range analysis (<15, 15-29, 30-44, 45+ hrs)
4. **Experience vs Performance** — Bands: Junior (<2yr), Mid (2-4yr), Senior (5-9yr), Veteran (10+yr)
5. **Job Satisfaction vs Performance** — Rating 1–5 group averages
6. **Department-wise Comparison** — Multi-metric per-department breakdown

#### Interactive Prediction Interface
Users can input attributes and select which trained model to use:
- Returns predicted class: **Low**, **Medium**, or **High**
- Class probability distribution (confidence scores)
- Key performance drivers
- Personalized HR recommendations

### 8. 📄 Export & Reporting Center (`/reports`)
- **Excel Spreadsheets (`.xlsx` via `exceljs`):**
  1. Complete workforce database
  2. Performance summary & EPI ratings
  3. Underperforming employees & risk audit
  4. Departmental benchmarking & rankings
  5. High-performing talent pool
- **PDF Documentation (`PDFKit`):**
  1. Executive Workforce Performance Report
  2. Individual Employee Performance Appraisal Document
  3. Workforce Risk & PIP Intervention Report

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (Local daemon or MongoDB Atlas — optional, falls back to in-memory automatically)

### 1. Backend & Analytics Auto-Start

The Node.js backend includes auto-orchestration. When started, it automatically:
1. Connects to MongoDB (falls back to `MongoMemoryServer` if unavailable)
2. Seeds 75 realistic employee profiles and the demo admin account
3. Checks and auto-starts the Python FastAPI analytics service

```bash
cd backend
npm install
npm run dev
```

- API Gateway runs on `http://localhost:5000`
- Python Analytics microservice automatically spawns on `http://localhost:8000`
- Default admin account `admin@workforce.io` (`Admin@123`) is seeded with 75 realistic employee records.

### 2. Standalone Analytics Service (Manual Run Option)

```bash
cd analytics
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On macOS/Linux
pip install -r requirements.txt
python main.py
```

Runs on `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 3. Frontend Web Application

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

---

## ⚙️ Environment Variables

### `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-dashboard
NODE_ENV=development
ANALYTICS_SERVICE_URL=http://localhost:8000
JWT_SECRET=supersecret_workforce_jwt_key_2026
```

### `analytics/.env`
```env
ANALYTICS_PORT=8000
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
ENABLE_PREDICTIONS=true
```

---

## 🧪 Testing the Complete Pipeline

1. Open `http://localhost:3000/login` in your browser.
2. Click **"Use Demo"** or enter `admin@workforce.io` / `Admin@123`.
3. View the **Executive Dashboard**: inspect the 7 KPI cards, the dynamic AI insights cards with Pearson correlations, and the interactive charts.
4. Navigate to **Employee Directory**: search, filter by department or risk level, click on any employee to view their individual profile, 5-axis radar chart, and ML performance prediction.
5. Navigate to **Performance Risks**: test the threshold sliders to observe real-time priority matrix updates and log an HR intervention.
6. Navigate to **Department Benchmarking**: observe multi-criteria rankings and individual department rosters.
7. Navigate to **Dataset Ingestion**: download sample `.xlsx` or `.csv` templates and test uploading files in append or overwrite mode.
8. Navigate to **Export & Reports**: download both formatted Excel spreadsheets and formal PDF dossiers.
9. **Navigate to Data Mining & ML** (`/ml-analytics`):
   - **Tab 1 — Dataset & Preprocessing:** View preprocessing pipeline report (records processed, missing values, duplicates, class distribution).
   - **Tab 2 — EDA Visualizations:** Explore all 6 academic charts (scatter plots, bar charts, distribution charts).
   - **Tab 3 — ML Models & Evaluation:** Compare Decision Tree, Random Forest, and Logistic Regression with metrics tables, confusion matrices, and feature importance chart.
   - **Tab 4 — Interactive Prediction:** Enter employee attributes, select a model, and get a real-time performance category prediction (Low / Medium / High) with probability scores.

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/signup` | Create new organization account |

### Employee Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | Paginated list with search & filters |
| POST | `/api/employees` | Create new employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| POST | `/api/employees/:id/interventions` | Log HR intervention |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/kpi` | Executive KPI summary |
| GET | `/api/analytics/insights` | AI insights with Pearson correlations |
| GET | `/api/analytics/distributions` | Performance distributions & leaderboards |
| GET | `/api/analytics/departments` | Department benchmarking & rankings |
| GET | `/api/analytics/risks` | Underperformance risk matrix |
| GET | `/api/analytics/predict/:id` | Individual regression prediction |
| GET | `/api/analytics/deep-dive/:id` | Full individual employee analysis |

### Data Mining & Machine Learning
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/ml/models` | Train & evaluate all 3 classifiers |
| GET | `/api/analytics/ml/visualizations` | 6 academic EDA visualization datasets |
| POST | `/api/analytics/ml/predict` | Interactive multi-class prediction |

### Upload & Export
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload Excel/CSV dataset |
| GET | `/api/upload/template/:format` | Download sample template |
| GET | `/api/export/excel/:type` | Export Excel reports |
| GET | `/api/export/pdf/:type` | Export PDF reports |

---

## 📊 Sample ML API Response

**`GET /api/analytics/ml/models`**
```json
{
  "preprocessingReport": {
    "totalRawRecords": 75,
    "finalProcessedRecords": 75,
    "missingValuesHandled": 0,
    "duplicateRecordsRemoved": 0,
    "classDistribution": { "Low": 19, "Medium": 37, "High": 19 }
  },
  "decisionTree": {
    "modelName": "Decision Tree Classifier",
    "accuracy": 0.9474,
    "f1Macro": 0.9456,
    "confusionMatrix": [[5,0,0],[1,8,0],[0,0,5]]
  },
  "randomForest": {
    "modelName": "Random Forest Classifier",
    "accuracy": 0.9737,
    "f1Macro": 0.9722,
    "featureImportances": {
      "productivityScore": 0.1295,
      "attendancePercentage": 0.0391,
      "experience": 0.0767
    }
  },
  "bestModel": "Random Forest Classifier"
}
```
