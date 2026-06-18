import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { mapError } from '../lib/error-map.js';

export function useHomeCoupons() {
  const { promos, loading, refresh } = usePromo();
  const { user } = useAuth();
  const toast = useToast();
  const [collectingId, setCollectingId] = useState(null);
  const [collectedIds, setCollectedIds] = useState(() => new Set());

  const visiblePromos = useMemo(
    () =>
      promos.filter(
        (promo) =>
          promo.source === 'broadcast' ||
          (promo.public_code && promo.code_entry_enabled) ||
          promo.source === 'targeted',
      ),
    [promos],
  );

  function isCollected(promo) {
    return collectedIds.has(promo.id) || promo.source === 'targeted';
  }

  async function handleCollect(promo) {
    if (!promo.public_code) return;
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเก็บคูปอง');
      return;
    }
    setCollectingId(promo.id);
    try {
      const res = await shopApi.applyPromoCode({ code: promo.public_code, user_id: user.id });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      setCollectedIds((prev) => new Set(prev).add(promo.id));
      await refresh();
      toast.success('เก็บคูปองแล้ว');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setCollectingId(null);
    }
  }

  return {
    visiblePromos,
    loading,
    collectingId,
    handleCollect,
    isCollected,
  };
}
