import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminFormSection from '../../components/admin/AdminFormSection.jsx';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import {
  DISCOUNT_MODES,
  PROMO_TYPE_DESCRIPTIONS,
  PROMO_TYPE_LABELS,
  PROMO_TYPE_LIST,
  PROMO_TYPES,
} from '../../lib/promo-types.js';

const EMPTY = {
  display_name: '',
  promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
  discount_mode: DISCOUNT_MODES.PERCENT,
  discount_value: 10,
  min_order: 0,
  starts_at: '',
  expires_at: '',
  no_expiry: true,
  max_uses: '',
  is_active: true,
};

export default function AdminPromoEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    shopApi.adminPromoList().then((res) => {
      const promo = res.promos?.find((p) => p.id === id);
      if (promo) {
        setForm({
          ...promo,
          starts_at: promo.starts_at ? promo.starts_at.slice(0, 16) : '',
          expires_at: promo.expires_at ? promo.expires_at.slice(0, 16) : '',
          no_expiry: !promo.expires_at,
          max_uses: promo.max_uses ?? '',
        });
      }
      setLoading(false);
    });
  }, [id, isNew]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        id: isNew ? null : id,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.no_expiry ? null : form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      const res = await shopApi.adminPromoUpsert(payload);
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      toast.success(isNew ? 'สร้างโปรแล้ว' : 'บันทึกแล้ว');
      navigate('/admin/promos');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSaving(false);
    }
  }

  const isFreeShipping = form.promo_type === PROMO_TYPES.FREE_SHIPPING;

  if (loading) {
    return (
      <AdminPageShell
        title={isNew ? 'สร้างโปรใหม่' : 'แก้ไขโปร'}
        backTo="/admin/promos"
        backLabel="← กลับคลังโปร"
      >
        <div className="admin-card admin-card--pad space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={isNew ? 'สร้างโปรใหม่' : 'แก้ไขโปร'}
      subtitle="บันทึกแบบร่างก่อน แล้วไปที่คลังโปรเพื่อกด «แจกโปร» ให้ลูกค้าได้รับสิทธิ์"
      backTo="/admin/promos"
      backLabel="← กลับคลังโปร"
    >
      <form onSubmit={handleSubmit} className="admin-card admin-card--pad mt-6">
        <AdminFormSection
          title="ข้อมูลพื้นฐาน"
          description="ชื่อที่ลูกค้าเห็นและประเภทโปร"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              ชื่อที่ลูกค้าเห็น *
            </label>
            <input
              value={form.display_name}
              onChange={(e) => update('display_name', e.target.value)}
              className="input"
              placeholder="เช่น ลด 10% สินค้า"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">ประเภทโปร *</label>
            <select
              value={form.promo_type}
              onChange={(e) => update('promo_type', e.target.value)}
              className="input"
            >
              {PROMO_TYPE_LIST.map((type) => (
                <option key={type} value={type}>
                  {PROMO_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{PROMO_TYPE_DESCRIPTIONS[form.promo_type]}</p>
          </div>
        </AdminFormSection>

        {!isFreeShipping && (
          <AdminFormSection
            title="เงื่อนไขส่วนลด"
            description="รูปแบบและมูลค่าส่วนลด รวมถึงยอดสั่งซื้อขั้นต่ำ"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                  รูปแบบส่วนลด
                </label>
                <select
                  value={form.discount_mode}
                  onChange={(e) => update('discount_mode', e.target.value)}
                  className="input"
                >
                  <option value={DISCOUNT_MODES.PERCENT}>เปอร์เซ็นต์ (%)</option>
                  <option value={DISCOUNT_MODES.AMOUNT}>จำนวนเงิน (บาท)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">มูลค่าส่วนลด</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.discount_value}
                  onChange={(e) => update('discount_value', e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                ยอดสั่งซื้อขั้นต่ำ (บาท)
              </label>
              <input
                type="number"
                min="0"
                value={form.min_order}
                onChange={(e) => update('min_order', e.target.value)}
                className="input"
              />
            </div>
          </AdminFormSection>
        )}

        <AdminFormSection
          title="ระยะเวลาและข้อจำกัด"
          description="กำหนดช่วงใช้งานและจำนวนครั้งที่ใช้ได้"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">เริ่มใช้</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => update('starts_at', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">หมดอายุ</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => update('expires_at', e.target.value)}
                className="input"
                disabled={form.no_expiry}
              />
              <label className="mt-2 flex min-h-[44px] items-center gap-2 text-sm text-body">
                <input
                  type="checkbox"
                  checked={form.no_expiry}
                  onChange={(e) => update('no_expiry', e.target.checked)}
                />
                ไม่มีวันหมดอายุ
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              จำกัดจำนวนครั้ง (ว่าง = ไม่จำกัด)
            </label>
            <input
              type="number"
              min="1"
              value={form.max_uses}
              onChange={(e) => update('max_uses', e.target.value)}
              className="input"
            />
          </div>
        </AdminFormSection>

        <div className="admin-form-footer">
          <Link to="/admin/promos" className="btn-admin-secondary min-h-[44px] flex-1">
            ยกเลิก
          </Link>
          <button type="submit" disabled={saving} className="btn-admin-primary min-h-[44px] flex-1">
            {saving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
          </button>
        </div>
      </form>
    </AdminPageShell>
  );
}
