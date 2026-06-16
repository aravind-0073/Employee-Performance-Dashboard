import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadAPI } from '../services/api';

export default function UploadDataset() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please upload an Excel (.xlsx) or CSV file');
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size should be less than 50MB');
        return;
      }

      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const response = await uploadAPI.uploadFile(file, clearExisting);
      setUploadResult(response.data.data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to delete all student data? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await uploadAPI.deleteAll();
      setUploadResult(null);
      toast.success('All data deleted successfully');
    } catch (error) {
      toast.error('Failed to delete data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-navy mb-6">Upload Student Data</h2>

        {/* File Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan rounded-lg p-12 text-center cursor-pointer hover:bg-cyan/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <motion.div
            whileHover={{ scale: 1.1 }}
            className="mb-4"
          >
            <Upload size={48} className="mx-auto text-cyan" />
          </motion.div>

          <h3 className="text-lg font-semibold text-navy mb-2">
            {file ? file.name : 'Drop your file here or click to browse'}
          </h3>
          <p className="text-gray-600 text-sm">
            Supported formats: Excel (.xlsx), CSV
            <br />
            Maximum file size: 50MB
          </p>
        </div>

        {/* File Info */}
        {file && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Options */}
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-gray-700">
              Clear existing data before uploading new data
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 px-6 py-3 bg-cyan text-white rounded-lg hover:bg-cyan/90 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
          <button
            onClick={handleClearData}
            disabled={loading}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-semibold"
          >
            Clear All Data
          </button>
        </div>
      </motion.div>

      {/* Upload Result */}
      {uploadResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <CheckCircle size={32} className="text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-navy">Upload Successful!</h3>
              <p className="text-gray-600 mt-1">Your student data has been processed and stored.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold text-green-600">{uploadResult.totalRows}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Inserted</p>
              <p className="text-2xl font-bold text-blue-600">{uploadResult.insertedCount}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{uploadResult.failedCount}</p>
            </div>
          </div>

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                Errors ({uploadResult.errors.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadResult.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setUploadResult(null);
              setFile(null);
            }}
            className="mt-6 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-semibold"
          >
            Upload Another File
          </button>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
      >
        <h4 className="font-bold text-navy mb-3">📋 Required Columns in Your File</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-navy mb-2">Required Fields:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>USN</li>
              <li>StudentName</li>
              <li>Department</li>
              <li>Semester</li>
              <li>Section</li>
              <li>AttendancePercentage</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-navy mb-2">Optional Fields:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Subject1-5Marks</li>
              <li>InternalMarks</li>
              <li>GPA / CGPA</li>
              <li>Email, Phone</li>
              <li>Parent/Counselor Info</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
