import React from 'react';
import { motion } from 'framer-motion';

export default function KPICard({
  title,
  value,
  subtitle = null,
  icon: Icon,
  badge = null,
  badgeColor = 'emerald',
  color = 'indigo'
}) {
  const accentColors = {
    indigo: 'from-indigo-600 to-indigo-700 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40',
    emerald: 'from-emerald-600 to-emerald-700 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40',
    amber: 'from-amber-600 to-amber-700 text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
    rose: 'from-rose-600 to-rose-700 text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40',
    cyan: 'from-cyan-600 to-cyan-700 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/40',
    purple: 'from-purple-600 to-purple-700 text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40',
  };

  const selectedAccent = accentColors[color] || accentColors.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h3>
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${selectedAccent.split(' ').slice(1).join(' ')}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
