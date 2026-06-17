// Single data-access layer for the storefront. Toggle between local mocks and
// the real shop-* Edge Functions via VITE_USE_MOCK_API. The UI only ever imports
// from here, so swapping to real backend requires no page changes.
//
// Hybrid B routing:
// - Catalog (TikTok cache): POS project via posSupabase
// - Auth, promos, addresses, settings: Shop project via supabase

import { USE_MOCK_API, hasPosSupabaseConfig } from './config.js';
import { supabase } from './supabase.js';
import { posSupabase } from './pos-supabase.js';
import {
  catalogCacheKey,
  getCachedCatalog,
  setCachedCatalog,
} from './catalog-cache.js';
import { mockApi } from '../mocks/shop-api.mock.js';

async function invokeClient(client, fn, body) {
  try {
    const { data, error } = await client.functions.invoke(fn, { body });
    if (error) {
      return { ok: false, error: 'network_error', message: error.message };
    }
    if (data == null) {
      return { ok: false, error: 'empty_response', message: 'ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์' };
    }
    return data;
  } catch (err) {
    return {
      ok: false,
      error: 'network_error',
      message: err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ',
    };
  }
}

/** Shop project Edge Functions (auth JWT when required). */
function invokeShop(fn, body) {
  return invokeClient(supabase, fn, body);
}

/** POS project Edge Functions (public catalog; no Shop JWT). */
function invokePos(fn, body) {
  if (!hasPosSupabaseConfig) {
    return Promise.resolve({
      ok: false,
      error: 'pos_not_configured',
      message: 'ยังไม่ได้ตั้งค่า VITE_POS_SUPABASE_URL / VITE_POS_SUPABASE_ANON_KEY',
    });
  }
  return invokeClient(posSupabase, fn, body);
}

async function invokePosCached(fn, body) {
  const key = catalogCacheKey(fn, body);
  const hit = getCachedCatalog(key);
  if (hit) return hit;
  const res = await invokePos(fn, body);
  if (res?.ok) setCachedCatalog(key, res);
  return res;
}

async function invokeMultipart(fn, formData) {
  const { data, error } = await supabase.functions.invoke(fn, { body: formData });
  if (error) return { ok: false, error: 'network_error', message: error.message };
  return data;
}

