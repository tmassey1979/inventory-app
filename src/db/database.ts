import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, CURRENT_SCHEMA_VERSION } from './migrations';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('inventory.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL
    );
  `);

  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );
  let currentVersion = result?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await database.withTransactionAsync(async () => {
        for (const statement of migration.up) {
          await database.execAsync(statement);
        }
        if (currentVersion === 0) {
          await database.runAsync(
            'INSERT INTO schema_version (version) VALUES (?)',
            [migration.version]
          );
        } else {
          await database.runAsync(
            'UPDATE schema_version SET version = ?',
            [migration.version]
          );
        }
      });
      currentVersion = migration.version;
      console.log(`Migration ${migration.version} (${migration.name}) applied`);
    }
  }

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    console.warn(
      `Schema version ${currentVersion} is behind expected ${CURRENT_SCHEMA_VERSION}`
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
