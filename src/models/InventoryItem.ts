import type { InventoryStatus } from './InventoryStatus';

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
