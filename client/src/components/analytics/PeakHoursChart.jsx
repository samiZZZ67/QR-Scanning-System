import React from 'react';

function formatHour(h) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function PeakHoursChart({ hours = [], title = 'Peak Hours' }) {
  // hours is array of [hourNumber, count] pairs
  const hourMap = new Map(hours);
  const maxCount = Math.max(...hourMap.values(), 1);

  const cells = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourMap.get(i) || 0
  }));

  return (
    <div className="bg-surface rounded-2xl border border-gold-muted/50 shadow-card p-5">
      {title && (
        <h3 className="text-sm font-semibold text-rough font-display mb-4">{title}</h3>
      )}

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}
        role="img"
        aria-label="Order frequency by hour of day heatmap"
      >
        {cells.map(({ hour, count }) => {
          const intensity = count / maxCount;
          const bgStyle = count === 0
            ? { backgroundColor: '#E8D9C4' }
            : { backgroundColor: `rgba(120,93,50,${0.15 + intensity * 0.85})` };

          return (
            <div
              key={hour}
              title={`${formatHour(hour)}: ${count} order${count !== 1 ? 's' : ''}`}
              aria-label={`${formatHour(hour)}: ${count} orders`}
              className="rounded aspect-square"
              style={bgStyle}
            />
          );
        })}
      </div>

      {/* Hour labels every 6 hours */}
      <div className="flex justify-between mt-2 text-xs text-gold-muted px-0.5">
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h}>{formatHour(h)}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gold-muted">
        <span>Low</span>
        <div className="flex gap-0.5">
          {[0.15, 0.35, 0.55, 0.75, 1].map((op) => (
            <div
              key={op}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(120,93,50,${op})` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}

export default PeakHoursChart;
