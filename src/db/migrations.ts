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
];

export const CURRENT_SCHEMA_VERSION = 1;
