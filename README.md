# Employee Performance Analysis & Management Dashboard

An enterprise-grade workforce monitoring, predictive analytics, and underperformance risk management platform built on a decoupled 3-tier microservices architecture. It combines a modern React 18 frontend with a Node.js Express API gateway, MongoDB database, and a high-performance Python FastAPI data science and machine learning engine.

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
| **Analytics & ML Service** | Python 3.9+, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn (Linear Regression), SciPy (pearsonr), Pydantic |
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
- **Optional Supported Headers:**
  - `Salary`, `JoiningDate`, `ProjectsCompleted`, `TasksCompleted`, `TargetCompletionRate`, `ManagerName`, `Skills`, `TrainingHours`, `QualityScore`, `Email`, `Phone`
- **Flexible Modes:** Option to append/update records or completely overwrite existing datasets.
- **Sample Templates:** One-click download for both Excel (`.xlsx`) and CSV (`.csv`) pre-formatted templates.

### 3. 📊 Real-Time KPI Dashboard (`/`)
- **Executive Metrics:** Total Headcount, Average Performance Score, Average Attendance Rate, Overall Productivity, Target Achievement Rate, High Performers Count, and Underperforming Employees Count.
- **Dynamic AI / Statistical Insights Cards:**
  - Pearson correlation test between Attendance and Performance Score (r and p-value).
  - Pearson correlation test between Productivity and Performance.
  - Best and lowest-performing departments with composite efficiency scores.
  - Departmental productivity drop alerts (&gt;5 pts below company average).
  - Identification of talent pool opportunities and underperformance warnings.
- **Interactive Visualizations:**
  - Performance Distribution Histogram (Poor &lt;50 to Excellent 85-100).
  - Employee Performance Index (EPI) Ratio Donut Chart.
  - Department-Level Comparative Bar Chart (Performance vs Productivity vs Attendance).
  - Attendance Distribution Bar Chart (&lt;75% deficit detection).
  - Top 10 High Performers and Bottom 10 Underperformers Leaderboards.

### 4. 👨‍💼 Employee Directory & Deep Analytics (`/employees` & `/employees/:employeeId`)
- **Search & Filters:** Search by ID or Name; filter by Department, Designation, Experience, Performance Category, and Risk Level.
- **Employee CRUD:** Add new employee modal, inline editing, and deletion.
- **Individual Employee Profiles:**
  - 5-Axis Performance Radar Chart: Productivity, Quality, Attendance, Target Achievement, Task Velocity.
  - **Employee Performance Index (EPI):** Weighted composite metric (0–100):
    $$\text{EPI} = (30\% \times \text{Productivity}) + (25\% \times \text{Quality}) + (20\% \times \text{Attendance}) + (15\% \times \text{TargetAchievement}) + (10\% \times \text{TaskCompletion})$$
  - **Machine Learning Predictive Engine:** Uses Scikit-learn Linear Regression to forecast expected employee performance from peer operational inputs, identifying positive or negative performance trends.
  - **Personalized Recommendations:** Dynamic strengths, weaknesses, and actionable coaching recommendations.
  - **Intervention Logger:** Audit trail to log PIPs, manager reviews, and technical training.

### 5. ⚠️ Automated Underperformance & Risk Management (`/performance-risks`)
- **Threshold Sensitivity Sliders:** Configurable organizational cutoffs for Performance, Attendance, and Productivity.
- **Multi-Factor Risk Scoring:** Evaluates attendance deficits (&lt;75%), productivity drops, low target completion, and deliverable quality.
- **Priority Matrix:** Categorizes employees into Critical, High, Medium, or Low priority.
- **Actionable Interventions:** Automated assignment of 30-Day PIPs, 1-on-1 manager alignment, workload rebalancing, and technical training.

### 6. 🏢 Departmental Benchmarking & Ranking (`/departments`)
- **Multi-Criteria Ranking Formula:**
  $$\text{Department Score} = (40\% \times \text{Performance}) + (30\% \times \text{Productivity}) + (20\% \times \text{Attendance}) + (10\% \times \text{TargetAchievement})$$
- Department comparison cards, rankings (1..N), comparative charts, and department rosters.

### 7. 📄 Export & Reporting Center (`/reports`)
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
- MongoDB (Local daemon or MongoDB Atlas)

### 1. Backend & Analytics Auto-Start

The Node.js backend includes auto-orchestration. When started, it automatically checks and launches the Python FastAPI analytics service:

```bash
cd backend
npm install
npm run dev
```

- API Gateway runs on `http://localhost:5000`
- Python Analytics microservice automatically spawns on `http://localhost:8000`
- Default admin account `admin@workforce.io` (`Admin@123`) is seeded with 60 realistic employee records.

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
4. Navigate to **Employee Directory**: search, filter by department or risk level, click on any employee to view their individual profile, 5-axis radar chart, and Scikit-learn ML performance prediction.
5. Navigate to **Performance Risks**: test the threshold sliders to observe real-time priority matrix updates and log an HR intervention.
6. Navigate to **Department Benchmarking**: observe multi-criteria rankings and individual department rosters.
7. Navigate to **Dataset Ingestion**: download sample `.xlsx` or `.csv` templates and test uploading files in append or overwrite mode.
8. Navigate to **Export & Reports**: download both formatted Excel spreadsheets and formal PDF dossiers.
