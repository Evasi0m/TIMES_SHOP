import { useState } from 'react';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function WishlistButton({ product, className = '' }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const skuId = product?.tiktok_sku_id || product?.default_sku_id;
  const active = skuId ? isWishlisted(skuId) : false;

  if (!skuId) return null;

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await toggleWishlist({
        ...product,
        tiktok_sku_id: skuId,
      });
      if (res?.ok === false) {
        toast.error(res.message || 'ไม่สามารถบันทึกรายการโปรดได้');
        return;
      }
      toast.success(active ? 'ลบออกจากรายการโปรดแล้ว' : 'เพิ่มในรายการโปรดแล้ว');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`icon-btn wishlist-btn ${active ? 'wishlist-btn--active text-primary' : 'text-muted'} ${className}`.trim()}
      aria-label={active ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      disabled={busy}
      onClick={handleClick}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}
