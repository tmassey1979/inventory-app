import { getDatabase } from './database';
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryFilters,
  InventoryPhoto,
} from '../models/InventoryItem';
import type { InventoryStatusHistory } from '../models/InventoryStatusHistory';
import type { InventoryStatus } from '../models/InventoryStatus';
import { isValidStatus } from '../models/InventoryStatus';
import { nowISO } from '../utils/dates';
import { deleteInventoryPhoto } from '../services/imageStorage';
export interface ImportBundle {
  items: InventoryItem[];
  history?: InventoryStatusHistory[];
  photos?: InventoryPhoto[];
  labels?: Array<{ inventory_number: number; base64: string }>;
}


export interface DashboardStats {
  total: number;
  byStatus: Record<InventoryStatus, number>;
  totalPurchaseCost: number;
  currentListedValue: number;
  totalSales: number;
  actualProfit: number;
  netProfit: number;
  toShipCount: number;
}

const ITEM_COLS = `id, inventory_number, name, description, category, bin_location,
  status, purchase_cost, listing_price, sale_price, photo_uri,
  barcode, marketplace_platform, marketplace_url, fees, shipping_cost,
  shipping_label_uri, created_at, updated_at`;

export async function getNextInventoryNumber(): Promise<number> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ inventory_number: number }>(
    'SELECT inventory_number FROM inventory_items ORDER BY inventory_number ASC'
  );
  const used = new Set(rows.map((r) => r.inventory_number));
  for (let n = 1; n <= 9999; n++) {
    if (!used.has(n)) return n;
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
  for (const [label, val] of [
    ['Purchase cost', input.purchase_cost],
    ['Listing price', input.listing_price],
    ['Sale price', input.sale_price],
    ['Fees', input.fees],
    ['Shipping cost', input.shipping_cost],
  ] as const) {
    if (val != null && (val < 0 || isNaN(val))) {
      throw new Error(`${label} must be >= 0`);
    }
  }

  const status: InventoryStatus = input.status ?? 'Added';
  if (!isValidStatus(status)) throw new Error(`Invalid status: ${status}`);

  const database = await getDatabase();
  const inventoryNumber = await getNextInventoryNumber();
  const now = nowISO();
  let itemId = 0;

  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      `INSERT INTO inventory_items (
        inventory_number, name, description, category, bin_location,
        status, purchase_cost, listing_price, sale_price, photo_uri,
        barcode, marketplace_platform, marketplace_url, fees, shipping_cost,
        shipping_label_uri, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        input.barcode?.trim() || null,
        input.marketplace_platform?.trim() || null,
        input.marketplace_url?.trim() || null,
        input.fees ?? null,
        input.shipping_cost ?? null,
        input.shipping_label_uri ?? null,
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
    if (input.photo_uri) {
      await database.runAsync(
        `INSERT INTO inventory_photos (inventory_item_id, uri, sort_order, created_at)
         VALUES (?, ?, 0, ?)`,
        [itemId, input.photo_uri, now]
      );
    }
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
    `SELECT ${ITEM_COLS} FROM inventory_items WHERE id = ?`,
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

  const database = await getDatabase();
  const now = nowISO();

  const pick = <T,>(v: T | undefined, fallback: T): T =>
    v !== undefined ? v : fallback;

  await database.runAsync(
    `UPDATE inventory_items SET
      name = ?, description = ?, category = ?, bin_location = ?,
      purchase_cost = ?, listing_price = ?, sale_price = ?, photo_uri = ?,
      barcode = ?, marketplace_platform = ?, marketplace_url = ?,
      fees = ?, shipping_cost = ?, shipping_label_uri = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      input.name !== undefined ? input.name.trim() : existing.name,
      input.description !== undefined
        ? input.description?.trim() || null
        : existing.description,
      input.category !== undefined
        ? input.category?.trim() || null
        : existing.category,
      input.bin_location !== undefined
        ? input.bin_location?.trim() || null
        : existing.bin_location,
      pick(input.purchase_cost, existing.purchase_cost),
      pick(input.listing_price, existing.listing_price),
      pick(input.sale_price, existing.sale_price),
      pick(input.photo_uri, existing.photo_uri),
      input.barcode !== undefined
        ? input.barcode?.trim() || null
        : existing.barcode,
      input.marketplace_platform !== undefined
        ? input.marketplace_platform?.trim() || null
        : existing.marketplace_platform,
      input.marketplace_url !== undefined
        ? input.marketplace_url?.trim() || null
        : existing.marketplace_url,
      pick(input.fees, existing.fees),
      pick(input.shipping_cost, existing.shipping_cost),
      pick(input.shipping_label_uri, existing.shipping_label_uri),
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
  if (!isValidStatus(status)) throw new Error(`Invalid status: ${status}`);
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
  const photos = await getPhotosForItem(id);
  for (const p of photos) {
    try {
      await deleteInventoryPhoto(p.uri);
    } catch {
      // continue
    }
  }
  if (existing.photo_uri) {
    try {
      await deleteInventoryPhoto(existing.photo_uri);
    } catch {
      // continue
    }
  }
  if (existing.shipping_label_uri) {
    try {
      await deleteInventoryPhoto(existing.shipping_label_uri);
    } catch {
      // continue
    }
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'DELETE FROM inventory_photos WHERE inventory_item_id = ?',
      [id]
    );
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

export async function getPhotosForItem(
  itemId: number
): Promise<InventoryPhoto[]> {
  const database = await getDatabase();
  return database.getAllAsync<InventoryPhoto>(
    `SELECT * FROM inventory_photos
     WHERE inventory_item_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [itemId]
  );
}

export async function addPhotoForItem(
  itemId: number,
  uri: string
): Promise<InventoryPhoto> {
  const database = await getDatabase();
  const now = nowISO();
  const maxRow = await database.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) as m FROM inventory_photos WHERE inventory_item_id = ?',
    [itemId]
  );
  const sortOrder = (maxRow?.m ?? -1) + 1;
  const result = await database.runAsync(
    `INSERT INTO inventory_photos (inventory_item_id, uri, sort_order, created_at)
     VALUES (?, ?, ?, ?)`,
    [itemId, uri, sortOrder, now]
  );
  if (sortOrder === 0) {
    await database.runAsync(
      'UPDATE inventory_items SET photo_uri = ?, updated_at = ? WHERE id = ?',
      [uri, now, itemId]
    );
  }
  const photo = await database.getFirstAsync<InventoryPhoto>(
    'SELECT * FROM inventory_photos WHERE id = ?',
    [result.lastInsertRowId]
  );
  if (!photo) throw new Error('Failed to save photo');
  return photo;
}

export async function removePhoto(photoId: number): Promise<void> {
  const database = await getDatabase();
  const photo = await database.getFirstAsync<InventoryPhoto>(
    'SELECT * FROM inventory_photos WHERE id = ?',
    [photoId]
  );
  if (!photo) return;
  try {
    await deleteInventoryPhoto(photo.uri);
  } catch {
    // ignore
  }
  await database.runAsync('DELETE FROM inventory_photos WHERE id = ?', [photoId]);
  const remaining = await getPhotosForItem(photo.inventory_item_id);
  const primary = remaining[0]?.uri ?? null;
  await database.runAsync(
    'UPDATE inventory_items SET photo_uri = ?, updated_at = ? WHERE id = ?',
    [primary, nowISO(), photo.inventory_item_id]
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
      `(CAST(inventory_number AS TEXT) LIKE ? OR name LIKE ? OR description LIKE ? OR category LIKE ? OR bin_location LIKE ? OR barcode LIKE ? OR marketplace_platform LIKE ? OR printf('%04d', inventory_number) LIKE ?)`
    );
    params.push(term, term, term, term, term, term, term, term);
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

  let sql = `SELECT ${ITEM_COLS} FROM inventory_items ${where} ORDER BY ${safeSort} ${sortOrder}`;
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

export async function getItemsToShip(): Promise<InventoryItem[]> {
  return searchInventory({
    status: 'Packed',
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });
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
    if (isValidStatus(row.status)) byStatus[row.status] = row.count;
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
       AND sale_price IS NOT NULL AND purchase_cost IS NOT NULL`
  );
  const actualProfit = profitRow?.total ?? 0;

  const netRow = await database.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(
       sale_price - purchase_cost - COALESCE(fees, 0) - COALESCE(shipping_cost, 0)
     ) as total FROM inventory_items
     WHERE status IN ('Sold', 'Packed', 'Shipped')
       AND sale_price IS NOT NULL AND purchase_cost IS NOT NULL`
  );
  const netProfit = netRow?.total ?? 0;

  return {
    total,
    byStatus,
    totalPurchaseCost,
    currentListedValue,
    totalSales,
    actualProfit,
    netProfit,
    toShipCount: byStatus.Packed,
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

export async function getAllItemsForExport(): Promise<InventoryItem[]> {
  const database = await getDatabase();
  return database.getAllAsync<InventoryItem>(
    `SELECT ${ITEM_COLS} FROM inventory_items ORDER BY inventory_number ASC`
  );
}

export async function getAllHistoryForExport(): Promise<
  InventoryStatusHistory[]
> {
  const database = await getDatabase();
  return database.getAllAsync<InventoryStatusHistory>(
    'SELECT * FROM inventory_status_history ORDER BY id ASC'
  );
}

export async function getAllPhotosForExport(): Promise<InventoryPhoto[]> {
  const database = await getDatabase();
  return database.getAllAsync<InventoryPhoto>(
    'SELECT * FROM inventory_photos ORDER BY id ASC'
  );
}

export async function importBundle(
  bundle: ImportBundle
): Promise<{ items: number; photos: number }> {
  const database = await getDatabase();
  let itemCount = 0;
  let photoCount = 0;
  const now = nowISO();

  await database.withTransactionAsync(async () => {
    for (const raw of bundle.items) {
      const existing = await database.getFirstAsync<{ id: number }>(
        'SELECT id FROM inventory_items WHERE inventory_number = ?',
        [raw.inventory_number]
      );
      if (existing) {
        await database.runAsync(
          `UPDATE inventory_items SET
            name = ?, description = ?, category = ?, bin_location = ?,
            status = ?, purchase_cost = ?, listing_price = ?, sale_price = ?,
            photo_uri = ?, barcode = ?, marketplace_platform = ?, marketplace_url = ?,
            fees = ?, shipping_cost = ?, shipping_label_uri = ?, updated_at = ?
          WHERE id = ?`,
          [
            raw.name,
            raw.description,
            raw.category,
            raw.bin_location,
            raw.status,
            raw.purchase_cost,
            raw.listing_price,
            raw.sale_price,
            raw.photo_uri,
            raw.barcode ?? null,
            raw.marketplace_platform ?? null,
            raw.marketplace_url ?? null,
            raw.fees ?? null,
            raw.shipping_cost ?? null,
            raw.shipping_label_uri ?? null,
            now,
            existing.id,
          ]
        );
        itemCount++;
      } else {
        await database.runAsync(
          `INSERT INTO inventory_items (
            inventory_number, name, description, category, bin_location,
            status, purchase_cost, listing_price, sale_price, photo_uri,
            barcode, marketplace_platform, marketplace_url, fees, shipping_cost,
            shipping_label_uri, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            raw.inventory_number,
            raw.name,
            raw.description,
            raw.category,
            raw.bin_location,
            raw.status,
            raw.purchase_cost,
            raw.listing_price,
            raw.sale_price,
            raw.photo_uri,
            raw.barcode ?? null,
            raw.marketplace_platform ?? null,
            raw.marketplace_url ?? null,
            raw.fees ?? null,
            raw.shipping_cost ?? null,
            raw.shipping_label_uri ?? null,
            raw.created_at || now,
            now,
          ]
        );
        itemCount++;
      }
    }

    for (const p of bundle.photos ?? []) {
      const bundleItem = bundle.items.find((i) => i.id === p.inventory_item_id);
      const invNum = bundleItem?.inventory_number;
      const row = invNum
        ? await database.getFirstAsync<{ id: number }>(
            'SELECT id FROM inventory_items WHERE inventory_number = ?',
            [invNum]
          )
        : null;
      if (!row) continue;
      await database.runAsync(
        `INSERT INTO inventory_photos (inventory_item_id, uri, sort_order, created_at)
         VALUES (?, ?, ?, ?)`,
        [row.id, p.uri, p.sort_order, p.created_at || now]
      );
      photoCount++;
    }
  });

  return { items: itemCount, photos: photoCount };
}

