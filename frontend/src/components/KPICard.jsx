import { motion } from 'framer-motion';

export default function KPICard({ title, value, subtitle = null, icon: Icon, color = 'cyan', trend = null }) {
  const colorMap = {
    cyan:   'linear-gradient(135deg, #22d3ee, #0891b2)',
    purple: 'linear-gradient(135deg, #c084fc, #9333ea)',
    green:  'linear-gradient(135deg, #4ade80, #16a34a)',
    red:    'linear-gradient(135deg, #f87171, #dc2626)',
    blue:   'linear-gradient(135deg, #60a5fa, #2563eb)',
    orange: 'linear-gradient(135deg, #fb923c, #ea580c)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ background: colorMap[color] || colorMap.cyan }}
      className="rounded-lg shadow-lg p-6 text-white"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs font-semibold mt-1 opacity-80">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-100' : 'text-red-100'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}
