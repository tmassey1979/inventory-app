import * as Print from 'expo-print';
import type { InventoryItem } from '../models/InventoryItem';
import { formatInventoryNumber } from '../utils/inventoryNumber';
import { formatCurrency } from '../utils/currency';
import { computeNetProfit } from '../models/InventoryItem';
import { readAsBase64 } from './imageStorage';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function printPackingSlip(item: InventoryItem): Promise<void> {
  const inv = formatInventoryNumber(item.inventory_number);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { color: #555; margin-bottom: 20px; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .label { color: #666; }
    .big { font-size: 28px; font-weight: 700; letter-spacing: 2px; }
  </style>
</head>
<body>
  <h1>Packing Slip</h1>
  <div class="meta">Inventory Manager · ${new Date().toLocaleString()}</div>
  <div class="box">
    <div class="big">#${inv}</div>
    <div style="font-size:18px;margin-top:8px;">${escapeHtml(item.name)}</div>
    <div style="margin-top:4px;color:#666;">Status: ${escapeHtml(item.status)}</div>
  </div>
  <div class="box">
    <div class="row"><span class="label">Bin</span><span>${escapeHtml(item.bin_location ?? '—')}</span></div>
    <div class="row"><span class="label">Category</span><span>${escapeHtml(item.category ?? '—')}</span></div>
    <div class="row"><span class="label">Platform</span><span>${escapeHtml(item.marketplace_platform ?? '—')}</span></div>
    <div class="row"><span class="label">Barcode</span><span>${escapeHtml(item.barcode ?? '—')}</span></div>
  </div>
  <div class="box">
    <div class="row"><span class="label">Purchase</span><span>${formatCurrency(item.purchase_cost)}</span></div>
    <div class="row"><span class="label">Sale</span><span>${formatCurrency(item.sale_price)}</span></div>
    <div class="row"><span class="label">Fees</span><span>${formatCurrency(item.fees)}</span></div>
    <div class="row"><span class="label">Shipping cost</span><span>${formatCurrency(item.shipping_cost)}</span></div>
    <div class="row"><span class="label">Net profit</span><span>${formatCurrency(computeNetProfit(item))}</span></div>
  </div>
  ${
    item.description
      ? `<div class="box"><div class="label">Notes</div><p>${escapeHtml(item.description)}</p></div>`
      : ''
  }
  <p style="margin-top:32px;color:#888;font-size:12px;">Packed with Inventory Manager (offline)</p>
</body>
</html>`;
  await Print.printAsync({ html });
}

/** Print attached shipping label image if present (embeds base64 for reliable print) */
export async function printShippingLabel(item: InventoryItem): Promise<void> {
  if (!item.shipping_label_uri) {
    throw new Error('No shipping label attached to this item');
  }
  const b64 = await readAsBase64(item.shipping_label_uri);
  if (!b64) {
    throw new Error('Could not read shipping label file');
  }
  const src = `data:image/jpeg;base64,${b64}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>
  @page { margin: 0.25in; }
  body { margin: 0; padding: 0; }
  img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  .caption { font-family: Helvetica, sans-serif; font-size: 11px; color: #666; padding: 6px; text-align: center; }
</style>
</head>
<body>
  <div class="caption">#${formatInventoryNumber(item.inventory_number)} · ${escapeHtml(item.name)}</div>
  <img src="${src}" />
</body>
</html>`;
  await Print.printAsync({ html });
}

export async function printShippingChecklist(
  items: InventoryItem[]
): Promise<void> {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td>${formatInventoryNumber(item.inventory_number)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.bin_location ?? '')}</td>
      <td>${item.shipping_label_uri ? 'Yes' : 'No'}</td>
      <td>${escapeHtml(item.marketplace_platform ?? '')}</td>
    </tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
  th { background: #f3f4f6; }
  h1 { font-size: 20px; }
</style>
</head>
<body>
  <h1>Shipping checklist</h1>
  <p>${items.length} item(s) · ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr><th>#</th><th>Name</th><th>Status</th><th>Bin</th><th>Label</th><th>Platform</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  await Print.printAsync({ html });
}
