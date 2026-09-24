export const INVENTORY_STATUSES = [
  'Added',
  'Listed',
  'Sold',
  'Packed',
  'Shipped',
  'Delisted',
  'Donated',
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export function isValidStatus(status: string): status is InventoryStatus {
  return (INVENTORY_STATUSES as readonly string[]).includes(status);
}

export const STATUS_COLORS: Record<InventoryStatus, string> = {
  Added: '#3B82F6',
  Listed: '#8B5CF6',
  Sold: '#10B981',
  Packed: '#F59E0B',
  Shipped: '#06B6D4',
  Delisted: '#6B7280',
  Donated: '#EC4899',
};
