import { describe, it, expect, beforeEach } from 'vitest';
import {
  CLIENT_SHIPPING_KEY,
  hasClientShippingOverride,
  mergeClientShippingIntoResponse,
  readClientShippingFee,
  writeClientShippingFee,
} from './shipping-store.js';

function mockLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('shipping-store', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  it('returns default when no override saved', () => {
    expect(hasClientShippingOverride()).toBe(false);
    expect(readClientShippingFee()).toBe(29);
  });

  it('persists admin shipping fee', () => {
    writeClientShippingFee(50);
    expect(hasClientShippingOverride()).toBe(true);
    expect(readClientShippingFee()).toBe(50);
    expect(localStorage.getItem(CLIENT_SHIPPING_KEY)).toBe('50');
  });

  it('merges client fee into payment info response', () => {
    writeClientShippingFee(45);
    const merged = mergeClientShippingIntoResponse({
      ok: true,
      shipping_fee: 0,
      shipping_label: 'ส่งฟรี',
      bank_accounts: [],
    });
    expect(merged.shipping_fee).toBe(45);
    expect(merged.shipping_label).toContain('45');
  });

  it('does not merge when no override exists', () => {
    const res = { ok: true, shipping_fee: 0, shipping_label: 'ส่งฟรี' };
    expect(mergeClientShippingIntoResponse(res)).toEqual(res);
  });
});
