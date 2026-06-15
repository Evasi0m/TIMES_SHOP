// Centralized access to Vite env + app-wide constants.

export const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'TIMES STORE';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Mock only when explicitly enabled. Catalog must come from shop-get-catalog (TikTok sync).
export const USE_MOCK_API =
  String(import.meta.env.VITE_USE_MOCK_API ?? 'false').toLowerCase() === 'true';

export const GOOGLE_REDIRECT_URL = import.meta.env.VITE_GOOGLE_REDIRECT_URL || '';

// react-router basename for the GitHub Pages subpath deploy.
export const ROUTER_BASENAME = '/TIMES_SHOP';

// Free shipping for MVP (see SHOP_REQUIREMENTS §12 Q9).
/** @deprecated Use ShippingContext / DEFAULT_SHIPPING_FEE from ./shipping.js */
export { DEFAULT_SHIPPING_FEE as SHIPPING_FEE } from './shipping.js';
