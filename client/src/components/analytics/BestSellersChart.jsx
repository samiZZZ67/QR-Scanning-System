import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gold-muted/40 rounded-xl shadow-lifted px-4 py-3 text-sm">
      <p className="text-rough font-bold">{payload[0]?.payload?.name}</p>
      <p className="text-gold-muted">{payload[0]?.value} sold</p>
    </div>
  );
}

export function BestSellersChart({ items = [], title = 'Best Sellers' }) {
  const top5 = items.slice(0, 5);

  return (
    <div className="bg-surface rounded-2xl border border-gold-muted/50 shadow-card p-5">
      {title && (
        <h3 className="text-sm font-semibold text-rough font-display mb-4">{title}</h3>
      )}

      {top5.length === 0 ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-gold-muted">
          No sales data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={top5}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#B8A48A33" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#B8A48A' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#4A3020' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#E8D9C4', opacity: 0.4 }} />
            <Bar dataKey="quantity" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {top5.map((_, i) => {
                const opacity = 1 - i * 0.12;
                return <Cell key={i} fill={`rgba(120,93,50,${opacity})`} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default BestSellersChart;
