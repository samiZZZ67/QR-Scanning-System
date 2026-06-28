import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  ShoppingBag,
  Tag,
  QrCode,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useOrders } from '../../../hooks/useOrders.js';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { formatMoney } from '../../../utils/formatting.js';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';
import StatCard from '../../../components/analytics/StatCard.jsx';
import RevenueChart from '../../../components/analytics/RevenueChart.jsx';
import SalesChart from '../../../components/analytics/SalesChart.jsx';
import BestSellersChart from '../../../components/analytics/BestSellersChart.jsx';
import CategoryChart from '../../../components/analytics/CategoryChart.jsx';
import PeakHoursChart from '../../../components/analytics/PeakHoursChart.jsx';
import ExportPanel from './ExportPanel.jsx';

const RANGE_TABS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'yearly', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' }
];

export default function Dashboard() {
  const { orders, loading, error, refresh } = useOrders({});
  const [range, setRange] = useState('weekly');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [compare, setCompare] = useState(true);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const analytics = useAnalytics(orders, range, customRange, compare);
  const { current, deltas, filtered } = analytics || {
    current: {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      uniqueTables: 0,
      revenueByTime: [],
      byCategory: [],
      bestSellers: [],
      peakHours: []
    },
    deltas: null,
    filtered: []
  };

  const handleCustomRangeChange = (e) => {
    const { name, value } = e.target;
    setCustomRange(prev => ({ ...prev, [name]: value }));
  };

  const formatDelta = (val) => {
    if (val === null || val === undefined) return null;
    return val;
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Performance Dashboard</h2>
          <p className="text-sm text-gold-muted mt-1">Real-time revenue, order analysis, and guest statistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Range Selection Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface rounded-xl border border-gold-muted/30 p-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Report Date Range">
          {RANGE_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={range === tab.id}
              onClick={() => setRange(tab.id)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                range === tab.id
                  ? 'bg-gold text-pale-light font-semibold shadow-sm'
                  : 'text-rough hover:text-gold hover:bg-pale/50'
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="rounded text-gold focus:ring-gold border-gold-muted/50"
            />
            Compare with previous period
          </label>
        </div>
      </div>

      {/* Custom Range Picker */}
      {range === 'custom' && (
        <Card className="p-4 bg-pale-light/50 border border-gold-muted/35">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gold" />
              <span className="text-sm font-medium text-rough">Custom Bounds:</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                name="from"
                value={customRange.from}
                onChange={handleCustomRangeChange}
                className="bg-surface border border-gold-muted/50 rounded-lg px-3 py-1.5 text-sm text-rough focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <span className="text-sm text-gold-muted">to</span>
              <input
                type="date"
                name="to"
                value={customRange.to}
                onChange={handleCustomRangeChange}
                className="bg-surface border border-gold-muted/50 rounded-lg px-3 py-1.5 text-sm text-rough focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" text="Analyzing transaction history..." />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatMoney(current.totalRevenue)}
              icon={BarChart2}
              delta={formatDelta(deltas?.totalRevenue)}
            />
            <StatCard
              title="Orders Placed"
              value={current.totalOrders.toString()}
              icon={ShoppingBag}
              delta={formatDelta(deltas?.totalOrders)}
            />
            <StatCard
              title="Average Order Value"
              value={formatMoney(current.avgOrderValue)}
              icon={Tag}
              delta={formatDelta(deltas?.avgOrderValue)}
            />
            <StatCard
              title="Unique Tables"
              value={current.uniqueTables.toString()}
              icon={QrCode}
              delta={formatDelta(deltas?.uniqueTables)}
            />
          </div>

          {/* Revenue and Hourly Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="font-display font-semibold text-rough text-base">Revenue Timeline</h3>
                <p className="text-xs text-gold-muted mt-0.5">Earnings trend over the selected date range.</p>
              </div>
              <div className="flex-1 min-h-[260px]">
                <RevenueChart data={current.revenueByTime} />
              </div>
            </Card>

            <SalesChart
              title="Hourly Sales Volume"
              data={(current.peakHours || []).map(h => ({
                label: h.hour,
                value: h.count
              }))}
            />
          </div>

          {/* Popular Categories & Best Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BestSellersChart
              title="Top 5 Best Selling Items"
              items={(current.bestSellers || []).map(item => ({
                name: item.name,
                quantity: item.qty
              }))}
            />
            <CategoryChart
              title="Sales Distribution by Category"
              categories={(current.byCategory || []).map(cat => ({
                name: cat.name,
                quantity: cat.count
              }))}
            />
          </div>

          {/* Peak Hours Heatmap Row */}
          <PeakHoursChart
            title="Hourly Customer Density"
            hours={(current.peakHours || []).map((h, i) => [i, h.count])}
          />

          {/* Data Export Panel */}
          <ExportPanel
            data={{
              range,
              from: customRange.from,
              to: customRange.to,
              summary: {
                revenue: current.totalRevenue,
                orders: current.totalOrders,
                averageOrder: current.avgOrderValue,
                popularItems: current.bestSellers
              },
              orders: filtered
            }}
          />
        </>
      )}
    </div>
  );
}
