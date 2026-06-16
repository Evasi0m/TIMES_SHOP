import { useEffect, useState } from 'react';
import AdminFormSection from '../../components/admin/AdminFormSection.jsx';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import ShippingBadge from '../../components/ShippingBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useShipping } from '../../context/ShippingContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import { fmtTHB } from '../../lib/money.js';
import { DEFAULT_SHIPPING_FEE } from '../../lib/shipping.js';

export default function AdminShippingPage() {
  const toast = useToast();
  const { shippingFee, shippingPromoText, refresh } = useShipping();
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

  const previewLabel = shippingFee <= 0 ? 'ส่งฟรี' : fmtTHB(shippingFee);

  return (
    <AdminPageShell
      title="ตั้งค่าค่าจัดส่ง"
      subtitle="ค่าจัดส่งแบบเหมาจ่ายต่อคำสั่งซื้อ — การแก้ไขมีผลกับทุกรายการในร้านทันที"
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="admin-card admin-card--pad admin-preview-panel">
          <div>
            <p className="admin-preview-panel__label">ค่าจัดส่งปัจจุบัน</p>
            <p className="admin-preview-panel__value">{previewLabel}</p>
          </div>

          <div className="admin-preview-panel__sample">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              ตัวอย่างบนหน้าร้าน
            </p>
            <ShippingBadge />
            <p className="mt-3 text-sm text-body">{shippingPromoText}</p>
          </div>
        </section>

        <section className="admin-card admin-card--pad">
          <form onSubmit={handleSave}>
            <AdminFormSection
              title="แก้ไขค่าจัดส่ง"
              description="ตั้งเป็น 0 หากต้องการส่งฟรี — มีผลกับทุกคำสั่งซื้อใหม่"
            >
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
              </div>
            </AdminFormSection>

            <div className="admin-form-footer">
              <button type="submit" disabled={loading || saving} className="btn-admin-primary min-h-[44px]">
                {saving ? 'กำลังบันทึก...' : 'บันทึกค่าจัดส่ง'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
