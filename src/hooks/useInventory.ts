import { useState, useCallback, useEffect } from 'react';
import type { InventoryItem, InventoryFilters } from '../models/InventoryItem';
import {
  searchInventory,
  getDistinctCategories,
  getDistinctBinLocations,
} from '../db/inventoryRepository';

export function useInventory(initialFilters: InventoryFilters = {}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [categories, setCategories] = useState<string[]>([]);
  const [binLocations, setBinLocations] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, cats, bins] = await Promise.all([
        searchInventory(filters),
        getDistinctCategories(),
        getDistinctBinLocations(),
      ]);
      setItems(data);
      setCategories(cats);
      setBinLocations(bins);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateFilters = useCallback((partial: Partial<InventoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    items,
    loading,
    error,
    filters,
    categories,
    binLocations,
    refresh,
    updateFilters,
    clearFilters,
  };
}
