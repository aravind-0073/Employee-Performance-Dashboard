import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ShieldAlert,
  Star,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { exportAPI, employeeAPI } from '../services/api';

export default function Reports() {
  const [downloading, setDownloading] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  useEffect(() => {
    employeeAPI.getAll({ limit: 100, sortBy: 'employeeName', sortOrder: 'asc' })
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setEmployees(res.data.data);
          setSelectedEmpId(res.data.data[0].employeeId);
        }
      })
      .catch(console.error);
  }, []);

  const triggerDownload = async (key, apiCall, filename) => {
    try {
      setDownloading(key);
      const res = await apiCall();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const excelReports = [
    {
      id: 'full-db',
      title: 'Complete Workforce Database',
      description: 'Comprehensive roster containing all employee attributes, contact details, operational scores, and EPI ratings.',
      icon: Users,
      action: () => triggerDownload('full-db', exportAPI.exportFullDatabaseExcel, 'workforce_full_database.xlsx')
    },
    {
      id: 'perf-summary',
      title: 'Performance & EPI Rating Summary',
      description: 'Executive spreadsheet ranking all personnel by evaluated performance and composite Employee Performance Index.',
      icon: Star,
      action: () => triggerDownload('perf-summary', exportAPI.exportPerformanceSummaryExcel, 'performance_summary.xlsx')
    },
    {
      id: 'underperforming',
      title: 'Underperformance & Risk Assessment',
      description: 'Audit report of employees categorized under Critical, High, or Medium risk with penalty drivers and suggested interventions.',
      icon: ShieldAlert,
      action: () => triggerDownload('underperforming', exportAPI.exportUnderperformingExcel, 'underperformance_risk_report.xlsx')
    },
    {
      id: 'dept-benchmark',
      title: 'Departmental Benchmark & Rankings',
      description: 'Multi-criteria ranking summary of departments based on the 40/30/20/10 weighted formula with headcount and averages.',
      icon: Building2,
      action: () => triggerDownload('dept-benchmark', exportAPI.exportDepartmentBenchmarksExcel, 'department_benchmarks.xlsx')
    },
    {
      id: 'high-performers',
      title: 'High-Performing Talent Pool',
      description: 'Filtered list of top talent maintaining performance scores ≥ 80% for promotion and leadership pipelines.',
      icon: FileCheck,
      action: () => triggerDownload('high-performers', exportAPI.exportHighPerformersExcel, 'high_performers_pool.xlsx')
    }
  ];

  const pdfReports = [
    {
      id: 'exec-pdf',
      title: 'Executive Workforce Performance Report (PDF)',
      description: 'Formal corporate brief with executive KPI cards, top departmental benchmarks, leaderboards, and HR review sign-off block.',
      action: () => triggerDownload('exec-pdf', exportAPI.exportExecutiveWorkforcePDF, 'executive_workforce_report.pdf')
    },
    {
      id: 'risk-pdf',
      title: 'Workforce Risk & PIP Intervention Report (PDF)',
      description: 'Formal HR audit documentation itemizing at-risk employees, attendance deficits, and recommended 30-day PIP action plans.',
      action: () => triggerDownload('risk-pdf', exportAPI.exportPerformanceRiskPDF, 'workforce_risk_intervention_report.pdf')
    }
  ];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Export & Reporting Documentation Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate publication-ready styled Microsoft Excel spreadsheets and formal organizational PDF reports
          </p>
        </div>
      </div>

      {/* ─── Excel Reports Section ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Formatted Microsoft Excel (.xlsx) Reports
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {excelReports.map((rpt) => {
            const Icon = rpt.icon;
            const isBusy = downloading === rpt.id;
            return (
              <div
                key={rpt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rpt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {rpt.description}
                  </p>
                </div>

                <button
                  onClick={rpt.action}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} className={isBusy ? 'animate-bounce' : ''} />
                  <span>{isBusy ? 'Generating Spreadsheet...' : 'Download .xlsx'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── PDF Reports Section ──────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Formal PDF Documentation (PDFKit Engine)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pdfReports.map((rpt) => {
            const isBusy = downloading === rpt.id;
            return (
              <div
                key={rpt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rpt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {rpt.description}
                  </p>
                </div>

                <button
                  onClick={rpt.action}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} className={isBusy ? 'animate-bounce' : ''} />
                  <span>{isBusy ? 'Compiling PDF...' : 'Download Formal PDF'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Individual Employee Appraisal PDF Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Individual Performance Appraisal Document (PDF)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Generates an appraisal dossier with performance breakdown, manager evaluation, and sign-off blocks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.employeeName} ({e.employeeId})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (selectedEmpId) {
                  triggerDownload(
                    `emp-${selectedEmpId}`,
                    () => exportAPI.exportEmployeeAppraisalPDF(selectedEmpId),
                    `appraisal_${selectedEmpId}.pdf`
                  );
                }
              }}
              disabled={!selectedEmpId || downloading === `emp-${selectedEmpId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <Download size={14} />
              <span>Export Appraisal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
