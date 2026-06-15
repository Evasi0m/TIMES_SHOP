import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav.jsx';
import BannerAlert from '../../components/ui/BannerAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useShipping } from '../../context/ShippingContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import { fmtTHB } from '../../lib/money.js';
import { DEFAULT_SHIPPING_FEE } from '../../lib/shipping.js';

export default function AdminShippingPage() {
  const toast = useToast();
  const { shippingFee, refresh } = useShipping();
  const [feeInput, setFeeInput] = useState(String(DEFAULT_SHIPPING_FEE));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    shopApi.adminGetShopSettings().then((res) => {
      if (!active) return;
      if (res.ok) setFeeInput(String(res.shipping_fee ?? DEFAULT_SHIPPING_FEE));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading) setFeeInput(String(shippingFee));
  }, [shippingFee, loading]);

  async function handleSave(e) {
    e.preventDefault();
    const shipping_fee = Number(feeInput);
    if (!Number.isFinite(shipping_fee) || shipping_fee < 0) {
      toast.error('กรุณากรอกค่าจัดส่งที่ถูกต้อง (0 ขึ้นไป)');
      return;
    }

    setSaving(true);
    try {
      const res = await shopApi.adminUpdateShopSettings({ shipping_fee });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      await refresh();
      toast.success('บันทึกค่าจัดส่งแล้ว — มีผลกับทุกคำสั่งซื้อ');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/account" className="text-sm text-muted transition hover:text-primary">
          ← กลับบัญชี
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink lg:text-4xl">ตั้งค่าค่าจัดส่ง</h1>
        <p className="mt-2 text-sm text-body">
          ค่าจัดส่งแบบเหมาจ่ายต่อคำสั่งซื้อ — การแก้ไขมีผลกับทุกรายการในร้านทันที
        </p>
      </div>

      <AdminNav />

      <BannerAlert variant="info">
        บันทึกใน browser ชั่วคราว — รอ backend TIMES_POS deploy จึงมีผลกับลูกค้าทุกคน
      </BannerAlert>

      <section className="card-canvas space-y-4 p-4 lg:p-6">
        <div className="rounded-lg bg-surface-soft px-4 py-3 text-sm text-body">
          ค่าจัดส่งปัจจุบัน:{' '}
          <span className="font-semibold text-ink">
            {shippingFee <= 0 ? 'ส่งฟรี' : fmtTHB(shippingFee)}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="shipping-fee" className="mb-1.5 block text-sm font-semibold text-body-strong">
              ค่าจัดส่ง (บาท) ต่อคำสั่งซื้อ
            </label>
            <input
              id="shipping-fee"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className="input"
              disabled={loading || saving}
            />
            <p className="mt-1.5 text-xs text-muted">ตั้งเป็น 0 หากต้องการส่งฟรี</p>
          </div>

          <button type="submit" disabled={loading || saving} className="btn-primary">
            {saving ? 'กำลังบันทึก...' : 'บันทึกค่าจัดส่ง'}
          </button>
        </form>
      </section>
    </div>
  );
}
