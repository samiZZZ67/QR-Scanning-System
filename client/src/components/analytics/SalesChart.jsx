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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gold-muted/40 rounded-xl shadow-lifted px-4 py-3 text-sm">
      <p className="text-gold-muted font-medium mb-1">{label}</p>
      <p className="text-rough font-bold">{payload[0]?.value} items</p>
    </div>
  );
}

export function SalesChart({ data = [], title = 'Sales Volume' }) {
  return (
    <div className="bg-surface rounded-2xl border border-gold-muted/50 shadow-card p-5">
      {title && (
        <h3 className="text-sm font-semibold text-rough font-display mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#B8A48A33" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#B8A48A' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#B8A48A' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#E8D9C4', opacity: 0.4 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill="#3E160C" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SalesChart;
