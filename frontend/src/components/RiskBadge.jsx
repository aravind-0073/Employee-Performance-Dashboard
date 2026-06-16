import { motion } from 'framer-motion';

const colorMap = {
  'Critical': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  'High Risk': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  'High': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  'Medium Risk': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Medium': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Low Risk': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Low': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

export default function RiskBadge({ level, showDot = true, size = 'sm' }) {
  const colors = colorMap[level] || colorMap['Low'];
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} font-bold rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
      {showDot && <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />}
      {level}
    </span>
  );
}
