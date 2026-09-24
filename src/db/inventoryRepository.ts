import { getDatabase } from './database';
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryFilters,
} from '../models/InventoryItem';
import type { InventoryStatusHistory } from '../models/InventoryStatusHistory';
import type { InventoryStatus } from '../models/InventoryStatus';
import { isValidStatus } from '../models/InventoryStatus';
import { nowISO } from '../utils/dates';
import { deleteInventoryPhoto } from '../services/imageStorage';

export interface DashboardStats {
  total: number;
  byStatus: Record<InventoryStatus, number>;
  totalPurchaseCost: number;
  currentListedValue: number;
  totalSales: number;
  actualProfit: number;
}

export async function getNextInventoryNumber(): Promise<number> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ inventory_number: number }>(
    'SELECT inventory_number FROM inventory_items ORDER BY inventory_number ASC'
  );
  const used = new Set(rows.map((r) => r.inventory_number));
  for (let n = 1; n <= 9999; n++) {
    if (!used.has(n)) {
      return n;
    }
  }
  throw new Error(
    'All inventory numbers (0001–9999) are assigned. Delete an item to free a number.'
  );
}

export async function createInventoryItem(
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  if (!input.name || input.name.trim() === '') {
    throw new Error('Name is required');
  }
  if (
    input.purchase_cost != null &&
    (input.purchase_cost < 0 || isNaN(input.purchase_cost))
  ) {
    throw new Error('Purchase cost must be >= 0');
  }
  if (
    input.listing_price != null &&
    (input.listing_price < 0 || isNaN(input.listing_price))
  ) {
    throw new Error('Listing price must be >= 0');
  }
  if (
    input.sale_price != null &&
    (input.sale_price < 0 || isNaN(input.sale_price))
  ) {
    throw new Error('Sale price must be >= 0');
  }

  const status: InventoryStatus = input.status ?? 'Added';
  if (!isValidStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const database = await getDatabase();
  const inventoryNumber = await getNextInventoryNumber();
  const now = nowISO();
  let itemId = 0;

  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      `INSERT INTO inventory_items (
        inventory_number, name, description, category, bin_location,
        status, purchase_cost, listing_price, sale_price, photo_uri,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inventoryNumber,
        input.name.trim(),
        input.description?.trim() || null,
        input.category?.trim() || null,
        input.bin_location?.trim() || null,
        status,
        input.purchase_cost ?? null,
        input.listing_price ?? null,
        input.sale_price ?? null,
        input.photo_uri ?? null,
        now,
        now,
      ]
    );
    itemId = result.lastInsertRowId;

    await database.runAsync(
      `INSERT INTO inventory_status_history (
        inventory_item_id, status, changed_at, notes
      ) VALUES (?, ?, ?, ?)`,
      [itemId, status, now, 'Item created']
    );
  });

  const item = await getInventoryItem(itemId);
  if (!item) throw new Error('Failed to retrieve created item');
  return item;
}

export async function getInventoryItem(
  id: number
): Promise<InventoryItem | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<InventoryItem>(
    'SELECT * FROM inventory_items WHERE id = ?',
    [id]
  );
  return row ?? null;
}

export async function updateInventoryItem(
  id: number,
  input: UpdateInventoryItemInput
): Promise<InventoryItem> {
  const existing = await getInventoryItem(id);
  if (!existing) throw new Error(`Item with id ${id} not found`);

  if (input.name !== undefined && input.name.trim() === '') {
    throw new Error('Name is required');
  }
  if (
    input.purchase_cost != null &&
    (input.purchase_cost < 0 || isNaN(input.purchase_cost))
  ) {
    throw new Error('Purchase cost must be >= 0');
  }
  if (
    input.listing_price != null &&
    (input.listing_price < 0 || isNaN(input.listing_price))
  ) {
    throw new Error('Listing price must be >= 0');
  }
  if (
    input.sale_price != null &&
    (input.sale_price < 0 || isNaN(input.sale_price))
  ) {
    throw new Error('Sale price must be >= 0');
  }

  const database = await getDatabase();
  const now = nowISO();

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  const description =
    input.description !== undefined
      ? input.description?.trim() || null
      : existing.description;
  const category =
    input.category !== undefined
      ? input.category?.trim() || null
      : existing.category;
  const bin_location =
    input.bin_location !== undefined
      ? input.bin_location?.trim() || null
      : existing.bin_location;
  const purchase_cost =
    input.purchase_cost !== undefined
      ? input.purchase_cost
      : existing.purchase_cost;
  const listing_price =
    input.listing_price !== undefined
      ? input.listing_price
      : existing.listing_price;
  const sale_price =
    input.sale_price !== undefined ? input.sale_price : existing.sale_price;
  const photo_uri =
    input.photo_uri !== undefined ? input.photo_uri : existing.photo_uri;

  await database.runAsync(
    `UPDATE inventory_items SET
      name = ?, description = ?, category = ?, bin_location = ?,
      purchase_cost = ?, listing_price = ?, sale_price = ?, photo_uri = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      name,
      description,
      category,
      bin_location,
      purchase_cost,
      listing_price,
      sale_price,
      photo_uri,
      now,
      id,
    ]
  );

  const item = await getInventoryItem(id);
  if (!item) throw new Error('Failed to retrieve updated item');
  return item;
}

