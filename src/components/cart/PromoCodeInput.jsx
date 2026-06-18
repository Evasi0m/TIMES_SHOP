import { useState } from 'react';
import { usePromo } from '../../context/PromoContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';

export default function PromoCodeInput({ className = '' }) {
  const { user } = useAuth();
  const { couponCode, setCouponCode, refresh } = usePromo();
  const toast = useToast();
  const [input, setInput] = useState(couponCode || '');
  const [applying, setApplying] = useState(false);

  async function handleApply(e) {
    e.preventDefault();
    const code = input.trim();
    if (!code) {
      toast.error('กรุณากรอกโค้ดส่วนลด');
      return;
    }
    setApplying(true);
    try {
      const res = await shopApi.applyPromoCode({ code, user_id: user?.id });
      if (!res.ok) {
        const msg = mapError(res);
        toast.error(msg);
        return;
      }
      setCouponCode(code);
      await refresh();
      toast.success(res.message || 'ใช้โค้ดส่วนลดสำเร็จ');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setApplying(false);
    }
  }

  function handleClear() {
    setInput('');
    setCouponCode('');
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="กรอกโค้ดส่วนลด"
          className="input min-h-[44px] flex-1 uppercase"
          aria-label="โค้ดส่วนลด"
        />
        <button
          type="submit"
          disabled={applying}
          className="btn-secondary min-h-[44px] shrink-0 px-4"
        >
          {applying ? '...' : 'ใช้โค้ด'}
        </button>
      </form>
      {couponCode && (
        <div className="promo-flash flex items-center justify-between text-sm">
          <span className="text-success">ใช้โค้ด: {couponCode}</span>
          <button type="button" onClick={handleClear} className="text-muted underline">
            ลบโค้ด
          </button>
        </div>
      )}
    </div>
  );
}
