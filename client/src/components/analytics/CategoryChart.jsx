import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

// Brand-derived palette for slices
const SLICE_COLORS = [
  '#785D32',
  '#C4903A',
  '#3E160C',
  '#B8A48A',
  '#6B2A1A',
  '#050A30',
  '#E8D9C4',
  '#0F0705'
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-surface border border-gold-muted/40 rounded-xl shadow-lifted px-4 py-3 text-sm">
      <p className="text-rough font-semibold">{name}</p>
      <p className="text-gold-muted">{value} items sold</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-body">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function CategoryChart({ categories = [], title = 'Sales by Category' }) {
  const data = categories.map((c) => ({ name: c.name, value: c.quantity }));

  return (
    <div className="bg-surface rounded-2xl border border-gold-muted/50 shadow-card p-5">
      {title && (
        <h3 className="text-sm font-semibold text-rough font-display mb-2">{title}</h3>
      )}

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-sm text-gold-muted">
          No category data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              aria-label="Category sales pie chart"
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CategoryChart;
