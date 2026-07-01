import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, RefreshCw, Phone, FileText, ChefHat } from 'lucide-react';
import { useOrders } from '../hooks/useOrders.js';
import { useRealtime } from '../hooks/useRealtime.js';
import { updateOrderStatus } from '../api/orders.js';
import { listServiceNotifications, resolveServiceNotification } from '../api/notifications.js';
import Button from '../components/ui/Button.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Notice from '../components/ui/Notice.jsx';
import CallManagerButton from '../components/staff/CallManagerButton.jsx';
import { formatTime, STATUS_COLORS } from '../utils/formatting.js';

function itemName(item) {
  return typeof item.name === 'object' ? item.name.en : item.name || `Item #${item.menuItemId}`;
}

export default function WaiterPage() {
  const { orders, setOrders, loading, error, refresh } = useOrders({ status: 'ready' });
  const [notifications, setNotifications] = useState([]);
  const [kitchenCalls, setKitchenCalls] = useState([]);   // kitchen-initiated calls
  const [notice, setNotice] = useState(null);
  const [delivering, setDelivering] = useState(null);

  // Load open service notifications on mount
  useEffect(() => {
    listServiceNotifications({ status: 'open' })
      .then((data) => {
        // Separate kitchen calls from regular service requests
        const kitchenItems = (data || []).filter(
          (n) => n.type === 'call-waiter' && n.locationType === 'kitchen'
        );
        const regularItems = (data || []).filter(
          (n) => !(n.type === 'call-waiter' && n.locationType === 'kitchen')
        );
        setKitchenCalls(kitchenItems);
        setNotifications(regularItems);
      })
      .catch(() => {});
  }, []);

  const handleOrderChange = useCallback((order) => {
    setOrders((prev) => {
      const exists = prev.some((item) => item.id === order.id);
      if (order.status !== 'ready') return prev.filter((item) => item.id !== order.id);
      return exists
        ? prev.map((item) => (item.id === order.id ? order : item))
        : [order, ...prev];
    });
  }, [setOrders]);

  const handleServiceRequest = useCallback((notification) => {
    // Regular service request (call-waiter from table, or request-bill)
    if (notification.type === 'call-waiter' && notification.locationType === 'kitchen') {
      // Kitchen calls land in kitchenCalls via kitchenCallWaiter event — ignore here
      return;
    }
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const handleKitchenCall = useCallback((notification) => {
    setKitchenCalls((prev) => {
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
  }, []);

  useRealtime({ role: 'waiter' }, {
    'order.statusChanged': handleOrderChange,
    'serviceNotification.created': handleServiceRequest,
    'kitchenCallWaiter': handleKitchenCall,
  });

  async function markDelivered(order) {
    setDelivering(order.id);
    try {
      await updateOrderStatus(order.id, 'delivered');
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      setNotice({ type: 'success', message: `Order #${order.id} delivered.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setDelivering(null);
    }
  }

  async function resolveNotification(id) {
    try {
      await resolveServiceNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to resolve request.' });
    }
  }

  async function acknowledgeKitchenCall(id) {
    try {
      await resolveServiceNotification(id);
      setKitchenCalls((prev) => prev.filter((item) => item.id !== id));
      setNotice({ type: 'success', message: 'Kitchen call acknowledged.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to acknowledge.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-rough">Waiter Panel</h1>
        <div className="flex flex-wrap items-center gap-2">
          <CallManagerButton staffRole="Waiter" onNotice={setNotice} />
          <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {notice && <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}
      {error && <Notice type="error" message={error} />}

      {/* ── Kitchen calls ────────────────────────────────────────────────── */}
      {kitchenCalls.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-rough flex items-center gap-2">
            <ChefHat size={16} className="text-orange-500" aria-hidden="true" />
            Kitchen Calls ({kitchenCalls.length})
          </h2>
          <AnimatePresence>
            {kitchenCalls.map((call) => (
              <motion.div
                key={call.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded shrink-0">
                    <ChefHat size={16} className="text-orange-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">
                      Kitchen is calling
                      {call.targetWaiterName && (
                        <span className="ml-1 font-normal text-orange-700">→ {call.targetWaiterName}</span>
                      )}
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      {call.note || call.reason || 'Food is ready for pickup'}
                    </p>
                    <p className="text-xs text-orange-500 mt-0.5">{formatTime(call.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeKitchenCall(call.id)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 transition-colors px-2 py-1 rounded hover:bg-green-50"
                >
                  <CheckCircle2 size={14} />
                  Done
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}

      {/* ── Customer service requests (call waiter / bill) ───────────────── */}
      {notifications.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-rough flex items-center gap-2">
            <Bell size={16} className="text-gold" aria-hidden="true" />
            Service Requests ({notifications.length})
          </h2>
          {notifications.map((notification) => {
            const isWaiterCall = notification.type === 'call-waiter';
            const label = isWaiterCall ? 'Waiter Called' : 'Bill Requested';
            const Icon = isWaiterCall ? Phone : FileText;
            return (
              <div
                key={notification.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded">
                    <Icon size={16} className="text-amber-900" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Table {notification.tableNumber}</p>
                    <p className="text-xs text-amber-700">{label}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => resolveNotification(notification.id)}>
                  Resolve
                </Button>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Ready to deliver ─────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display font-semibold text-rough mb-3">Ready to Deliver</h2>
        {loading ? (
          <LoadingSpinner size="sm" text="Loading ready orders" />
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gold-muted">
            <CheckCircle2 size={34} className="mx-auto mb-2 text-gold-muted/50" aria-hidden="true" />
            <p className="font-medium">No orders ready for delivery</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-surface rounded-lg border border-gold-muted/40 shadow-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-rough">Table {order.tableNumber}</p>
                      <p className="text-xs text-gold-muted">{formatTime(order.createdAt)}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS.ready}`}>
                      Ready
                    </span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {(order.items || []).map((item, index) => (
                      <li key={index} className="flex justify-between text-body gap-3">
                        <span>{itemName(item)}</span>
                        <span className="font-semibold">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="w-full"
                    loading={delivering === order.id}
                    onClick={() => markDelivered(order)}
                  >
                    Mark Delivered
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
