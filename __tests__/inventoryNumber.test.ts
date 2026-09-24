import {
  formatInventoryNumber,
  parseInventoryNumber,
} from '../src/utils/inventoryNumber';

describe('formatInventoryNumber', () => {
  it('pads to 4 digits', () => {
    expect(formatInventoryNumber(1)).toBe('0001');
    expect(formatInventoryNumber(42)).toBe('0042');
    expect(formatInventoryNumber(107)).toBe('0107');
    expect(formatInventoryNumber(9999)).toBe('9999');
  });

  it('throws for out of range', () => {
    expect(() => formatInventoryNumber(-1)).toThrow();
    expect(() => formatInventoryNumber(10000)).toThrow();
  });
});

describe('parseInventoryNumber', () => {
  it('parses valid strings', () => {
    expect(parseInventoryNumber('0001')).toBe(1);
    expect(parseInventoryNumber('0042')).toBe(42);
    expect(parseInventoryNumber('42')).toBe(42);
  });

  it('throws for invalid', () => {
    expect(() => parseInventoryNumber('0')).toThrow();
    expect(() => parseInventoryNumber('abc')).toThrow();
    expect(() => parseInventoryNumber('10000')).toThrow();
  });
});
