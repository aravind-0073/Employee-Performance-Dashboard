import React from 'react';

const colorMap = {
  // Risk Levels
  'Critical': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500' },
  'High': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500' },
  'Medium': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-500' },
  'Low': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },

  // Performance Categories
  'Excellent': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  'Good': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/50', dot: 'bg-indigo-500' },
  'Average': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500' },
  'Needs Improvement': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50', dot: 'bg-orange-500' },

  // Statuses
  'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  'Under Review': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500' },
  'On Leave': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
};

export default function RiskBadge({ level = 'Low', showDot = true, size = 'sm' }) {
  const colors = colorMap[level] || colorMap['Low'];
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-xs font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />}
      <span>{level}</span>
    </span>
  );
}
