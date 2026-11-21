import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { uploadAPI } from '../services/api';

export default function UploadDataset() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState('append'); // 'append' or 'overwrite'
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    setResult(null);
    const validExts = ['.xlsx', '.xls', '.csv'];
    const name = selectedFile.name.toLowerCase();
    const isMatch = validExts.some((ext) => name.endsWith(ext));

    if (!isMatch) {
      setErrorMessage('Invalid file format. Please upload an .xlsx, .xls, or .csv file.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setErrorMessage('');
      setResult(null);

      const res = await uploadAPI.uploadFile(file, mode);
      if (res.data?.success) {
        setResult(res.data);
        setFile(null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Upload failed. Please verify that your file contains all required headers.'
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async (type) => {
    try {
      const res =
        type === 'excel'
          ? await uploadAPI.downloadExcelTemplate()
          : await uploadAPI.downloadCsvTemplate();

      const ext = type === 'excel' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employee_template.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <span>Employee Data Ingestion & Dataset Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bulk ingest organizational records via Excel or CSV with real-time schema validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadTemplate('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Excel Template</span>
          </button>
          <button
            onClick={() => downloadTemplate('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>CSV Template</span>
          </button>
        </div>
      </div>

      {/* ─── Ingestion Mode Selector ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Ingestion Mode & Data Strategy
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setMode('append')}
            className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              mode === 'append'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'append'}
              onChange={() => setMode('append')}
              className="mt-0.5 accent-indigo-600"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Append & Update (Recommended)
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Inserts newly detected employees and seamlessly updates existing matching employee IDs while preserving existing history.
              </p>
            </div>
          </label>

          <label
            onClick={() => setMode('overwrite')}
            className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              mode === 'overwrite'
                ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'overwrite'}
              onChange={() => setMode('overwrite')}
              className="mt-0.5 accent-rose-600"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Overwrite Full Organization Dataset
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Clears all previous employee records for your workspace and replaces them completely with the uploaded spreadsheet.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ─── Drag & Drop Upload Zone ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-slate-400'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <UploadCloud size={24} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop your spreadsheet here, or{' '}
                <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  browse files
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV up to 20MB
              </p>
            </div>

            {file && (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Schema Validation Error</p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {result && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{result.message}</span>
            </div>
            {result.summary && (
              <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-emerald-800 dark:text-emerald-200">
                <span>Total Processed: <strong>{result.summary.validProcessed}</strong></span>
                <span>Inserted: <strong>{result.summary.insertedCount}</strong></span>
                <span>Updated: <strong>{result.summary.updatedCount}</strong></span>
                {result.summary.errorCount > 0 && (
                  <span className="text-amber-600">Skipped/Errors: <strong>{result.summary.errorCount}</strong></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-40 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
            <span>{uploading ? 'Validating & Processing...' : 'Upload & Process Dataset'}</span>
          </button>
        </div>
      </div>

      {/* ─── Schema Reference Card ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Required & Optional Dataset Headers Specification
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="font-bold text-slate-900 dark:text-white">Required Headers (8):</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>&bull; EmployeeID (unique identifier)</li>
              <li>&bull; EmployeeName</li>
              <li>&bull; Department (Engineering, Sales, etc.)</li>
              <li>&bull; Designation (Job Title)</li>
              <li>&bull; Experience (years, positive number)</li>
              <li>&bull; AttendancePercentage (0 - 100)</li>
              <li>&bull; PerformanceScore (0 - 100)</li>
              <li>&bull; ProductivityScore (0 - 100)</li>
            </ul>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="font-bold text-slate-900 dark:text-white">Optional Headers (Supported):</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>&bull; Salary, JoiningDate</li>
              <li>&bull; ProjectsCompleted, TasksCompleted</li>
              <li>&bull; TargetCompletionRate (0 - 100)</li>
              <li>&bull; ManagerName</li>
              <li>&bull; Skills (comma-separated list)</li>
              <li>&bull; TrainingHours, QualityScore</li>
              <li>&bull; Email, Phone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