export async function seedDevelopmentData(): Promise<number> {
  const database = await getDatabase();
  const countRow = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM inventory_items'
  );
  if ((countRow?.count ?? 0) > 0) return 0;

  const samples: CreateInventoryItemInput[] = [
    {
      name: 'Ninja Creami',
      description: 'Ice cream maker, works great',
      category: 'Kitchen',
      bin_location: 'B-12',
      status: 'Listed',
      purchase_cost: 45.0,
      listing_price: 89.99,
      marketplace_platform: 'eBay',
    },
    {
      name: 'DeWalt Drill',
      description: '20V cordless drill with battery',
      category: 'Tools',
      bin_location: 'C-03',
      status: 'Sold',
      purchase_cost: 35.0,
      listing_price: 79.99,
      sale_price: 65.0,
      fees: 8.0,
      shipping_cost: 12.0,
    },
    {
      name: 'Coffee Maker',
      description: 'Keurig K-Classic',
      category: 'Kitchen',
      bin_location: 'A-07',
      status: 'Added',
      purchase_cost: 20.0,
      listing_price: 49.99,
    },
    {
      name: 'LEGO Star Wars Set',
      description: 'Millennium Falcon, complete',
      category: 'Toys',
      bin_location: 'D-01',
      status: 'Packed',
      purchase_cost: 80.0,
      listing_price: 150.0,
      sale_price: 140.0,
      fees: 15.0,
      shipping_cost: 10.0,
      marketplace_platform: 'Facebook',
    },
    {
      name: 'Vintage Denim Jacket',
      description: "Levi's size M",
      category: 'Clothing',
      bin_location: 'Shelf-2',
      status: 'Shipped',
      purchase_cost: 15.0,
      listing_price: 45.0,
      sale_price: 42.0,
      fees: 5.0,
      shipping_cost: 6.0,
      marketplace_platform: 'Poshmark',
    },
  ];

  let created = 0;
  for (const sample of samples) {
    try {
      await createInventoryItem(sample);
      created++;
    } catch (e) {
      console.warn('Seed item failed:', e);
    }
  }
  return created;
}
