import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Inbox,
  Layers,
  MessageSquareWarning,
  RefreshCw,
  UserRound
} from 'lucide-react';
import {
  listManagerNotifications,
  resolveManagerNotification
} from '../../../api/notifications.js';
import { useRealtime } from '../../../hooks/useRealtime.js';
import { formatTime, timeAgo } from '../../../utils/formatting.js';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' }
];

function statusVariant(status) {
  return status === 'open' ? 'warning' : 'success';
}

function floorLabel(value) {
  return value ? `Floor ${value}` : 'No floor';
}

function minutesOpen(notification) {
  const start = new Date(notification.createdAt).getTime();
  const end = notification.resolvedAt
    ? new Date(notification.resolvedAt).getTime()
    : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

export default function ManagerTab() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listManagerNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load manager notifications.');
      toast.error(err.message || 'Failed to load manager notifications.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleCreated = useCallback((notification) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notification.id);
      return exists
        ? prev.map((item) => (item.id === notification.id ? notification : item))
        : [notification, ...prev];
    });
    toast.warning(`${notification.staffName} requested a manager.`, 'Manager Call');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResolved = useCallback((notification) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? notification : item))
    );
  }, []);

  useRealtime({ role: 'admin' }, {
    'managerNotification.created': handleCreated,
    'managerNotification.resolved': handleResolved
  });

  const visibleNotifications = useMemo(() => {
    if (statusFilter === 'all') return notifications;
    return notifications.filter((item) => item.status === statusFilter);
  }, [notifications, statusFilter]);

  const stats = useMemo(() => {
    const open = notifications.filter((item) => item.status === 'open');
    const resolved = notifications.filter((item) => item.status === 'resolved');
    const oldestOpen = open.reduce((max, item) => Math.max(max, minutesOpen(item)), 0);
    return {
      open: open.length,
      resolved: resolved.length,
      total: notifications.length,
      oldestOpen
    };
  }, [notifications]);

  async function handleResolve(notification) {
    setResolvingId(notification.id);
    try {
      const resolved = await resolveManagerNotification(notification.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? resolved : item))
      );
      toast.success(`Manager call from ${notification.staffName} resolved.`);
    } catch (err) {
      toast.error(err.message || 'Failed to resolve notification.');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">
            Manager Dashboard
          </h2>
          <p className="text-sm text-gold-muted mt-1">
            Staff escalations and manager response history.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchNotifications}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold">
                Open Calls
              </p>
              <p className="font-display text-3xl font-bold text-rough mt-1">
                {stats.open}
              </p>
            </div>
            <BellRing size={28} className="text-gold-muted" aria-hidden="true" />
          </div>
        </Card>
        <Card className="p-4 rounded-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold">
                Resolved
              </p>
              <p className="font-display text-3xl font-bold text-rough mt-1">
                {stats.resolved}
              </p>
            </div>
            <CheckCircle2 size={28} className="text-green-600" aria-hidden="true" />
          </div>
        </Card>
        <Card className="p-4 rounded-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold">
                Oldest Open
              </p>
              <p className="font-display text-3xl font-bold text-rough mt-1">
                {stats.oldestOpen}m
              </p>
            </div>
            <Clock3 size={28} className="text-blue-600" aria-hidden="true" />
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-surface rounded-lg border border-gold-muted/30 p-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={[
              'px-4 py-2 rounded-md text-sm font-semibold transition-colors',
              statusFilter === filter.id
                ? 'bg-gold text-pale-light'
                : 'text-rough hover:bg-pale-light'
            ].join(' ')}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" text="Loading manager notifications" />
        </div>
      ) : visibleNotifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted rounded-lg">
          <Inbox size={36} className="mb-2 text-gold-muted/50" aria-hidden="true" />
          <p className="font-display font-semibold text-rough text-lg">
            No Manager Calls
          </p>
          <p className="text-sm">
            {statusFilter === 'open'
              ? 'There are no open manager calls.'
              : 'No manager calls match this filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => (
            <Card key={notification.id} className="p-4 rounded-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                    <span className="text-xs text-gold-muted">
                      {formatTime(notification.createdAt)} - {timeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-start gap-2">
                      <UserRound size={16} className="mt-0.5 text-gold" aria-hidden="true" />
                      <div>
                        <p className="text-xs uppercase font-semibold text-gold-muted">
                          Staff
                        </p>
                        <p className="font-medium text-rough">
                          {notification.staffName}
                        </p>
                        <p className="text-xs text-body">
                          {notification.staffRole || 'Staff'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Layers size={16} className="mt-0.5 text-gold" aria-hidden="true" />
                      <div>
                        <p className="text-xs uppercase font-semibold text-gold-muted">
                          Area
                        </p>
                        <p className="font-medium text-rough">
                          {floorLabel(notification.assignedFloor)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock3 size={16} className="mt-0.5 text-gold" aria-hidden="true" />
                      <div>
                        <p className="text-xs uppercase font-semibold text-gold-muted">
                          Wait
                        </p>
                        <p className="font-medium text-rough">
                          {minutesOpen(notification)} minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-pale-light/70 border border-gold-muted/25 p-3">
                    <MessageSquareWarning
                      size={16}
                      className="mt-0.5 text-gold"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-body leading-relaxed">
                      {notification.reason || 'Manager assistance requested'}
                    </p>
                  </div>
                </div>

                {notification.status === 'open' && (
                  <Button
                    size="sm"
                    icon={<CheckCircle2 size={15} />}
                    loading={resolvingId === notification.id}
                    onClick={() => handleResolve(notification)}
                    className="lg:mt-1"
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
