import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChefHat, RefreshCw } from 'lucide-react';
import { useOrders } from '../hooks/useOrders.js';
import { useRealtime } from '../hooks/useRealtime.js';
import { updateOrderStatus } from '../api/orders.js';
import Button from '../components/ui/Button.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Notice from '../components/ui/Notice.jsx';
import { formatTime, STATUS_COLORS } from '../utils/formatting.js';

const ACTIVE_STATUSES = ['received', 'preparing'];
const nextStatus = { received: 'preparing', preparing: 'ready' };
const nextLabel = { received: 'Start Preparing', preparing: 'Mark Ready' };

function itemName(item) {
  return typeof item.name === 'object' ? item.name.en : item.name || `Item #${item.menuItemId}`;
}

export default function KitchenPage() {
  const { orders, setOrders, loading, error, refresh } = useOrders({
    status: ACTIVE_STATUSES.join(',')
  });
  const [notice, setNotice] = useState(null);
  const [updating, setUpdating] = useState(null);

  const handleOrderChange = useCallback((order) => {
    setOrders((prev) => {
      const exists = prev.some((item) => item.id === order.id);
      const next = exists
        ? prev.map((item) => (item.id === order.id ? order : item))
        : [order, ...prev];
      return next.filter((item) => ACTIVE_STATUSES.includes(item.status));
    });
  }, [setOrders]);

  useRealtime({ role: 'kitchen' }, {
    'order.created': handleOrderChange,
    'order.statusChanged': handleOrderChange,
  });

  async function advance(order) {
    const next = nextStatus[order.status];
    if (!next) return;
    setUpdating(order.id);
    try {
      await updateOrderStatus(order.id, next);
      setOrders((prev) =>
        prev
          .map((item) => (item.id === order.id ? { ...item, status: next } : item))
          .filter((item) => ACTIVE_STATUSES.includes(item.status))
      );
      setNotice({ type: 'success', message: `Order #${order.id} marked as ${next}.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-rough">Kitchen Display</h1>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {notice && <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}
      {error && <Notice type="error" message={error} />}

      {loading ? (
        <div className="py-6">
          <LoadingSpinner size="sm" text="Loading orders" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gold-muted">
          <ChefHat size={38} className="mx-auto mb-3 text-gold-muted/50" aria-hidden="true" />
          <p className="font-medium">No active orders right now</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="bg-surface rounded-lg border border-gold-muted/40 shadow-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-rough">Table {order.tableNumber}</p>
                    <p className="text-xs text-gold-muted">{formatTime(order.createdAt)}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                </div>

                <ul className="divide-y divide-gold-muted/20 text-sm">
                  {(order.items || []).map((item, index) => (
                    <li key={index} className="py-1.5 flex justify-between gap-2">
                      <span className="text-body">{itemName(item)}</span>
                      <span className="font-semibold text-rough shrink-0">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>

                {nextStatus[order.status] && (
                  <Button
                    size="sm"
                    className="w-full"
                    loading={updating === order.id}
                    onClick={() => advance(order)}
                  >
                    {nextLabel[order.status]}
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

