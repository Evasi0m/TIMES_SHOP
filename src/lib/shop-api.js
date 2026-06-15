// Single data-access layer for the storefront. Toggle between local mocks and
// the real shop-* Edge Functions via VITE_USE_MOCK_API. The UI only ever imports
// from here, so swapping to real backend requires no page changes.

import { USE_MOCK_API } from './config.js';
import { supabase } from './supabase.js';
import { mockApi } from '../mocks/shop-api.mock.js';

async function invoke(fn, body) {
  try {
    const { data, error } = await supabase.functions.invoke(fn, { body });
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

async function invokeMultipart(fn, formData) {
  const { data, error } = await supabase.functions.invoke(fn, { body: formData });
  if (error) return { ok: false, error: 'network_error', message: error.message };
  return data;
}

export const shopApi = {
  getCatalog(params) {
    const run = USE_MOCK_API ? mockApi.getCatalog(params) : invoke('shop-get-catalog', params);
    return run.then((res) => res).catch((err) => ({
      ok: false,
      error: 'network_error',
      message: err instanceof Error ? err.message : 'โหลดสินค้าไม่สำเร็จ',
    }));
  },
  getProduct(params) {
    return USE_MOCK_API ? mockApi.getProduct(params) : invoke('shop-get-product', params);
  },
  validateCart(params) {
    return USE_MOCK_API ? mockApi.validateCart(params) : invoke('shop-validate-cart', params);
  },
  placeOrder(payload) {
    // TODO(TIMES_POS): guest checkout — optional JWT on shop-place-order
    return USE_MOCK_API ? mockApi.placeOrder(payload) : invoke('shop-place-order', payload);
  },
  getMyOrders(params) {
    return USE_MOCK_API ? mockApi.getMyOrders(params) : invoke('shop-get-my-orders', params);
  },
  getOrder(params) {
    // Reuse my-orders on the real backend until a dedicated endpoint exists.
    return USE_MOCK_API ? mockApi.getOrder(params) : invoke('shop-get-my-orders', params);
  },
  getPaymentInfo() {
    return USE_MOCK_API ? mockApi.getPaymentInfo() : invoke('shop-get-payment-info', {});
  },
  uploadSlip(file, options = {}) {
    // TODO(TIMES_POS): guest checkout — optional JWT on shop-upload-slip / shop-verify-slip
    if (USE_MOCK_API) return mockApi.uploadSlip(file, options);
    const fd = new FormData();
    fd.append('file', file);
    return invokeMultipart('shop-upload-slip', fd);
  },
  verifySlip(params) {
    return USE_MOCK_API ? mockApi.verifySlip(params) : invoke('shop-verify-slip', params);
  },
  listAddresses() {
    return USE_MOCK_API ? mockApi.listAddresses() : invoke('shop-list-addresses', {});
  },
  upsertAddress(payload) {
    return USE_MOCK_API ? mockApi.upsertAddress(payload) : invoke('shop-upsert-address', payload);
  },
  deleteAddress(params) {
    return USE_MOCK_API ? mockApi.deleteAddress(params) : invoke('shop-delete-address', params);
  },
  // TODO(TIMES_POS): deploy shop-admin-settings-get / shop-admin-settings-update
  adminGetShopSettings() {
    return USE_MOCK_API ? mockApi.adminGetShopSettings() : invoke('shop-admin-settings-get', {});
  },
  adminUpdateShopSettings(payload) {
    return USE_MOCK_API
      ? mockApi.adminUpdateShopSettings(payload)
      : invoke('shop-admin-settings-update', payload);
  },
  // TODO(TIMES_POS): deploy shop-get-active-promos, shop-admin-promo-*
  getActivePromos(params) {
    return USE_MOCK_API ? mockApi.getActivePromos(params) : invoke('shop-get-active-promos', params);
  },
  getMyPromos(params) {
    return USE_MOCK_API ? mockApi.getMyPromos(params) : invoke('shop-get-my-promos', params);
  },
  adminPromoList() {
    return USE_MOCK_API ? mockApi.adminPromoList() : invoke('shop-admin-promo-list', {});
  },
  adminPromoUpsert(payload) {
    return USE_MOCK_API ? mockApi.adminPromoUpsert(payload) : invoke('shop-admin-promo-upsert', payload);
  },
  adminPromoDistribute(payload) {
    return USE_MOCK_API
      ? mockApi.adminPromoDistribute(payload)
      : invoke('shop-admin-promo-distribute', payload);
  },
  adminPromoRevoke(payload) {
    return USE_MOCK_API ? mockApi.adminPromoRevoke(payload) : invoke('shop-admin-promo-revoke', payload);
  },
  adminListCustomers() {
    return USE_MOCK_API ? mockApi.adminListCustomers() : invoke('shop-admin-customer-list', {});
  },
};
