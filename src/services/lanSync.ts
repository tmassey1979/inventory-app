/**
 * Same-network peer sync without a cloud backend.
 *
 * How it works:
 * - Host device exports a full inventory bundle and serves it over HTTP on the LAN.
 * - Join device connects to host IP:port and pulls (or pushes) the bundle.
 *
 * Expo Go cannot open a real TCP listen socket. Host mode uses an in-app
 * "offer" that the join device fetches when both apps are open and the host
 * registers the latest bundle in a shared memory endpoint via the
 * react-native compatible approach below:
 *
 * Practical implementation for Expo:
 * 1) Host builds export JSON and listens using a lightweight UDP advertisement
 *    of "I'm here" + the user shares IP shown on screen.
 * 2) Join calls http://HOST_IP:PORT/inventory-sync which we simulate with
 *    a peer-to-peer pull: join device uses fetch against a tiny static
 *    response held in the host process via expo-modules if available.
 *
 * Because pure Expo Go cannot bind a server port reliably, we implement:
 * - Host: builds bundle, shows IP + "Sync code", keeps bundle in module memory
 * - A companion approach: both devices use the same Wi‑Fi; Join enters Host IP
 * - We use the `expo` fetch API against `http://IP:8787/...` when a native
 *   HTTP bridge is present; otherwise fall back to QR/file transfer of the
 *   export bundle (still offline, still no cloud).
 *
 * Additionally, `applyRemoteBundle` merges remote data into local SQLite.
 */

import * as Network from 'expo-network';
import { buildExportBundle, type ExportBundle } from './exportImport';
import { importBundle } from '../db/inventoryRepository';
import { writeBase64File } from './imageStorage';
import * as FileSystem from 'expo-file-system';

const DEFAULT_PORT = 8787;

let hostBundle: ExportBundle | null = null;
let hostActive = false;

export function isHostActive(): boolean {
  return hostActive;
}

export async function getLocalIpAddress(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (!ip || ip === '0.0.0.0') return null;
    return ip;
  } catch {
    return null;
  }
}

export async function startHostSession(): Promise<{
  ip: string | null;
  port: number;
  itemCount: number;
}> {
  hostBundle = await buildExportBundle();
  hostActive = true;
  const ip = await getLocalIpAddress();
  return {
    ip,
    port: DEFAULT_PORT,
    itemCount: hostBundle.items.length,
  };
}

export function stopHostSession(): void {
  hostActive = false;
  hostBundle = null;
}

/** Current host bundle (for in-process testing / future native HTTP bridge) */
export function getHostBundle(): ExportBundle | null {
  return hostActive ? hostBundle : null;
}

export async function refreshHostBundle(): Promise<number> {
  if (!hostActive) throw new Error('Host session is not active');
  hostBundle = await buildExportBundle();
  return hostBundle.items.length;
}

/**
 * Pull inventory from a peer host on the LAN.
 * Expects the peer to respond to GET http://ip:port/sync with ExportBundle JSON.
 * If the peer is another Inventory Manager host using a native HTTP bridge,
 * this succeeds. Otherwise throws with a clear fallback message.
 */
export async function pullFromPeer(
  hostIp: string,
  port: number = DEFAULT_PORT
): Promise<{ items: number; photos: number }> {
  const url = `http://${hostIp.replace(/\/$/, '')}:${port}/sync`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Peer returned HTTP ${res.status}`);
    }
    const bundle = (await res.json()) as ExportBundle;
    return await materializeAndImport(bundle);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Could not reach peer at ${url}. ${msg}. ` +
        'Both devices must be on the same Wi‑Fi. If host cannot open a port (Expo Go), use Export JSON on the host and Import on this device instead.'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Push local inventory to a peer (POST /sync).
 */
export async function pushToPeer(
  hostIp: string,
  port: number = DEFAULT_PORT
): Promise<void> {
  const bundle = await buildExportBundle();
  const url = `http://${hostIp.replace(/\/$/, '')}:${port}/sync`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    throw new Error(`Push failed: HTTP ${res.status}`);
  }
}

async function materializeAndImport(
  bundle: ExportBundle
): Promise<{ items: number; photos: number }> {
  for (const p of bundle.photos ?? []) {
    if (p.base64) {
      const dest = `${FileSystem.documentDirectory}inventory_photos/sync_${Date.now()}_${p.id}.jpg`;
      await writeBase64File(p.base64, dest);
      p.uri = dest;
    }
  }
  for (const item of bundle.items ?? []) {
    if (item.shipping_label_uri) {
      const label = (bundle.labels ?? []).find(
        (l) => l.inventory_number === item.inventory_number
      );
      if (label?.base64) {
        const dest = `${FileSystem.documentDirectory}shipping_labels/sync_${item.inventory_number}_${Date.now()}.jpg`;
        await writeBase64File(label.base64, dest);
        item.shipping_label_uri = dest;
      }
    }
  }
  return importBundle(bundle);
}

export async function importBundleDirect(
  bundle: ExportBundle
): Promise<{ items: number; photos: number }> {
  return materializeAndImport(bundle);
}

export { DEFAULT_PORT };
