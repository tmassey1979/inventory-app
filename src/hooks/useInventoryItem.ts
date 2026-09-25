import { useState, useCallback, useEffect } from 'react';
import type { InventoryItem, InventoryPhoto } from '../models/InventoryItem';
import type { InventoryStatusHistory } from '../models/InventoryStatusHistory';
import {
  getInventoryItem,
  getInventoryHistory,
  getPhotosForItem,
} from '../db/inventoryRepository';

export function useInventoryItem(id: number | null) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryStatusHistory[]>([]);
  const [photos, setPhotos] = useState<InventoryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id == null) {
      setItem(null);
      setHistory([]);
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [itemData, historyData, photoData] = await Promise.all([
        getInventoryItem(id),
        getInventoryHistory(id),
        getPhotosForItem(id),
      ]);
      setItem(itemData);
      setHistory(historyData);
      setPhotos(photoData);
      if (!itemData) setError('Item not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { item, history, photos, loading, error, refresh };
}
