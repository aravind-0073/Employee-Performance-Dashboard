import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  ArrowRight
} from 'lucide-react';

export default function InsightCard({ insight, index = 0 }) {
  const severityStyles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40',
      title: 'text-emerald-900 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      Icon: Award
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-900/50',
      icon: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40',
      title: 'text-rose-900 dark:text-rose-300',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      Icon: AlertCircle
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-900/50',
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40',
      title: 'text-amber-900 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      Icon: AlertTriangle
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-200 dark:border-indigo-900/50',
      icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40',
      title: 'text-indigo-900 dark:text-indigo-300',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      Icon: BarChart2
    }
  };

  const current = severityStyles[insight.severity] || severityStyles.info;
  const IconComponent = current.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`p-4 rounded-xl border ${current.bg} ${current.border} flex items-start gap-3.5`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${current.icon}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${current.title}`}>
            {insight.title}
          </h4>
          {insight.metricValue !== undefined && insight.metricValue !== null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${current.badge}`}>
              {insight.metricValue > 0 && insight.metricValue <= 1
                ? `r = ${insight.metricValue}`
                : `${insight.metricValue}`}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {insight.description || insight.message}
        </p>
      </div>
    </motion.div>
  );
}
