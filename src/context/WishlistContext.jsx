import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { shopApi } from '../lib/shop-api.js';

const WishlistContext = createContext(null);
const GUEST_KEY = 'times_shop_wishlist_v1';

function readGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(readGuestWishlist);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems(readGuestWishlist());
      return;
    }
    setLoading(true);
    const res = await shopApi.listWishlist();
    if (res.ok) setItems(res.items || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (user?.id) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, user?.id]);

  const isWishlisted = useCallback(
    (skuId) => items.some((i) => i.tiktok_sku_id === skuId),
    [items],
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const skuId = product.tiktok_sku_id;
      const exists = items.some((i) => i.tiktok_sku_id === skuId);
      if (user?.id) {
        if (exists) {
          const res = await shopApi.removeWishlist({ tiktok_sku_id: skuId });
          if (res.ok) setItems((prev) => prev.filter((i) => i.tiktok_sku_id !== skuId));
          return !res.ok ? res : { ok: true, added: false };
        }
        const res = await shopApi.addWishlist({
          tiktok_sku_id: skuId,
          tiktok_product_id: product.tiktok_product_id,
          product_name: product.product_name,
          sku_name: product.sku_name,
          image_url: product.image_url,
          unit_price: product.unit_price,
        });
        if (res.ok) setItems((prev) => [...prev, res.item]);
        return res;
      }
      if (exists) {
        setItems((prev) => prev.filter((i) => i.tiktok_sku_id !== skuId));
        return { ok: true, added: false };
      }
      setItems((prev) => [
        ...prev,
        {
          tiktok_sku_id: skuId,
          tiktok_product_id: product.tiktok_product_id,
          product_name: product.product_name,
          sku_name: product.sku_name,
          image_url: product.image_url,
          unit_price: product.unit_price,
        },
      ]);
      return { ok: true, added: true };
    },
    [items, user?.id],
  );

  const value = useMemo(
    () => ({ items, loading, refresh, isWishlisted, toggleWishlist, count: items.length }),
    [items, loading, refresh, isWishlisted, toggleWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
