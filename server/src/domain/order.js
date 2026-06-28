export const ORDER_STATUSES = ['received', 'preparing', 'ready', 'delivered'];

export const STATUS_TRANSITIONS = {
  received: ['preparing', 'ready', 'delivered'],
  preparing: ['ready', 'delivered'],
  ready: ['delivered'],
  delivered: []
};

export function deriveFloor(tableNumber) {
  const parsed = Number(tableNumber);
  if (!Number.isInteger(parsed) || parsed < 100) {
    throw new Error('Invalid table number');
  }
  return Math.floor(parsed / 100);
}

export function isValidStatus(status) {
  return ORDER_STATUSES.includes(status);
}

export function isValidStatusTransition(currentStatus, nextStatus) {
  if (!isValidStatus(currentStatus) || !isValidStatus(nextStatus)) {
    return false;
  }
  return currentStatus === nextStatus || STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function calculateOrderTotal(items) {
  return items.reduce((total, item) => {
    const quantity = Number(item.quantity ?? item.qty);
    const price = Number(item.price ?? item.unitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
      throw new Error('Invalid order item');
    }
    return total + quantity * price;
  }, 0);
}

export function normalizeTranslations(value) {
  if (typeof value === 'string') {
    return { en: value, am: value, ar: value };
  }
  return {
    en: value?.en?.trim() || '',
    am: value?.am?.trim() || value?.en?.trim() || '',
    ar: value?.ar?.trim() || value?.en?.trim() || ''
  };
}

export function requireText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
