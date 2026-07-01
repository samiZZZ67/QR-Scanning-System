import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChefHat, RefreshCw, Phone, Send, User, Loader2 } from 'lucide-react';
import { useOrders } from '../hooks/useOrders.js';
import { useRealtime } from '../hooks/useRealtime.js';
import { updateOrderStatus } from '../api/orders.js';
import { createServiceNotification } from '../api/notifications.js';
import { listStaffMembers } from '../api/staff.js';
import Button from '../components/ui/Button.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Notice from '../components/ui/Notice.jsx';
import Modal from '../components/ui/Modal.jsx';
import CallManagerButton from '../components/staff/CallManagerButton.jsx';
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

  // ── Call Waiter modal state ────────────────────────────────────────────
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [waiters, setWaiters] = useState([]);
  const [waitersLoading, setWaitersLoading] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState(null);
  const [callReason, setCallReason] = useState('');
  const [callSubmitting, setCallSubmitting] = useState(false);

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

  // ── Open the waiter-selection modal ────────────────────────────────────
  async function openWaiterModal() {
    setWaiterModalOpen(true);
    setSelectedWaiterId(null);
    setCallReason('');
    setWaitersLoading(true);
    try {
      const all = await listStaffMembers();
      // Show only Waiter-role staff (active; online first)
      const waiterList = (Array.isArray(all) ? all : [])
        .filter((s) => s.role === 'Waiter' && s.active !== false && s.active !== 0)
        .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
      setWaiters(waiterList);
    } catch {
      setNotice({ type: 'error', message: 'Could not load waiters. Try again.' });
      setWaiterModalOpen(false);
    } finally {
      setWaitersLoading(false);
    }
  }

  // ── Send notification to selected waiter ───────────────────────────────
  async function handleCallWaiter(e) {
    e.preventDefault();
    if (!selectedWaiterId) return;
    const waiter = waiters.find((w) => w.id === selectedWaiterId);
    if (!waiter) return;

    setCallSubmitting(true);
    try {
      await createServiceNotification({
        type: 'call-waiter',
        tableNumber: 0,
        locationType: 'kitchen',
        reason: callReason.trim() || 'Food is ready for pickup',
        targetWaiterName: waiter.name,
        targetWaiterId: waiter.id,
      });
      setNotice({ type: 'success', message: `${waiter.name} has been notified!` });
      setWaiterModalOpen(false);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to call waiter.' });
    } finally {
      setCallSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-rough">Kitchen Display</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Phone size={15} />}
            onClick={openWaiterModal}
          >
            Call Waiter
          </Button>
          <CallManagerButton staffRole="Kitchen" onNotice={setNotice} />
          <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={refresh}>
            Refresh
          </Button>
        </div>
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
                    <li key={index} className="py-2 flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-body">{itemName(item)}</span>
                        {item.note && (
                          <p className="text-xs text-gold-muted italic mt-0.5">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
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

      {/* ── Call Waiter Modal ──────────────────────────────────────────────── */}
      <Modal
        open={waiterModalOpen}
        onClose={() => setWaiterModalOpen(false)}
        title="Call a Waiter"
        size="sm"
      >
        {waitersLoading ? (
          <div className="flex items-center justify-center py-8 gap-3 text-gold-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading waiters…</span>
          </div>
        ) : waiters.length === 0 ? (
          <div className="text-center py-8 text-gold-muted">
            <User size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No waiters available</p>
            <p className="text-xs mt-1">Make sure waiter staff are registered in the system.</p>
          </div>
        ) : (
          <form onSubmit={handleCallWaiter} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-rough mb-2">Select a waiter to notify:</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {waiters.map((w) => (
                  <label
                    key={w.id}
                    className={[
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                      selectedWaiterId === w.id
                        ? 'border-gold bg-gold/10 text-rough'
                        : 'border-gold-muted/40 hover:border-gold/60 hover:bg-pale/30',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="waiter"
                      value={w.id}
                      checked={selectedWaiterId === w.id}
                      onChange={() => setSelectedWaiterId(w.id)}
                      className="accent-gold"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-rough">{w.name}</p>
                      <p className="text-xs text-gold-muted">
                        {w.assignedFloor ? `Floor ${w.assignedFloor} · ` : ''}
                        {w.online ? (
                          <span className="text-green-600 font-medium">● Online</span>
                        ) : (
                          <span className="text-gold-muted">○ Offline</span>
                        )}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="call-reason" className="text-sm font-medium text-rough">
                Reason <span className="text-gold-muted font-normal">(optional)</span>
              </label>
              <input
                id="call-reason"
                type="text"
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                placeholder="e.g. Table 5 order ready for pickup"
                className="w-full rounded-xl border border-gold-muted bg-surface px-3 py-2 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setWaiterModalOpen(false)}
                disabled={callSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={callSubmitting}
                disabled={!selectedWaiterId}
                icon={<Send size={15} />}
              >
                Notify Waiter
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
