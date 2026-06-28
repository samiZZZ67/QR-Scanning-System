import { useState, useCallback } from "react";
import { listOrders, updateOrderStatus } from "../api/orders.js";

/**
 * Manage orders list with optional param filtering.
 *
 * @param {object} defaultParams  URLSearchParams-compatible object
 */
export function useOrders(defaultParams = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(
    async (overrideParams) => {
      setLoading(true);
      setError(null);
      try {
        const params = overrideParams ?? defaultParams;
        const data = await listOrders(params);
        const list = Array.isArray(data) ? data : data?.orders || [];
        setOrders(list);
      } catch (e) {
        setError(e.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(defaultParams)],
  );

  const updateStatus = useCallback(
    async (id, status) => {
      await updateOrderStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  return { orders, loading, error, refresh, updateStatus };
}
