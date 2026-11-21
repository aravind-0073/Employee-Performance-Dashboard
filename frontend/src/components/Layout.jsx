import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Building2,
  ShieldAlert,
  BrainCircuit,
  UploadCloud,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Activity,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [engineHealthy, setEngineHealthy] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    analyticsAPI.getHealth()
      .then(res => setEngineHealthy(res.data?.success || res.data?.status === 'healthy'))
      .catch(() => setEngineHealthy(false));
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Executive Dashboard' },
    { path: '/employees', icon: Users2, label: 'Employee Directory' },
    { path: '/ml-analytics', icon: BrainCircuit, label: 'Data Mining & ML' },
    { path: '/departments', icon: Building2, label: 'Dept. Benchmarking' },
    { path: '/performance-risks', icon: ShieldAlert, label: 'Performance Risks' },
    { path: '/upload', icon: UploadCloud, label: 'Dataset Ingestion' },
    { path: '/reports', icon: FileSpreadsheet, label: 'Export & Reports' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="bg-slate-900 border-r border-slate-800 text-white flex flex-col z-20 select-none shadow-xl shrink-0"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">Workforce</span>
                  <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
                </div>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-0.5">
                  Data Mining & ML Engine
                </p>
              </motion.div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-white' : 'group-hover:scale-110'}`} />
                  {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Service Health Widget */}
        {sidebarOpen && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Scikit-learn ML Engine
              </span>
              <span className={`w-2 h-2 rounded-full ${engineHealthy ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Port 8000 &bull; DT, RF & Logistic Ready
            </p>
          </div>
        )}

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'HR Manager'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.organization || 'Enterprise Org'}</p>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ─── Main Content Area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {user?.organization || 'Enterprise Workforce'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Data Mining & Machine Learning Academic Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Role: <strong className="text-slate-700 dark:text-slate-200">{user?.role || 'HR Administrator'}</strong></span>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
