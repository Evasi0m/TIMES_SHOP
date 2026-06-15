import { useEffect, useState } from 'react';
import { shopApi } from '../../lib/shop-api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { mapError } from '../../lib/error-map.js';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';

const EMPTY = {
  id: null,
  label: '',
  recipient_name: '',
  phone: '',
  address_line: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: '',
  is_default: false,
};

export default function AddressesPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view, object = form

  async function load() {
    const res = await shopApi.listAddresses();
    if (res.ok) setAddresses(res.addresses);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!editing.recipient_name.trim() || !editing.phone.trim() || !editing.address_line.trim()) {
      toast.error('กรุณากรอกชื่อผู้รับ เบอร์โทร และที่อยู่');
      return;
    }
    try {
      const res = await shopApi.upsertAddress(editing);
      if (!res.ok) throw new Error(res.error);
      toast.success('บันทึกที่อยู่แล้ว');
      setEditing(null);
      setLoading(true);
      await load();
    } catch (err) {
      toast.error(mapError(err));
    }
  }

  async function handleDelete(id) {
    try {
      const res = await shopApi.deleteAddress({ id });
      if (!res.ok) throw new Error(res.error);
      toast.info('ลบที่อยู่แล้ว');
      setLoading(true);
      await load();
    } catch (err) {
      toast.error(mapError(err));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-display text-3xl text-ink">{editing.id ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่'}</h1>
        <form onSubmit={handleSave} className="card-canvas space-y-3 p-4">
          <Field label="ป้ายกำกับ (เช่น บ้าน, ที่ทำงาน)" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} />
          <Field label="ชื่อผู้รับ *" value={editing.recipient_name} onChange={(v) => setEditing({ ...editing, recipient_name: v })} />
          <Field label="เบอร์โทร *" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} type="tel" />
          <Field label="ที่อยู่ *" value={editing.address_line} onChange={(v) => setEditing({ ...editing, address_line: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="แขวง/ตำบล" value={editing.subdistrict} onChange={(v) => setEditing({ ...editing, subdistrict: v })} />
            <Field label="เขต/อำเภอ" value={editing.district} onChange={(v) => setEditing({ ...editing, district: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="จังหวัด *" value={editing.province} onChange={(v) => setEditing({ ...editing, province: v })} />
            <Field label="รหัสไปรษณีย์ *" value={editing.postal_code} onChange={(v) => setEditing({ ...editing, postal_code: v })} type="tel" />
          </div>
          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={editing.is_default}
              onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })}
            />
            ตั้งเป็นที่อยู่เริ่มต้น
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              บันทึก
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline flex-1">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink lg:text-4xl">ที่อยู่จัดส่ง</h1>
        <button type="button" onClick={() => setEditing({ ...EMPTY })} className="btn-outline px-4">
          เพิ่มที่อยู่
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="ยังไม่มีที่อยู่" description="เพิ่มที่อยู่จัดส่งเพื่อให้สั่งซื้อได้สะดวกขึ้น" />
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="card-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium text-ink">
                    {a.recipient_name} · {a.phone}
                    {a.is_default && (
                      <span className="badge-pill ml-2">ค่าเริ่มต้น</span>
                    )}
                  </p>
                  {a.label && <p className="text-xs text-muted">{a.label}</p>}
                  <p className="mt-1 text-muted">
                    {[a.address_line, a.subdistrict, a.district, a.province, a.postal_code]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-hairline pt-2 text-sm">
                <button type="button" onClick={() => setEditing(a)} className="link-btn">
                  แก้ไข
                </button>
                <button type="button" onClick={() => handleDelete(a.id)} className="btn-ghost px-2 text-error">
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-body">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}
