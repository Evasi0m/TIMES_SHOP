import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import PromoEditorForm from '../../components/admin/promo-vault/PromoEditorForm.jsx';
import PromoEditorPreview from '../../components/admin/promo-vault/PromoEditorPreview.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import {
  DISCOUNT_MODES,
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
  max_uses_per_user: '',
  is_active: true,
  public_code: '',
  code_entry_enabled: false,
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
          max_uses_per_user: promo.max_uses_per_user ?? '',
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

    if (!form.display_name.trim()) {
      toast.error('กรุณากรอกชื่อที่ลูกค้าเห็น');
      return;
    }
    if (form.code_entry_enabled && !String(form.public_code || '').trim()) {
      toast.error('เปิดกรอกโค้ดต้องระบุโค้ดสาธารณะ');
      return;
    }
    if (form.promo_type !== PROMO_TYPES.FREE_SHIPPING) {
      const value = Number(form.discount_value) || 0;
      if (value <= 0) {
        toast.error('กรุณาระบุมูลค่าส่วนลดมากกว่า 0');
        return;
      }
      if (form.discount_mode === DISCOUNT_MODES.PERCENT && (value <= 0 || value > 100)) {
        toast.error('ส่วนลดเปอร์เซ็นต์ต้องอยู่ระหว่าง 1–100');
        return;
      }
    }

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

  if (loading) {
    return (
      <AdminPageShell
        title={isNew ? 'สร้างโปรใหม่' : 'แก้ไขโปร'}
        backTo="/admin/promos"
        backLabel="← กลับคลังโปร"
      >
        <div className="promo-editor mt-6">
          <div className="admin-card admin-card--pad space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
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
      <div className="promo-editor mt-6">
        <div className="promo-editor__aside lg:order-2">
          <PromoEditorPreview form={form} />
        </div>
        <PromoEditorForm
          form={form}
          update={update}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </AdminPageShell>
  );
}
