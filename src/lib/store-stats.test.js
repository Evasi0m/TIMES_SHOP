import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoreUnitsSoldCache, fetchStoreUnitsSoldTotal } from './store-stats.js';

vi.mock('./shop-api.js', () => ({
  shopApi: {
    getCatalog: vi.fn(),
    getPaymentInfo: vi.fn(),
  },
}));

import { shopApi } from './shop-api.js';

describe('fetchStoreUnitsSoldTotal', () => {
  beforeEach(() => {
    clearStoreUnitsSoldCache();
    shopApi.getCatalog.mockReset();
    shopApi.getPaymentInfo.mockReset();
    shopApi.getPaymentInfo.mockResolvedValue({ ok: true, store: { units_sold_display: null } });
  });

  it('uses shop_settings.units_sold_display when set', async () => {
    shopApi.getPaymentInfo.mockResolvedValue({
      ok: true,
      store: { units_sold_display: 2500 },
    });
    const total = await fetchStoreUnitsSoldTotal();
    expect(total).toBe(2500);
    expect(shopApi.getCatalog).not.toHaveBeenCalled();
  });

  it('sums units_sold across paginated catalog pages when settings unset', async () => {
    shopApi.getCatalog
      .mockResolvedValueOnce({
        ok: true,
        total: 150,
        items: [{ units_sold: 128 }, { units_sold: 42 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        total: 150,
        items: [{ units_sold: 18 }],
      });

    const total = await fetchStoreUnitsSoldTotal();
    expect(total).toBe(188);
    expect(shopApi.getCatalog).toHaveBeenCalledTimes(2);
  });

  it('returns null when no listing has units_sold', async () => {
    shopApi.getCatalog.mockResolvedValueOnce({
      ok: true,
      total: 1,
      items: [{ units_sold: 0 }],
    });

    expect(await fetchStoreUnitsSoldTotal()).toBeNull();
  });

  it('uses session cache on repeat calls', async () => {
    shopApi.getCatalog.mockResolvedValue({
      ok: true,
      total: 1,
      items: [{ units_sold: 10 }],
    });

    await fetchStoreUnitsSoldTotal();
    await fetchStoreUnitsSoldTotal();
    expect(shopApi.getCatalog).toHaveBeenCalledTimes(1);
  });
});
