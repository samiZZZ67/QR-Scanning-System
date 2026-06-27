function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date) {
  const next = new Date(startOfWeek(date));
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function getRangeBounds(range, customRange, now) {
  const base = now ? new Date(now) : new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(base), end: endOfDay(base) };
    case "weekly":
      return { start: startOfWeek(base), end: endOfWeek(base) };
    case "monthly":
      return { start: startOfMonth(base), end: endOfMonth(base) };
    case "yearly":
      return { start: startOfYear(base), end: endOfYear(base) };
    case "custom": {
      if (!customRange?.from || !customRange?.to) return { start: null, end: null };
      const from = parseDate(customRange.from);
      const to = parseDate(customRange.to);
      return { start: from ? startOfDay(from) : null, end: to ? endOfDay(to) : null };
    }
    default:
      return { start: null, end: null };
  }
}

function getPreviousRange(range, customRange, now) {
  const base = now ? new Date(now) : new Date();
  const current = getRangeBounds(range, customRange, base);
  if (!current.start || !current.end) return { start: null, end: null };
  const span = current.end.getTime() - current.start.getTime();
  return { start: new Date(current.start.getTime() - span - 24 * 60 * 60 * 1000), end: new Date(current.start.getTime() - 24 * 60 * 60 * 1000) };
}

function inRange(date, start, end) {
  if (!date || !start || !end) return false;
  return date >= start && date <= end;
}

function sumItems(items = []) {
  return items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
}

function displayName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.en || value.am || value.ar || value.name || "";
  }
  return "";
}

function buildAnalytics(orders = [], range = "today", customRange = null, compare = false, now = new Date()) {
  const bounds = getRangeBounds(range, customRange, now);
  const comparisonBounds = compare ? getPreviousRange(range, customRange, now) : null;

  const filteredOrders = (orders || []).filter((order) => {
    const created = parseDate(order.createdAt || order.created_at || order.updatedAt || order.updated_at);
    return created && inRange(created, bounds.start, bounds.end);
  });

  const comparisonOrders = comparisonBounds?.start && comparisonBounds?.end
    ? (orders || []).filter((order) => {
        const created = parseDate(order.createdAt || order.created_at || order.updatedAt || order.updated_at);
        return created && inRange(created, comparisonBounds.start, comparisonBounds.end);
      })
    : [];

  const revenue = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const sales = filteredOrders.reduce((sum, order) => sum + sumItems(order.items || []), 0);
  const grossProfit = Math.max(0, revenue * 0.65);
  const netProfit = Math.max(0, grossProfit);
  const ordersCount = filteredOrders.length;
  const averageOrderValue = ordersCount ? revenue / ordersCount : 0;
  const customers = new Set(filteredOrders.map((order) => order.tableNumber)).size;
  const returningCustomers = filteredOrders.filter((order) => order.tableNumber && filteredOrders.filter((entry) => entry.tableNumber === order.tableNumber).length > 1).length;
  const completedOrders = filteredOrders.filter((order) => order.status === "delivered").length;
  const pendingOrders = filteredOrders.filter((order) => order.status !== "delivered").length;
  const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled").length;

  const itemCounts = new Map();
  filteredOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const rawName = item.name || item.menuItemName || item.menuItemId;
      const key = displayName(rawName) || String(rawName ?? "");
      const previous = itemCounts.get(key) || { name: key, quantity: 0 };
      previous.quantity += Number(item.quantity) || 0;
      itemCounts.set(key, previous);
    });
  });

  const categoryCounts = new Map();
  filteredOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = displayName(item.category || item.categoryName) || "General";
      const previous = categoryCounts.get(key) || { name: key, quantity: 0 };
      previous.quantity += Number(item.quantity) || 0;
      categoryCounts.set(key, previous);
    });
  });

  const hours = new Map();
  filteredOrders.forEach((order) => {
    const created = parseDate(order.createdAt || order.created_at || order.updatedAt || order.updated_at);
    if (created) {
      const hour = created.getHours();
      hours.set(hour, (hours.get(hour) || 0) + 1);
    }
  });

  const chartData = {
    revenue: filteredOrders.map((order) => ({ label: order.id, value: Number(order.total) || 0 })),
    sales: filteredOrders.map((order) => ({ label: order.id, value: sumItems(order.items || []) })),
    orders: filteredOrders.map((order) => ({ label: order.id, value: 1 }))
  };

  const summary = {
    totalRevenue: revenue,
    totalProfit: grossProfit,
    grossProfit,
    netProfit,
    totalSales: sales,
    totalOrders: ordersCount,
    averageOrderValue,
    totalCustomers: customers,
    returningCustomers,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    bestSellingItems: [...itemCounts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    leastSellingItems: [...itemCounts.values()].sort((a, b) => a.quantity - b.quantity).slice(0, 5),
    categories: [...categoryCounts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    peakOrderingHours: [...hours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    averagePreparationTime: filteredOrders.length ? Math.round(filteredOrders.reduce((sum, order) => sum + (Number(order.prepMinutes) || 0), 0) / filteredOrders.length) : 0
  };

  const comparison = compare ? {
    revenueDifference: revenue - comparisonOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    profitDifference: grossProfit - comparisonOrders.reduce((sum, order) => sum + (Number(order.total) || 0) * 0.65, 0),
    salesDifference: sales - comparisonOrders.reduce((sum, order) => sum + sumItems(order.items || []), 0),
    orderDifference: ordersCount - comparisonOrders.length,
    customerDifference: customers - new Set(comparisonOrders.map((order) => order.tableNumber)).size,
    percentageChange: comparisonOrders.length ? ((ordersCount - comparisonOrders.length) / comparisonOrders.length) * 100 : 0
  } : null;

  return { summary, comparison, chartData, orders: filteredOrders, comparisonOrders };
}

export { buildAnalytics };
export default buildAnalytics;
