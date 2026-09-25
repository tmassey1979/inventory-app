import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { InventoryItem, InventoryPhoto } from '../models/InventoryItem';
import type { InventoryStatusHistory } from '../models/InventoryStatusHistory';
import {
  getAllItemsForExport,
  getAllHistoryForExport,
  getAllPhotosForExport,
  importBundle,
} from '../db/inventoryRepository';
import { readAsBase64, writeBase64File } from './imageStorage';
import { formatInventoryNumber } from '../utils/inventoryNumber';

export interface ExportBundle {
  version: 1;
  exported_at: string;
  device_id?: string;
  items: InventoryItem[];
  history: InventoryStatusHistory[];
  photos: Array<InventoryPhoto & { base64?: string | null }>;
  labels: Array<{ inventory_number: number; base64: string }>;
}

export async function buildExportBundle(): Promise<ExportBundle> {
  const items = await getAllItemsForExport();
  const history = await getAllHistoryForExport();
  const photos = await getAllPhotosForExport();

  const photosWithData: ExportBundle['photos'] = [];
  for (const p of photos) {
    const base64 = await readAsBase64(p.uri);
    photosWithData.push({ ...p, base64 });
  }

  const labels: ExportBundle['labels'] = [];
  for (const item of items) {
    if (item.shipping_label_uri) {
      const base64 = await readAsBase64(item.shipping_label_uri);
      if (base64) {
        labels.push({ inventory_number: item.inventory_number, base64 });
      }
    }
  }

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    items,
    history,
    photos: photosWithData,
    labels,
  };
}

export async function exportJsonFile(): Promise<string> {
  const bundle = await buildExportBundle();
  const path = `${FileSystem.cacheDirectory}inventory-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(bundle), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function exportCsvFile(): Promise<string> {
  const items = await getAllItemsForExport();
  const headers = [
    'inventory_number',
    'name',
    'description',
    'category',
    'bin_location',
    'status',
    'purchase_cost',
    'listing_price',
    'sale_price',
    'fees',
    'shipping_cost',
    'barcode',
    'marketplace_platform',
    'marketplace_url',
    'created_at',
    'updated_at',
  ];
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const item of items) {
    lines.push(
      [
        formatInventoryNumber(item.inventory_number),
        item.name,
        item.description,
        item.category,
        item.bin_location,
        item.status,
        item.purchase_cost,
        item.listing_price,
        item.sale_price,
        item.fees,
        item.shipping_cost,
        item.barcode,
        item.marketplace_platform,
        item.marketplace_url,
        item.created_at,
        item.updated_at,
      ]
        .map(escape)
        .join(',')
    );
  }
  const path = `${FileSystem.cacheDirectory}inventory-export-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(path, lines.join('\n'), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function shareFile(path: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(path, {
    mimeType: path.endsWith('.csv') ? 'text/csv' : 'application/json',
    dialogTitle: 'Export inventory',
  });
}

export async function importFromJsonString(
  json: string
): Promise<{ items: number; photos: number }> {
  const bundle = JSON.parse(json) as ExportBundle;
  if (!bundle?.items || !Array.isArray(bundle.items)) {
    throw new Error('Invalid inventory export file');
  }

  const photoUriMap = new Map<string, string>();
  for (const p of bundle.photos ?? []) {
    if (p.base64) {
      const dest = `${FileSystem.documentDirectory}inventory_photos/import_${p.id}_${Date.now()}.jpg`;
      await writeBase64File(p.base64, dest);
      photoUriMap.set(p.uri, dest);
      p.uri = dest;
    }
  }

  for (const item of bundle.items) {
    if (item.photo_uri && photoUriMap.has(item.photo_uri)) {
      item.photo_uri = photoUriMap.get(item.photo_uri)!;
    }
    if (item.shipping_label_uri) {
      const label = (bundle.labels ?? []).find(
        (l) => l.inventory_number === item.inventory_number
      );
      if (label?.base64) {
        const dest = `${FileSystem.documentDirectory}shipping_labels/import_${item.inventory_number}_${Date.now()}.jpg`;
        await writeBase64File(label.base64, dest);
        item.shipping_label_uri = dest;
      }
    }
  }

  return importBundle(bundle);
}
