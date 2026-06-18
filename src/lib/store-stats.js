import { CATALOG_CACHE_TTL_MS } from './config.js';
import { buildHomeCatalogParams } from './homepage.js';
import { shopApi } from './shop-api.js';

const SESSION_KEY = 'times_shop_units_sold_total';

/** @type {{ expiresAt: number, value: number | null } | null} */
let memoryCache = null;

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(entry) {
  memoryCache = entry;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
}

function sumListingUnitsSold(items) {
  let total = 0;
  let hasAny = false;
  for (const item of items ?? []) {
    const sold = Number(item?.units_sold);
    if (Number.isFinite(sold) && sold > 0) {
      total += sold;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

async function readSettingsUnitsSold() {
  const res = await shopApi.getPaymentInfo();
  if (!res.ok) return undefined;
  const n = res.store?.units_sold_display;
  if (n == null || n === '') return undefined;
  const parsed = Number(n);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Sum units_sold across catalog, or use shop_settings.units_sold_display when set. */
export async function fetchStoreUnitsSoldTotal() {
  if (memoryCache && Date.now() < memoryCache.expiresAt) {
    return memoryCache.value;
  }

  const sessionEntry = readSessionCache();
  if (sessionEntry) {
    memoryCache = sessionEntry;
    return sessionEntry.value;
  }

  const settingsValue = await readSettingsUnitsSold();
  if (settingsValue !== undefined) {
    writeSessionCache({ value: settingsValue, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS });
    return settingsValue;
  }

  const pageSize = 100;
  let page = 1;
  let aggregate = 0;
  let sawSold = false;
  let totalPages = 1;

  do {
    const res = await shopApi.getCatalog({
      ...buildHomeCatalogParams({ page_size: pageSize }),
      page,
    });
    if (!res.ok) break;

    const batchTotal = sumListingUnitsSold(res.items);
    if (batchTotal != null) {
      aggregate += batchTotal;
      sawSold = true;
    }

    const total = Number(res.total) || 0;
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    page += 1;
  } while (page <= totalPages);

  const value = sawSold ? aggregate : null;
  writeSessionCache({ value, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS });
  return value;
}

export function clearStoreUnitsSoldCache() {
  memoryCache = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
