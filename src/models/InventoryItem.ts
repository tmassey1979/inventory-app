import type { InventoryStatus } from './InventoryStatus';

export type MarketplacePlatform =
  | 'eBay'
  | 'Facebook'
  | 'Poshmark'
  | 'Mercari'
  | 'Shopify'
  | 'Other'
  | null;

export interface InventoryPhoto {
  id: number;
  inventory_item_id: number;
  uri: string;
  sort_order: number;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  inventory_number: number;
  name: string;
  description: string | null;
  category: string | null;
  bin_location: string | null;
  status: InventoryStatus;
  purchase_cost: number | null;
  listing_price: number | null;
  sale_price: number | null;
  photo_uri: string | null;
  barcode: string | null;
  marketplace_platform: string | null;
  marketplace_url: string | null;
  fees: number | null;
  shipping_cost: number | null;
  shipping_label_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemInput {
  name: string;
  description?: string | null;
  category?: string | null;
  bin_location?: string | null;
  status?: InventoryStatus;
  purchase_cost?: number | null;
  listing_price?: number | null;
  sale_price?: number | null;
  photo_uri?: string | null;
  barcode?: string | null;
  marketplace_platform?: string | null;
  marketplace_url?: string | null;
  fees?: number | null;
  shipping_cost?: number | null;
  shipping_label_uri?: string | null;
}

export interface UpdateInventoryItemInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  bin_location?: string | null;
  purchase_cost?: number | null;
  listing_price?: number | null;
  sale_price?: number | null;
  photo_uri?: string | null;
  barcode?: string | null;
  marketplace_platform?: string | null;
  marketplace_url?: string | null;
  fees?: number | null;
  shipping_cost?: number | null;
  shipping_label_uri?: string | null;
}

export interface InventoryFilters {
  search?: string;
  status?: InventoryStatus | null;
  category?: string | null;
  bin_location?: string | null;
  sortBy?: 'inventory_number' | 'name' | 'status' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/** Net profit after fees and shipping: sale - purchase - fees - shipping */
export function computeNetProfit(item: {
  sale_price?: number | null;
  purchase_cost?: number | null;
  fees?: number | null;
  shipping_cost?: number | null;
}): number | null {
  if (item.sale_price == null || item.purchase_cost == null) return null;
  return (
    item.sale_price -
    item.purchase_cost -
    (item.fees ?? 0) -
    (item.shipping_cost ?? 0)
  );
}

export const MARKETPLACE_PLATFORMS = [
  'eBay',
  'Facebook',
  'Poshmark',
  'Mercari',
  'Shopify',
  'Other',
] as const;
