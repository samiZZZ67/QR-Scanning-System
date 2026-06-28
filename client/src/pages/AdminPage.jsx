import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  QrCode,
  ShoppingBag,
  MessageSquare,
  Image,
  BarChart2,
  LogIn
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Notice from '../components/ui/Notice.jsx';
import { useOrders } from '../hooks/useOrders.js';
import { useMenu } from '../hooks/useMenu.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { StatCard } from '../components/analytics/StatCard.jsx';
import { RevenueChart } from '../components/analytics/RevenueChart.jsx';
import { BestSellersChart } from '../components/analytics/BestSellersChart.jsx';
import { CategoryChart } from '../components/analytics/CategoryChart.jsx';
import { PeakHoursChart } from '../components/analytics/PeakHoursChart.jsx';
import { formatMoney } from '../utils/formatting.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'menu',      label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'tables',    label: 'Tables',     icon: QrCode },
  { id: 'orders',    label: 'Orders',     icon: ShoppingBag },
  { id: 'feedback',  label: 'Feedback',   icon: MessageSquare },
  { id: 'assets',    label: 'Assets',     icon: Image },
  { id: 'reports',   label: 'Reports',    icon: BarChart2 }
];

/* ───── Login gate ───── */
function LoginPanel() {
  const { authenticate, isLoading, error } = useAuth();
  const [pin, setPin] = useState('');
  const [formError, setFormError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!pin.trim()) { setFormError('PIN is required'); return; }
    try {
      await authenticate(pin);
    } catch {
      setFormError('Invalid PIN. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl" aria-hidden="true">🏨</span>
          <h1 className="font-display text-2xl font-bold text-rough mt-3">Admin Access</h1>
          <p className="text-sm text-gold-muted mt-1">Enter your staff PIN to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl border border-gold-muted/40 shadow-card p-6 space-y-4"
          aria-label="Admin login"
        >
          {(error || formError) && (
            <Notice type="error" message={formError || error} />
          )}
          <Input
            label="Staff PIN"
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            required
            aria-label="Staff PIN"
          />
          <Button type="submit" size="lg" className="w-full" loading={isLoading} icon={<LogIn size={16} />}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ───── Dashboard tab ───── */
function DashboardTab() {
  const { orders, loading } = useOrders({});
  const analytics = useAnalytics(orders, 'today', null, false);
  const { summary, chartData } = analytics || {};

  if (loading) return <LoadingSpinner size="lg" text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-rough">Today's Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue"    value={summary?.totalRevenue}    format="money"  icon={BarChart2} />
        <StatCard label="Orders"     value={summary?.totalOrders}     format="number" icon={ShoppingBag} />
        <StatCard label="Avg Order"  value={summary?.averageOrderValue} format="money" icon={Tag} />
        <StatCard label="Items Sold" value={summary?.totalSales}      format="number" icon={UtensilsCrossed} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestSellersChart items={summary?.bestSellingItems || []} />
        <CategoryChart    categories={summary?.categories || []} />
      </div>

      <PeakHoursChart hours={summary?.peakOrderingHours || []} />
    </div>
  );
}

/* ───── Placeholder for other tabs ───── */
function PlaceholderTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-gold-muted gap-3">
      <span className="text-5xl">🔧</span>
      <p className="font-display font-semibold text-rough text-lg">{label}</p>
      <p className="text-sm">This section will be implemented in the next phase.</p>
    </div>
  );
}

/* ───── Main Admin Page ───── */
export default function AdminPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) return <LoginPanel />;

  const content = {
    dashboard: <DashboardTab />,
    menu:      <PlaceholderTab label="Menu Management" />,
    tables:    <PlaceholderTab label="Table & QR Management" />,
    orders:    <PlaceholderTab label="Order Management" />,
    feedback:  <PlaceholderTab label="Feedback & Reviews" />,
    assets:    <PlaceholderTab label="Asset Management" />,
    reports:   <PlaceholderTab label="Reports & Analytics" />
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS}>
      {content[activeTab] || <PlaceholderTab label={activeTab} />}
    </AdminLayout>
  );
}
