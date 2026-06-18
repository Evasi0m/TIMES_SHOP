import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'times_shop_cart_v1';
const GUEST_STORAGE_KEY = 'times_shop_cart_guest_v1';

function readCart(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeCartItems(existing, incoming) {
  const map = new Map(existing.map((i) => [i.tiktok_sku_id, { ...i }]));
  for (const item of incoming) {
    const prev = map.get(item.tiktok_sku_id);
    if (prev) {
      const stock = item.stock_available ?? prev.stock_available ?? 99;
      map.set(item.tiktok_sku_id, {
        ...prev,
        ...item,
        quantity: Math.min(prev.quantity + item.quantity, stock),
      });
    } else {
      map.set(item.tiktok_sku_id, item);
    }
  }
  return [...map.values()].filter((i) => i.quantity > 0);
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prevUserIdRef = useRef(userId);
  const [items, setItems] = useState(() =>
    readCart(userId ? STORAGE_KEY : GUEST_STORAGE_KEY)
  );

  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (!prev && userId) {
      const guestItems = readCart(GUEST_STORAGE_KEY);
      if (guestItems.length) {
        setItems((current) => mergeCartItems(readCart(STORAGE_KEY), mergeCartItems(current, guestItems)));
        try {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const key = userId ? STORAGE_KEY : GUEST_STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [items, userId]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.tiktok_sku_id === product.tiktok_sku_id);
      if (existing) {
        return prev.map((i) =>
          i.tiktok_sku_id === product.tiktok_sku_id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          tiktok_sku_id: product.tiktok_sku_id,
          product_name: product.product_name,
          sku_name: product.sku_name,
          seller_sku: product.seller_sku,
          image_url: product.image_url,
          unit_price: product.unit_price,
          stock_available: product.stock_available,
          quantity,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((skuId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.tiktok_sku_id === skuId ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((skuId) => {
    setItems((prev) => prev.filter((i) => i.tiktok_sku_id !== skuId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const replaceCart = useCallback((product, quantity = 1) => {
    setItems([
      {
        tiktok_sku_id: product.tiktok_sku_id,
        product_name: product.product_name,
        sku_name: product.sku_name,
        seller_sku: product.seller_sku,
        image_url: product.image_url,
        unit_price: product.unit_price,
        stock_available: product.stock_available,
        quantity,
      },
    ]);
  }, []);

  const applyValidatedItems = useCallback((validated) => {
    setItems((prev) =>
      prev
        .map((i) => {
          const match = validated.find((v) => v.tiktok_sku_id === i.tiktok_sku_id);
          if (!match) return i;
          return {
            ...i,
            unit_price: match.unit_price ?? i.unit_price,
            stock_available: match.stock_available ?? i.stock_available,
            sku_name: match.sku_name ?? i.sku_name,
            seller_sku: match.seller_sku ?? i.seller_sku,
            image_url: match.image_url ?? i.image_url,
          };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      applyValidatedItems,
      replaceCart,
    };
  }, [items, addItem, setQuantity, removeItem, clearCart, applyValidatedItems, replaceCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
