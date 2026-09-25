import type { InventoryItem } from '../models/InventoryItem';

/** Net profit after fees and shipping */
export function netProfit(item: Pick<InventoryItem, 'sale_price' | 'purchase_cost' | 'fees' | 'shipping_cost'>): number | null {
  if (item.sale_price == null || item.purchase_cost == null) return null;
  return item.sale_price - item.purchase_cost - (item.fees ?? 0) - (item.shipping_cost ?? 0);
}
