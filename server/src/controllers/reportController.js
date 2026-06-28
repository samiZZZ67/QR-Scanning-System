import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * GET /api/reports/today  (staff)
 * Returns today's order count, revenue, active orders, and top items.
 */
export const getTodayReport = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.todayReport());
});

/**
 * Compute the [from, to] date range for a named preset.
 * Returns ISO date strings ('YYYY-MM-DD').
 */
function computeDateRange(range, from, to) {
  // Explicit dates take precedence
  if (from && to) {
    return [String(from).slice(0, 10), String(to).slice(0, 10)];
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  switch (range) {
    case 'daily': {
      return [todayStr, todayStr];
    }
    case 'weekly': {
      const day = now.getDay(); // 0=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return [monday.toISOString().slice(0, 10), todayStr];
    }
    case 'monthly': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return [firstDay.toISOString().slice(0, 10), todayStr];
    }
    case 'yearly': {
      const jan1 = new Date(now.getFullYear(), 0, 1);
      return [jan1.toISOString().slice(0, 10), todayStr];
    }
    default:
      // Fallback: last 30 days
      return [
        new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10),
        todayStr
      ];
  }
}

/**
 * Builds an analytics summary from a list of hydrated orders.
 */
function buildSummary(orders) {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const counts = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.menuItemId || item.name?.en || 'unknown';
      const existing = counts.get(key) || { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
      counts.set(key, existing);
    }
  }

  const feedbackOrders = orders.filter((o) => o.feedback);
  const ratingSum = feedbackOrders.reduce((sum, o) => sum + (o.feedback?.rating || 0), 0);

  return {
    orders: orders.length,
    revenue,
    averageOrder: orders.length ? Math.round(revenue / orders.length) : 0,
    activeOrders: orders.filter((o) => o.status !== 'delivered').length,
    feedbackCount: feedbackOrders.length,
    averageRating:
      feedbackOrders.length
        ? Number((ratingSum / feedbackOrders.length).toFixed(1))
        : 0,
    popularItems: [...counts.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  };
}

/**
 * GET /api/reports/range?range=daily|weekly|monthly|yearly&from=YYYY-MM-DD&to=YYYY-MM-DD  (staff)
 * Returns all orders in the requested date range plus an analytics summary.
 */
export const getRangeReport = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const [from, to] = computeDateRange(
    req.query.range,
    req.query.from,
    req.query.to
  );

  const orders = await repository.listOrdersInRange(from, to);
  const summary = buildSummary(orders);

  res.json({
    range: req.query.range || 'custom',
    from,
    to,
    summary,
    orders
  });
});
