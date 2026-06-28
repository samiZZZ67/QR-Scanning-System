import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * StatCard — KPI tile for the analytics dashboard.
 *
 * @param {string}  title
 * @param {string}  value     Already-formatted display value
 * @param {React.ElementType} icon  Lucide icon component
 * @param {number|null} delta Percentage change vs previous period (null = hide)
 * @param {string}  className
 */
export default function StatCard({
  title,
  value,
  icon: Icon,
  delta,
  className = "",
}) {
  const hasDelta = delta !== null && delta !== undefined;
  const isPositive = hasDelta && delta > 0;
  const isNeutral = hasDelta && delta === 0;

  return (
    <motion.div
      className={`bg-surface rounded-xl border border-gold-muted shadow-card p-5 flex flex-col gap-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-gold uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-gold/10">
            <Icon size={16} className="text-gold" />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-rough font-display leading-none">
        {value}
      </div>

      {hasDelta && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            isNeutral
              ? "text-gold-muted"
              : isPositive
                ? "text-emerald-600"
                : "text-red-500"
          }`}
        >
          {!isNeutral &&
            (isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            ))}
          {isNeutral ? "—" : `${isPositive ? "+" : ""}${delta.toFixed(1)}%`}
          <span className="text-gold-muted font-normal ml-0.5">
            vs prev. period
          </span>
        </div>
      )}
    </motion.div>
  );
}
