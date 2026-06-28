import React, { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Image,
  LayoutDashboard,
  MessageSquare,
  QrCode,
  ShoppingBag,
  Tag,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import StaffLoginGate from '../../components/auth/StaffLoginGate.jsx';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

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

export default function AdminPage() {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    document.title = 'Admin Panel - Habesha Grand Hotel';
  }, []);

  if (!isAuthenticated || (role && role !== 'Admin')) {
    return <StaffLoginGate role="Admin" title="Admin Access" />;
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab] || DashboardTab;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS}>
      <Suspense fallback={<LoadingSpinner size="sm" text="Loading section" />}>
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