export const shopApi = {
  getCatalog(params) {
    const run = USE_MOCK_API
      ? mockApi.getCatalog(params)
      : invokePosCached('shop-get-catalog', params);
    return run.then((res) => res).catch((err) => ({
      ok: false,
      error: 'network_error',
      message: err instanceof Error ? err.message : 'โหลดสินค้าไม่สำเร็จ',
    }));
  },
  getProduct(params) {
    return USE_MOCK_API ? mockApi.getProduct(params) : invokePosCached('shop-get-product', params);
  },
  getProductDescription(params) {
    return USE_MOCK_API
      ? mockApi.getProductDescription(params)
      : invokeShop('shop-get-product-description', params);
  },
  validateCart(params) {
    return USE_MOCK_API ? mockApi.validateCart(params) : invokePos('shop-validate-cart', params);
  },
  quoteOrder(params) {
    return USE_MOCK_API ? mockApi.quoteOrder(params) : invokeShop('shop-quote-order', params);
  },
  placeOrder(payload) {
    return USE_MOCK_API ? mockApi.placeOrder(payload) : invokeShop('shop-place-order', payload);
  },
  getMyOrders(params) {
    return USE_MOCK_API ? mockApi.getMyOrders(params) : invokeShop('shop-get-my-orders', params);
  },
  getOrder(params) {
    return USE_MOCK_API
      ? mockApi.getOrder(params)
      : invokeShop('shop-get-my-orders', { order_id: params.order_id, page: 1, page_size: 1 });
  },
  async getPaymentInfo() {
    if (USE_MOCK_API) return mockApi.getPaymentInfo();
    const res = await invokeShop('shop-get-payment-info', {});
    if (!res.ok) return mockApi.getPaymentInfo();
    return res;
  },
  uploadSlip(file, options = {}) {
    if (USE_MOCK_API) return mockApi.uploadSlip(file, options);
    const fd = new FormData();
    fd.append('file', file);
    return invokeMultipart('shop-upload-slip', fd);
  },
  verifySlip(params) {
    return USE_MOCK_API ? mockApi.verifySlip(params) : invokeShop('shop-verify-slip', params);
  },
  listAddresses() {
    return USE_MOCK_API ? mockApi.listAddresses() : invokeShop('shop-list-addresses', {});
  },
  upsertAddress(payload) {
    return USE_MOCK_API ? mockApi.upsertAddress(payload) : invokeShop('shop-upsert-address', payload);
  },
  deleteAddress(params) {
    return USE_MOCK_API ? mockApi.deleteAddress(params) : invokeShop('shop-delete-address', params);
  },
  adminGetShopSettings() {
    return USE_MOCK_API
      ? mockApi.adminGetShopSettings()
      : invokeShop('shop-admin-get-shop-settings', {});
  },
  adminUpdateShopSettings(payload) {
    return USE_MOCK_API
      ? mockApi.adminUpdateShopSettings(payload)
      : invokeShop('shop-admin-update-shop-settings', payload);
  },
  adminGetAnnouncement() {
    return USE_MOCK_API
      ? mockApi.adminGetAnnouncement()
      : invokeShop('shop-admin-announcement-get', {});
  },
  adminSaveAnnouncement(payload) {
    return USE_MOCK_API
      ? mockApi.adminSaveAnnouncement(payload)
      : invokeShop('shop-admin-announcement-save', payload);
  },
  getHomepageConfig() {
    return USE_MOCK_API
      ? mockApi.getHomepageConfig()
      : invokeShop('shop-get-homepage', {});
  },
  trackProductView(payload) {
    return USE_MOCK_API
      ? mockApi.trackProductView(payload)
      : invokeShop('shop-track-view', payload);
  },
  adminGetHomepage() {
    return USE_MOCK_API
      ? mockApi.adminGetHomepage()
      : invokeShop('shop-admin-homepage-get', {});
  },
  adminSaveHomepage(payload) {
    return USE_MOCK_API
      ? mockApi.adminSaveHomepage(payload)
      : invokeShop('shop-admin-homepage-save', payload);
  },
  getActivePromos(params) {
    return USE_MOCK_API
      ? mockApi.getActivePromos(params)
      : invokeShop('shop-get-active-promos', params ?? {});
  },
  getMyPromos(params) {
    return USE_MOCK_API
      ? mockApi.getMyPromos(params)
      : invokeShop('shop-get-my-promos', params ?? {});
  },
  applyPromoCode(params) {
    return USE_MOCK_API ? mockApi.applyPromoCode(params) : invokeShop('shop-apply-code', params);
  },
  adminPromoList() {
    return USE_MOCK_API ? mockApi.adminPromoList() : invokeShop('shop-admin-promo-list', {});
  },
  adminPromoUpsert(payload) {
    return USE_MOCK_API ? mockApi.adminPromoUpsert(payload) : invokeShop('shop-admin-promo-upsert', payload);
  },
  adminPromoDistribute(payload) {
    return USE_MOCK_API
      ? mockApi.adminPromoDistribute(payload)
      : invokeShop('shop-admin-promo-distribute', payload);
  },
  adminPromoRevoke(payload) {
    return USE_MOCK_API ? mockApi.adminPromoRevoke(payload) : invokeShop('shop-admin-promo-revoke', payload);
  },
  adminListCustomers() {
    return USE_MOCK_API ? mockApi.adminListCustomers() : invokeShop('shop-admin-list-customers', {});
  },
  adminSlipsQueue() {
    return USE_MOCK_API ? mockApi.adminSlipsQueue() : invokeShop('shop-admin-slips-queue', {});
  },
  adminSlipReview(payload) {
    return USE_MOCK_API ? mockApi.adminSlipReview(payload) : invokeShop('shop-admin-slip-review', payload);
  },
  listWishlist() {
    return USE_MOCK_API ? mockApi.listWishlist() : invokeShop('shop-list-wishlist', {});
  },
  addWishlist(payload) {
    return USE_MOCK_API ? mockApi.addWishlist(payload) : invokeShop('shop-add-wishlist', payload);
  },
  removeWishlist(params) {
    return USE_MOCK_API ? mockApi.removeWishlist(params) : invokeShop('shop-remove-wishlist', params);
  },
  cancelOrder(params) {
    return USE_MOCK_API ? mockApi.cancelOrder(params) : invokeShop('shop-cancel-order', params);
  },
  adminDashboard() {
    return USE_MOCK_API ? mockApi.adminDashboard() : invokeShop('shop-admin-dashboard', {});
  },
  adminBankList() {
    return USE_MOCK_API ? mockApi.adminBankList() : invokeShop('shop-admin-bank-list', {});
  },
  adminBankUpsert(payload) {
    return USE_MOCK_API ? mockApi.adminBankUpsert(payload) : invokeShop('shop-admin-bank-upsert', payload);
  },
  adminBankDelete(params) {
    return USE_MOCK_API ? mockApi.adminBankDelete(params) : invokeShop('shop-admin-bank-delete', params);
  },
  adminProductsList(params) {
    return USE_MOCK_API ? mockApi.adminProductsList(params) : invokeShop('shop-admin-products-list', params);
  },
  adminProductUpdate(payload) {
    return USE_MOCK_API ? mockApi.adminProductUpdate(payload) : invokeShop('shop-admin-product-update', payload);
  },
  adminSyncDescriptions(params) {
    return USE_MOCK_API
      ? mockApi.adminSyncDescriptions(params)
      : invokeShop('shop-admin-sync-descriptions', params ?? {});
  },
};
