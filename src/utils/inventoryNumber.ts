export function formatInventoryNumber(num: number): string {
  if (num < 0 || num > 9999) {
    throw new Error(`Inventory number must be between 0 and 9999, got ${num}`);
  }
  return num.toString().padStart(4, '0');
}

export function parseInventoryNumber(str: string): number {
  const cleaned = str.trim().replace(/^0+/, '') || '0';
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num < 1 || num > 9999) {
    throw new Error(`Invalid inventory number: ${str}`);
  }
  return num;
}
