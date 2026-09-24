import { formatCurrency, parseCurrency } from '../src/utils/currency';

describe('formatCurrency', () => {
  it('formats numbers', () => {
    expect(formatCurrency(25)).toMatch(/\$25\.00/);
    expect(formatCurrency(59.99)).toMatch(/\$59\.99/);
  });

  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toBe('\u2014');
    expect(formatCurrency(undefined)).toBe('\u2014');
  });
});

describe('parseCurrency', () => {
  it('parses valid values', () => {
    expect(parseCurrency('25')).toBe(25);
    expect(parseCurrency('$59.99')).toBe(59.99);
    expect(parseCurrency('1,200.50')).toBe(1200.5);
  });

  it('returns null for empty or invalid', () => {
    expect(parseCurrency('')).toBeNull();
    expect(parseCurrency('abc')).toBeNull();
    expect(parseCurrency('-5')).toBeNull();
  });
});
