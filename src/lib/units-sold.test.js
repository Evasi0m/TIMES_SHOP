import { describe, it, expect } from 'vitest';
import {
  formatCompactUnitsSold,
  formatStoreSoldLabel,
  shouldShowUnitsSold,
} from './units-sold.js';

describe('formatCompactUnitsSold', () => {
  it('formats under 1K as plain number', () => {
    expect(formatCompactUnitsSold(999)).toBe('999');
    expect(formatCompactUnitsSold(0)).toBe('0');
  });

  it('formats thousands with one decimal when needed', () => {
    expect(formatCompactUnitsSold(13700)).toBe('13.7K');
    expect(formatCompactUnitsSold(1000)).toBe('1K');
    expect(formatCompactUnitsSold(10500)).toBe('10.5K');
  });

  it('formats large thousands without unnecessary decimals', () => {
    expect(formatCompactUnitsSold(120000)).toBe('120K');
  });

  it('formats millions', () => {
    expect(formatCompactUnitsSold(1_500_000)).toBe('1.5M');
    expect(formatCompactUnitsSold(2_000_000)).toBe('2M');
  });
});

describe('formatStoreSoldLabel', () => {
  it('returns Thai sold label for valid counts', () => {
    expect(formatStoreSoldLabel(13700)).toBe('ขายแล้ว 13.7K');
  });

  it('returns null for missing or zero counts', () => {
    expect(formatStoreSoldLabel(0)).toBeNull();
    expect(formatStoreSoldLabel(null)).toBeNull();
    expect(formatStoreSoldLabel(undefined)).toBeNull();
  });
});

describe('shouldShowUnitsSold', () => {
  it('shows when at least 1', () => {
    expect(shouldShowUnitsSold(1)).toBe(true);
    expect(shouldShowUnitsSold(0)).toBe(false);
  });
});
