import { useState, useCallback, useEffect } from "react";
import { getMenu } from "../api/menu.js";

/**
 * Fetch and cache menu data (categories + items).
 *
 * @param {boolean} includeUnavailable  Include items marked unavailable
 */
export function useMenu(includeUnavailable = false) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMenu(includeUnavailable);
      setCategories(data?.categories || []);
      setItems(data?.items || []);
    } catch (e) {
      setError(e.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [includeUnavailable]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { menu: { categories, items }, categories, items, loading, error, refresh };
}
