// Minimal TikTok Shop Open API client for product descriptions (Shop project).
// Primary path: POS bridge (uses POS TikTok credentials). Fallback: Shop env secrets.

import { createPosServiceClient } from './pos-client.ts';
import {
  extractDescriptionFromProduct,
  unwrapProductDetail,
} from './tiktok-product-description.ts';

export const API_BASE = 'https://open-api.tiktokglobalshop.com';

export type TikTokCredentials = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher: string;
};

function envCredentials(): TikTokCredentials | null {
  const appKey = Deno.env.get('TIKTOK_APP_KEY') || '';
  const appSecret = Deno.env.get('TIKTOK_APP_SECRET') || '';
  const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN') || '';
  const shopCipher = Deno.env.get('TIKTOK_SHOP_CIPHER') || '';
  if (!appKey || !appSecret || !accessToken || !shopCipher) return null;
  return { appKey, appSecret, accessToken, shopCipher };
}

async function posTokenCredentials(): Promise<TikTokCredentials | null> {
  const appKey = Deno.env.get('TIKTOK_APP_KEY') || '';
  const appSecret = Deno.env.get('TIKTOK_APP_SECRET') || '';
  if (!appKey || !appSecret) return null;

  const pos = createPosServiceClient();
  if (!pos) return null;

  const { data, error } = await pos
    .from('tiktok_tokens')
    .select('access_token, shop_cipher, access_token_expires_at')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data?.access_token || !data?.shop_cipher) return null;

  const expiresAt = data.access_token_expires_at
    ? new Date(String(data.access_token_expires_at)).getTime()
    : 0;
  if (expiresAt > 0 && expiresAt <= Date.now()) return null;

  return {
    appKey,
    appSecret,
    accessToken: String(data.access_token),
    shopCipher: String(data.shop_cipher),
  };
}

export async function resolveTikTokCredentials(): Promise<TikTokCredentials | null> {
  return envCredentials() ?? await posTokenCredentials();
}

export async function isTikTokConfigured(): Promise<boolean> {
  if (await resolveTikTokCredentials()) return true;
  return Boolean(
    (Deno.env.get('SHOP_POS_BRIDGE_SECRET') || '').trim()
    || (Deno.env.get('POS_SERVICE_ROLE_KEY') || '').trim(),
  );
}

async function fetchViaPosBridge(productId: string): Promise<string | null> {
  const posUrl = Deno.env.get('POS_SUPABASE_URL') || 'https://pxenybeudcsddsnkduaj.supabase.co';
  const bridgeSecret = (Deno.env.get('SHOP_POS_BRIDGE_SECRET') || '').trim();
  const posKey = (Deno.env.get('POS_SERVICE_ROLE_KEY') || '').trim();
  const authKey = bridgeSecret || posKey;
  if (!authKey) return null;

  const res = await fetch(`${posUrl}/functions/v1/shop-get-tiktok-description`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authKey}`,
      apikey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tiktok_product_id: productId }),
  });

  const json = await res.json().catch(() => null);
  if (!json?.ok) {
    const msg = json?.message || json?.error || `POS bridge HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  const text = String(json.description ?? '').trim();
  return text || null;
}

async function signRequest(
  path: string,
  query: Record<string, string | number | undefined | null>,
  body: string,
  appSecret: string,
): Promise<string> {
  const params = { ...query };
  delete params.sign;
  delete (params as Record<string, unknown>).access_token;
  const keys = Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== '')
    .sort();
  let base = appSecret + path;
  for (const k of keys) {
    base += k + String(params[k]);
  }
  if (body) base += body;
  base += appSecret;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function apiGet(
  path: string,
  extraQuery: Record<string, string | number>,
  creds: TikTokCredentials,
): Promise<Record<string, unknown>> {
  const timestamp = Math.floor(Date.now() / 1000);
  const query: Record<string, string | number> = {
    app_key: creds.appKey,
    timestamp,
    shop_cipher: creds.shopCipher,
    ...extraQuery,
  };
  const bodyStr = '';
  const sign = await signRequest(path, query, bodyStr, creds.appSecret);
  query.sign = sign;
  const qs = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  );
  const url = `${API_BASE}${path}?${qs}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tts-access-token': creds.accessToken,
    },
  });
  const json = await res.json();
  if (json?.code !== 0) {
    const code = json?.code != null ? `[${json.code}] ` : '';
    throw new Error(`${code}${json?.message || `TikTok API ${path} failed`}`);
  }
  return json.data as Record<string, unknown>;
}

async function fetchDirectFromTikTok(productId: string, creds: TikTokCredentials): Promise<string | null> {
  const raw = await apiGet(
    `/product/202309/products/${productId}`,
    {},
    creds,
  );
  const data = unwrapProductDetail(raw);
  return extractDescriptionFromProduct(data);
}

/** Fetch raw description text — POS bridge first, then direct TikTok if configured. */
export async function fetchTikTokProductDescription(productId: string): Promise<string | null> {
  let bridgeError: Error | null = null;

  if ((Deno.env.get('SHOP_POS_BRIDGE_SECRET') || '').trim() || (Deno.env.get('POS_SERVICE_ROLE_KEY') || '').trim()) {
    try {
      const fromBridge = await fetchViaPosBridge(productId);
      if (fromBridge) return fromBridge;
    } catch (e) {
      bridgeError = e instanceof Error ? e : new Error(String(e));
    }
  }

  const creds = await resolveTikTokCredentials();
  if (creds) {
    try {
      return await fetchDirectFromTikTok(productId, creds);
    } catch (e) {
      if (bridgeError) throw bridgeError;
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  if (bridgeError) throw bridgeError;
  return null;
}
