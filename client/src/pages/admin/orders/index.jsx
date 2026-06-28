import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, ArrowRight, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { listOrders, updateOrderStatus } from '../../../api/orders.js';
import { useRealtime } from '../../../hooks/useRealtime.js';
import { formatMoney, timeAgo, STATUS_COLORS, STATUS_ORDER } from '../../../utils/formatting.js';
import Button from '../../../components/ui/Button.jsx';
import Notice from '../../../components/ui/Notice.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';

const STATUS_FILTERS = ['all', ...STATUS_ORDER, 'cancelled'];

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      const data = await listOrders(filters);
      setOrders(Array.isArray(data) ? data : data.orders || []);
      setPage(1); // reset to first page
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates
  const handleNewOrder = useCallback((order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === order.id);
      if (exists) return prev;
      return [order, ...prev];
    });
    setNotice({ type: 'info', message: `New order received from Table ${order.tableNumber}` });
  }, []);

  const handleOrderUpdate = useCallback((order) => {
    setOrders((prev) => prev.map((o) => o.id === order.id ? order : o));
  }, []);

  useRealtime({ role: 'admin' }, {
    'order.created': handleNewOrder,
    'order.statusChanged': handleOrderUpdate,
  });

  const toggleExpand = (id) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdvanceStatus = async (order, e) => {
    e.stopPropagation();
    const nextStatusMap = {
      received: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    };
    const nextStatus = nextStatusMap[order.status];
    if (!nextStatus) return;

    try {
      await updateOrderStatus(order.id, nextStatus);
      setNotice({ type: 'success', message: `Order #${order.id} advanced to ${nextStatus}` });
      fetchOrders();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update order status' });
    }
  };

  const handleCancelOrder = async (order, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to cancel order #${order.id}?`)) return;
    try {
      await updateOrderStatus(order.id, 'cancelled');
      setNotice({ type: 'success', message: `Order #${order.id} cancelled` });
      fetchOrders();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to cancel order' });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    return order.tableNumber.toString().includes(searchTerm);
  });

  // Calculate Metrics based on current orders shown
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Pagination
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Order Logs</h2>
          <p className="text-sm text-gold-muted mt-1">Monitor, accept, advance and cancel customer orders.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          className="my-3"
        />
      )}

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface p-4 rounded-xl border border-gold-muted/30">
        <div>
          <div className="text-xs text-gold font-semibold uppercase">Selected Orders Count</div>
          <div className="text-2xl font-bold text-rough font-display mt-1">{totalOrders}</div>
        </div>
        <div>
          <div className="text-xs text-gold font-semibold uppercase">Total Revenue (Non-cancelled)</div>
          <div className="text-2xl font-bold text-rough font-display mt-1">{formatMoney(totalRevenue)}</div>
        </div>
        <div>
          <div className="text-xs text-gold font-semibold uppercase">Average Ticket Value</div>
          <div className="text-2xl font-bold text-rough font-display mt-1">{formatMoney(avgOrderValue)}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-gold-muted/30">
        <div className="flex flex-wrap gap-1 flex-1">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedStatus(filter)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
                selectedStatus === filter
                  ? 'bg-gold text-pale-light'
                  : 'bg-pale text-rough hover:bg-pale-light border border-gold-muted/35'
              ].join(' ')}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-muted" />
          <input
            type="text"
            placeholder="Search by Table No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-pale-light border border-gold-muted/50 rounded-lg text-sm text-rough focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Retrieving orders database..." />
        </div>
      ) : paginatedOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="font-display font-medium text-rough text-lg">No Orders Registered</p>
          <p className="text-sm">No transactions matched the selected filter criteria.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden bg-pale-light rounded-2xl border border-gold-muted/35 shadow-card">
            <div className="divide-y divide-gold-muted/20">
              {paginatedOrders.map(order => {
                const isExpanded = expandedOrders.has(order.id);
                const nextStatusLabel = {
                  received: 'Start Preparing',
                  preparing: 'Mark Ready',
                  ready: 'Deliver Order'
                }[order.status];

                return (
                  <div key={order.id} className="hover:bg-surface/10 transition-colors">
                    {/* Row Header */}
                    <div
                      onClick={() => toggleExpand(order.id)}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-rough font-mono">
                          #{order.id}
                        </span>
                        <div>
                          <span className="font-display font-bold text-lg text-rough">
                            Table {order.tableNumber}
                          </span>
                          <span className="text-xs text-gold-muted ml-2">
                            Floor {order.floor || Math.floor(order.tableNumber / 100)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-gold-muted">
                          {timeAgo(order.createdAt)}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[order.status] || ''}`}>
                          {order.status}
                        </span>
                        <span className="font-display font-bold text-gold text-base min-w-[80px] text-right">
                          {formatMoney(order.total)}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Row Content / Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-surface/20 border-t border-gold-muted/15 space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Order Items Details</h4>
                          <ul className="divide-y divide-gold-muted/15 text-sm max-w-xl">
                            {(order.items || []).map((item, idx) => {
                              const name = typeof item.name === 'object' ? item.name.en : (item.name || `MenuItem #${item.menuItemId}`);
                              return (
                                <li key={idx} className="py-2 flex justify-between">
                                  <span className="text-body font-medium">{name}</span>
                                  <span className="text-rough font-semibold">
                                    {item.quantity || item.qty} × {formatMoney(item.price)} = {formatMoney(item.lineTotal || (item.price * (item.quantity || item.qty)))}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {order.notes && (
                          <div className="bg-pale/50 border border-gold-muted/20 p-3 rounded-lg max-w-xl">
                            <span className="text-xs font-semibold text-gold-muted uppercase">Kitchen Notes:</span>
                            <p className="text-xs text-body mt-1 leading-relaxed">{order.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {nextStatusLabel && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handleAdvanceStatus(order, e)}
                            >
                              {nextStatusLabel}
                              <ArrowRight size={14} className="ml-1" />
                            </Button>
                          )}
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => handleCancelOrder(order, e)}
                            >
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-gold-muted/30">
            <span className="text-xs text-gold-muted">
              Page <span className="font-semibold text-rough">{page}</span> of <span className="font-semibold text-rough">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
