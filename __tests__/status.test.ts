import {
  isValidStatus,
  getNextMainStatus,
  getQuickStatusTargets,
  MAIN_WORKFLOW,
  INVENTORY_STATUSES,
} from '../src/models/InventoryStatus';

describe('isValidStatus', () => {
  it('accepts known statuses', () => {
    for (const s of INVENTORY_STATUSES) {
      expect(isValidStatus(s)).toBe(true);
    }
  });

  it('rejects unknown', () => {
    expect(isValidStatus('Pending')).toBe(false);
    expect(isValidStatus('')).toBe(false);
  });
});

describe('getNextMainStatus', () => {
  it('follows Added → Listed → Sold → Packed → Shipped', () => {
    expect(getNextMainStatus('Added')).toBe('Listed');
    expect(getNextMainStatus('Listed')).toBe('Sold');
    expect(getNextMainStatus('Sold')).toBe('Packed');
    expect(getNextMainStatus('Packed')).toBe('Shipped');
    expect(getNextMainStatus('Shipped')).toBeNull();
  });

  it('returns null off the main path', () => {
    expect(getNextMainStatus('Delisted')).toBeNull();
    expect(getNextMainStatus('Donated')).toBeNull();
  });

  it('MAIN_WORKFLOW length is 5', () => {
    expect(MAIN_WORKFLOW).toEqual([
      'Added',
      'Listed',
      'Sold',
      'Packed',
      'Shipped',
    ]);
  });
});

describe('getQuickStatusTargets', () => {
  it('suggests sensible targets', () => {
    expect(getQuickStatusTargets('Added')).toContain('Listed');
    expect(getQuickStatusTargets('Sold')).toEqual(['Packed']);
    expect(getQuickStatusTargets('Packed')).toEqual(['Shipped']);
    expect(getQuickStatusTargets('Shipped')).toEqual([]);
  });
});
