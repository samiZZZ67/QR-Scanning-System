import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gold-muted rounded-lg px-3 py-2 shadow-card text-sm">
      <p className="text-xs text-gold-muted mb-1">{label}</p>
      <p className="font-semibold text-rough">
        {(payload[0]?.value ?? 0).toLocaleString()} ETB
      </p>
    </div>
  );
}

/**
 * RevenueChart — line chart of revenue over the selected period.
 * @param {Array<{label:string, revenue:number}>} data
 */
export default function RevenueChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gold-muted text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,164,138,0.25)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#785d32" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#785d32" }}
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#785d32"
          strokeWidth={2.5}
          dot={{ fill: "#785d32", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#c4903a", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
