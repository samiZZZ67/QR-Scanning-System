import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, Tag, QrCode,
  ShoppingBag, MessageSquare, Image, Bot, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import Button from '../../components/ui/Button.jsx';

const DashboardTab = React.lazy(() => import('./dashboard/index.jsx'));
const MenuTab = React.lazy(() => import('./menu/index.jsx'));
const CategoriesTab = React.lazy(() => import('./categories/index.jsx'));
const TablesTab = React.lazy(() => import('./tables/index.jsx'));
const OrdersTab = React.lazy(() => import('./orders/index.jsx'));
const FeedbackTab = React.lazy(() => import('./feedback/index.jsx'));
const AssetsTab = React.lazy(() => import('./assets/index.jsx'));
const AITab = React.lazy(() => import('./ai/index.jsx'));

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'tables', label: 'Tables & QR', icon: QrCode },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'assets', label: 'Assets', icon: Image },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
];

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  menu: MenuTab,
  categories: CategoriesTab,
  tables: TablesTab,
  orders: OrdersTab,
  feedback: FeedbackTab,
  assets: AssetsTab,
  ai: AITab,
};

function LoginGate() {
  const { authenticate } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) { setError('PIN is required'); return; }
    setLoading(true);
    setError('');
    try {
      const ok = await authenticate(pin, 'Admin');
      if (!ok) setError('Invalid PIN. Please try again.');
    } catch {
      setError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-rough flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="text-5xl" aria-hidden="true">🏨</span>
          <h1 className="font-display text-2xl font-bold text-pale mt-3">Admin Access</h1>
          <p className="text-sm text-pale/50 mt-1">Enter your staff PIN to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-pale-light/10 backdrop-blur-sm rounded-2xl border border-pale/15 p-6 space-y-4"
          aria-label="Admin login"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 p-3 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pale/40" />
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              required
              className="w-full bg-pale/10 border border-pale/20 rounded-xl pl-10 pr-4 py-3 text-pale placeholder:text-pale/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    document.title = 'Admin Panel — Habesha Grand Hotel';
  }, []);

  if (!isAuthenticated) return <LoginGate />;

  const ActiveComponent = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS.dashboard;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS}>
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </AdminLayout>
  );
}
