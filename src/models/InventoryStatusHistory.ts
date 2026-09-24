import type { InventoryStatus } from './InventoryStatus';

export interface InventoryStatusHistory {
  id: number;
  inventory_item_id: number;
  status: InventoryStatus;
  changed_at: string;
  notes: string | null;
}
