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

/** Primary resale path: Added → Listed → Sold → Packed → Shipped */
export const MAIN_WORKFLOW: InventoryStatus[] = [
  'Added',
  'Listed',
  'Sold',
  'Packed',
  'Shipped',
];

/** Next status along the main workflow, or null if at the end / off-path. */
export function getNextMainStatus(
  status: InventoryStatus
): InventoryStatus | null {
  const idx = MAIN_WORKFLOW.indexOf(status);
  if (idx < 0 || idx >= MAIN_WORKFLOW.length - 1) return null;
  return MAIN_WORKFLOW[idx + 1];
}

/** Suggested quick-action targets for swipe / menus. */
export function getQuickStatusTargets(
  status: InventoryStatus
): InventoryStatus[] {
  const map: Record<InventoryStatus, InventoryStatus[]> = {
    Added: ['Listed', 'Donated', 'Delisted'],
    Listed: ['Sold', 'Delisted', 'Donated'],
    Sold: ['Packed'],
    Packed: ['Shipped'],
    Shipped: [],
    Delisted: ['Listed'],
    Donated: [],
  };
  return map[status] ?? [];
}
