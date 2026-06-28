import { useMemo } from "react";
import { buildAnalytics } from "../utils/analytics.js";

/**
 * Derive analytics from a flat orders array.
 * Re-computes only when orders, range, customRange, or compare change.
 *
 * @param {Array}   orders
 * @param {string}  range        'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
 * @param {object}  customRange  { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 * @param {boolean} compare
 * @returns {{ current, previous, deltas, filtered }}
 */
export function useAnalytics(
  orders = [],
  range = "weekly",
  customRange = {},
  compare = false,
) {
  return useMemo(
    () => buildAnalytics(orders, range, customRange, compare),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, range, JSON.stringify(customRange), compare],
  );
}
