import {
  INVENTORY_STATUSES,
  isValidStatus,
} from '../src/models/InventoryStatus';

describe('InventoryStatus', () => {
  it('has all required statuses', () => {
    expect(INVENTORY_STATUSES).toContain('Added');
    expect(INVENTORY_STATUSES).toContain('Listed');
    expect(INVENTORY_STATUSES).toContain('Sold');
    expect(INVENTORY_STATUSES).toContain('Packed');
    expect(INVENTORY_STATUSES).toContain('Shipped');
    expect(INVENTORY_STATUSES).toContain('Delisted');
    expect(INVENTORY_STATUSES).toContain('Donated');
  });

  it('validates correctly', () => {
    expect(isValidStatus('Added')).toBe(true);
    expect(isValidStatus('Invalid')).toBe(false);
    expect(isValidStatus('')).toBe(false);
  });
});