export async function updateInventoryStatus(
  id: number,
  status: InventoryStatus,
  notes?: string | null
): Promise<InventoryItem> {
  if (!isValidStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const existing = await getInventoryItem(id);
  if (!existing) throw new Error(`Item with id ${id} not found`);

  const database = await getDatabase();
  const now = nowISO();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'UPDATE inventory_items SET status = ?, updated_at = ? WHERE id = ?',
      [status, now, id]
    );
    await database.runAsync(
      `INSERT INTO inventory_status_history (
        inventory_item_id, status, changed_at, notes
      ) VALUES (?, ?, ?, ?)`,
      [id, status, now, notes?.trim() || null]
    );
  });

  const item = await getInventoryItem(id);
  if (!item) throw new Error('Failed to retrieve updated item');
  return item;
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const existing = await getInventoryItem(id);
  if (!existing) throw new Error(`Item with id ${id} not found`);

  const database = await getDatabase();

  if (existing.photo_uri) {
    try {
      await deleteInventoryPhoto(existing.photo_uri);
    } catch (e) {
      console.warn('Failed to delete photo file (continuing):', e);
    }
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'DELETE FROM inventory_status_history WHERE inventory_item_id = ?',
      [id]
    );
    await database.runAsync('DELETE FROM inventory_items WHERE id = ?', [id]);
  });
}

export async function getInventoryHistory(
  itemId: number
): Promise<InventoryStatusHistory[]> {
  const database = await getDatabase();
  return database.getAllAsync<InventoryStatusHistory>(
    `SELECT * FROM inventory_status_history
     WHERE inventory_item_id = ?
     ORDER BY changed_at ASC`,
    [itemId]
  );
}

export async function searchInventory(
  filters: InventoryFilters = {}
): Promise<InventoryItem[]> {
  const database = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      `(CAST(inventory_number AS TEXT) LIKE ? OR name LIKE ? OR description LIKE ? OR category LIKE ? OR bin_location LIKE ? OR printf('%04d', inventory_number) LIKE ?)`
    );
    params.push(term, term, term, term, term, term);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.bin_location) {
    conditions.push('bin_location = ?');
    params.push(filters.bin_location);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortBy = filters.sortBy ?? 'inventory_number';
  const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const allowedSort = [
    'inventory_number',
    'name',
    'status',
    'created_at',
    'updated_at',
  ];
  const safeSort = allowedSort.includes(sortBy) ? sortBy : 'inventory_number';

  let sql = `SELECT * FROM inventory_items ${where} ORDER BY ${safeSort} ${sortOrder}`;
  if (filters.limit != null) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
    if (filters.offset != null) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return database.getAllAsync<InventoryItem>(sql, params);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const database = await getDatabase();

  const totalRow = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM inventory_items'
  );
  const total = totalRow?.count ?? 0;

  const statusRows = await database.getAllAsync<{
    status: string;
    count: number;
  }>('SELECT status, COUNT(*) as count FROM inventory_items GROUP BY status');

  const byStatus: Record<InventoryStatus, number> = {
    Added: 0,
    Listed: 0,
    Sold: 0,
    Packed: 0,
    Shipped: 0,
    Delisted: 0,
    Donated: 0,
  };
  for (const row of statusRows) {
    if (isValidStatus(row.status)) {
      byStatus[row.status] = row.count;
    }
  }

  const costRow = await database.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(purchase_cost) as total FROM inventory_items WHERE purchase_cost IS NOT NULL'
  );
  const totalPurchaseCost = costRow?.total ?? 0;

  const listedRow = await database.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(listing_price) as total FROM inventory_items
     WHERE status = 'Listed' AND listing_price IS NOT NULL`
  );
  const currentListedValue = listedRow?.total ?? 0;

  const salesRow = await database.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(sale_price) as total FROM inventory_items
     WHERE status IN ('Sold', 'Packed', 'Shipped') AND sale_price IS NOT NULL`
  );
  const totalSales = salesRow?.total ?? 0;

  const profitRow = await database.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(sale_price - purchase_cost) as total FROM inventory_items
     WHERE status IN ('Sold', 'Packed', 'Shipped')
       AND sale_price IS NOT NULL
       AND purchase_cost IS NOT NULL`
  );
  const actualProfit = profitRow?.total ?? 0;

  return {
    total,
    byStatus,
    totalPurchaseCost,
    currentListedValue,
    totalSales,
    actualProfit,
  };
}

export async function getDistinctCategories(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ category: string }>(
    `SELECT DISTINCT category FROM inventory_items
     WHERE category IS NOT NULL AND category != ''
     ORDER BY category ASC`
  );
  return rows.map((r) => r.category);
}

export async function getDistinctBinLocations(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ bin_location: string }>(
    `SELECT DISTINCT bin_location FROM inventory_items
     WHERE bin_location IS NOT NULL AND bin_location != ''
     ORDER BY bin_location ASC`
  );
  return rows.map((r) => r.bin_location);
}

export async function seedDevelopmentData(): Promise<number> {
  return 0;
}
