export interface Migration {
  version: number;
  name: string;
  up: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: [
      `CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_number INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        bin_location TEXT,
        status TEXT NOT NULL,
        purchase_cost REAL,
        listing_price REAL,
        sale_price REAL,
        photo_uri TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS inventory_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_item_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        changed_at TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_inventory_number ON inventory_items(inventory_number);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_bin_location ON inventory_items(bin_location);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);`,
      `CREATE INDEX IF NOT EXISTS idx_status_history_item_id ON inventory_status_history(inventory_item_id);`,
    ],
  },
  {
    version: 2,
    name: 'commerce_shipping_photos',
    up: [
      `ALTER TABLE inventory_items ADD COLUMN barcode TEXT;`,
      `ALTER TABLE inventory_items ADD COLUMN marketplace_platform TEXT;`,
      `ALTER TABLE inventory_items ADD COLUMN marketplace_url TEXT;`,
      `ALTER TABLE inventory_items ADD COLUMN fees REAL;`,
      `ALTER TABLE inventory_items ADD COLUMN shipping_cost REAL;`,
      `ALTER TABLE inventory_items ADD COLUMN shipping_label_uri TEXT;`,
      `CREATE TABLE IF NOT EXISTS inventory_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_item_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_photos_item ON inventory_photos(inventory_item_id);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items(barcode);`,
      `CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,
    ],
  },
];

export const CURRENT_SCHEMA_VERSION = 2;
