/**
 * buildAnalytics — derive all KPI metrics and chart series from a flat order array.
 *
 * @param {Array}   orders      Raw orders from the API
 * @param {string}  range       'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
 * @param {object}  customRange { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 * @param {boolean} compare     Compute deltas vs. the equivalent previous period
 */

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getRangeBounds(range, customRange = {}) {
  const now = new Date();
  switch (range) {
    case "daily":
      return { start: startOfDay(now), end: now };
    case "weekly": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: now };
    }
    case "monthly": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: now };
    }
    case "yearly": {
      const s = new Date(now);
      s.setFullYear(s.getFullYear() - 1);
      return { start: startOfDay(s), end: now };
    }
    case "custom": {
      const start = customRange.from
        ? new Date(customRange.from + "T00:00:00")
        : new Date(0);
      const end = customRange.to ? new Date(customRange.to + "T23:59:59") : now;
      return { start, end };
    }
    default:
      return { start: new Date(0), end: now };
  }
}

function getPreviousBounds(range, customRange = {}) {
  const now = new Date();
  switch (range) {
    case "daily": {
      const s = new Date(now);
      s.setDate(s.getDate() - 1);
      return { start: startOfDay(s), end: startOfDay(now) };
    }
    case "weekly": {
      const e = new Date(now);
      e.setDate(e.getDate() - 7);
      const s = new Date(e);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: e };
    }
    case "monthly": {
      const e = new Date(now);
      e.setDate(e.getDate() - 30);
      const s = new Date(e);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: e };
    }
    case "yearly": {
      const e = new Date(now);
      e.setFullYear(e.getFullYear() - 1);
      const s = new Date(e);
      s.setFullYear(s.getFullYear() - 1);
      return { start: s, end: e };
    }
    case "custom": {
      if (!customRange.from || !customRange.to) return null;
      const from = new Date(customRange.from + "T00:00:00");
      const to = new Date(customRange.to + "T23:59:59");
      const diff = to - from;
      return { start: new Date(from - diff), end: from };
    }
    default:
      return null;
  }
}

function filterOrders(orders, start, end) {
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end;
  });
}

function buildTimeSeries(orders, range) {
  const map = new Map();
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    let key;
    if (range === "daily") {
      key = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else if (range === "yearly") {
      key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    } else {
      key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (!map.has(key)) map.set(key, { label: key, revenue: 0, orders: 0 });
    const entry = map.get(key);
    entry.revenue += o.total || 0;
    entry.orders += 1;
  });
  return Array.from(map.values());
}

function computeMetrics(orders, range) {
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const uniqueTables = new Set(orders.map((o) => o.tableNumber)).size;
  const revenueByTime = buildTimeSeries(orders, range);

  const peakHours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: 0,
  }));

  const itemMap = {};
  const catMap = {};

  orders.forEach((o) => {
    const h = new Date(o.createdAt).getHours();
    peakHours[h].count++;

    (o.items || []).forEach((item) => {
      const name =
        (typeof item.name === "object" ? item.name?.en : item.name) ||
        item.menuItemId ||
        "Unknown";
      const catName = item.categoryName || item.categoryId || "Other";
      const qty = item.quantity || 1;
      const rev = (item.price || 0) * qty;

      if (!itemMap[name]) itemMap[name] = { name, qty: 0, revenue: 0 };
      itemMap[name].qty += qty;
      itemMap[name].revenue += rev;

      if (!catMap[catName])
        catMap[catName] = { name: catName, count: 0, revenue: 0 };
      catMap[catName].count += qty;
      catMap[catName].revenue += rev;
    });
  });

  const sortedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    uniqueTables,
    revenueByTime,
    byCategory: Object.values(catMap).sort((a, b) => b.count - a.count),
    bestSellers: sortedItems.slice(0, 10),
    leastSellers:
      sortedItems.length > 5
        ? sortedItems.slice(-5).reverse()
        : [...sortedItems].reverse(),
    peakHours,
  };
}

export function buildAnalytics(
  orders = [],
  range = "weekly",
  customRange = {},
  compare = false,
) {
  const { start, end } = getRangeBounds(range, customRange);
  const filtered = filterOrders(orders, start, end);
  const current = computeMetrics(filtered, range);

  let previous = null;
  let deltas = null;

  if (compare) {
    const pb = getPreviousBounds(range, customRange);
    if (pb) {
      const prevOrders = filterOrders(orders, pb.start, pb.end);
      previous = computeMetrics(prevOrders, range);
      const pct = (curr, prev) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
      deltas = {
        totalRevenue: pct(current.totalRevenue, previous.totalRevenue),
        totalOrders: pct(current.totalOrders, previous.totalOrders),
        avgOrderValue: pct(current.avgOrderValue, previous.avgOrderValue),
        uniqueTables: pct(current.uniqueTables, previous.uniqueTables),
      };
    }
  }

  return { current, previous, deltas, filtered };
}
