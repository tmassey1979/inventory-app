export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '\u2014';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function parseCurrency(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}
