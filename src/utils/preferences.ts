/**
 * Lightweight local preferences (no AsyncStorage dependency).
 * Stored as JSON under the app document directory.
 */
import * as FileSystem from 'expo-file-system';
import type { InventoryFilters } from '../models/InventoryItem';
import type { InventoryStatus } from '../models/InventoryStatus';
import { isValidStatus } from '../models/InventoryStatus';

const PREFS_PATH = `${FileSystem.documentDirectory}inventory_prefs.json`;

export interface AppPreferences {
  inventoryFilters?: {
    status?: InventoryStatus | null;
    category?: string | null;
    bin_location?: string | null;
    sortBy?: InventoryFilters['sortBy'];
    sortOrder?: InventoryFilters['sortOrder'];
  };
  lastExportAt?: string | null;
}

async function readRaw(): Promise<AppPreferences> {
  try {
    const info = await FileSystem.getInfoAsync(PREFS_PATH);
    if (!info.exists) return {};
    const raw = await FileSystem.readAsStringAsync(PREFS_PATH);
    return JSON.parse(raw) as AppPreferences;
  } catch {
    return {};
  }
}

async function writeRaw(prefs: AppPreferences): Promise<void> {
  await FileSystem.writeAsStringAsync(PREFS_PATH, JSON.stringify(prefs), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function loadPreferences(): Promise<AppPreferences> {
  return readRaw();
}

export async function saveInventoryFilters(
  filters: InventoryFilters
): Promise<void> {
  const prefs = await readRaw();
  prefs.inventoryFilters = {
    status:
      filters.status && isValidStatus(filters.status) ? filters.status : null,
    category: filters.category ?? null,
    bin_location: filters.bin_location ?? null,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
  await writeRaw(prefs);
}

export async function loadInventoryFilters(): Promise<InventoryFilters> {
  const prefs = await readRaw();
  const f = prefs.inventoryFilters;
  if (!f) return {};
  const out: InventoryFilters = {};
  if (f.status && isValidStatus(f.status)) out.status = f.status;
  if (f.category) out.category = f.category;
  if (f.bin_location) out.bin_location = f.bin_location;
  if (f.sortBy) out.sortBy = f.sortBy;
  if (f.sortOrder) out.sortOrder = f.sortOrder;
  return out;
}

export async function markExportCompleted(): Promise<void> {
  const prefs = await readRaw();
  prefs.lastExportAt = new Date().toISOString();
  await writeRaw(prefs);
}

export async function getLastExportAt(): Promise<string | null> {
  const prefs = await readRaw();
  return prefs.lastExportAt ?? null;
}

/** True if no export in the last `days` days (or never). */
export async function isBackupStale(days = 14): Promise<boolean> {
  const last = await getLastExportAt();
  if (!last) return true;
  const then = new Date(last).getTime();
  if (Number.isNaN(then)) return true;
  const ageMs = Date.now() - then;
  return ageMs > days * 24 * 60 * 60 * 1000;
}
