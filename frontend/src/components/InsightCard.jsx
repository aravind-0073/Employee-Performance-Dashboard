import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Trophy, Star, CheckCircle, Info } from 'lucide-react';

const iconMap = {
  trending: TrendingUp,
  trending_down: TrendingDown,
  alert: AlertTriangle,
  warning: AlertTriangle,
  trophy: Trophy,
  star: Star,
  check: CheckCircle,
  info: Info,
  default: Lightbulb,
};

const typeColors = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-900' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', text: 'text-amber-900' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', text: 'text-red-900' },
  correlation: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', text: 'text-blue-900' },
  info: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', text: 'text-slate-900' },
};

export default function InsightCard({ insight, index = 0 }) {
  const colors = typeColors[insight.type] || typeColors.info;
  const IconComponent = iconMap[insight.icon] || iconMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border} hover:shadow-sm transition-shadow`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
        <IconComponent size={18} />
      </div>
      <p className={`text-sm font-medium leading-relaxed ${colors.text}`}>
        {insight.message}
      </p>
    </motion.div>
  );
}
