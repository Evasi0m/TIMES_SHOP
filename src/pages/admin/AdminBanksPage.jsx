import { useEffect, useState } from 'react';
import AdminFormSection from '../../components/admin/AdminFormSection.jsx';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';

const EMPTY = {
  bank_name: '',
  account_number: '',
  account_name: '',
  is_active: true,
};

export default function AdminBanksPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await shopApi.adminBankList();
    if (res.ok) setAccounts(res.accounts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(acc) {
    setEditingId(acc.id);
    setForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_name: acc.account_name,
      is_active: acc.is_active,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await shopApi.adminBankUpsert({ ...form, id: editingId });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      toast.success('บันทึกบัญชีแล้ว');
      setForm(EMPTY);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('ลบบัญชีนี้?')) return;
    const res = await shopApi.adminBankDelete({ id });
    if (!res.ok) {
      toast.error(mapError(res));
      return;
    }
    toast.success('ลบแล้ว');
    load();
  }

  return (
    <AdminPageShell title="บัญชีธนาคาร" subtitle="บัญชีรับโอนที่แสดงตอน checkout">
      <form onSubmit={handleSave} className="admin-card admin-card--pad mt-6 space-y-4">
        <AdminFormSection title={editingId ? 'แก้ไขบัญชี' : 'เพิ่มบัญชี'}>
          <input className="input" placeholder="ชื่อธนาคาร" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} required />
          <input className="input" placeholder="เลขบัญชี" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required />
          <input className="input" placeholder="ชื่อบัญชี" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            เปิดใช้งาน
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-admin-primary flex-1">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            {editingId && (
              <button type="button" className="btn-admin-secondary" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
                ยกเลิก
              </button>
            )}
          </div>
        </AdminFormSection>
      </form>

      <div className="admin-card admin-card--pad mt-6">
        {loading ? (
          <p className="text-muted">กำลังโหลด...</p>
        ) : accounts.length === 0 ? (
          <p className="text-muted">ยังไม่มีบัญชี — ลูกค้าโอนเงินจะเห็นข้อความให้ติดต่อร้าน</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((acc) => (
              <li key={acc.id} className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
                <div>
                  <p className="font-medium text-ink">{acc.bank_name}</p>
                  <p className="text-sm text-body">{acc.account_number}</p>
                  <p className="text-sm text-muted">{acc.account_name}</p>
                  {!acc.is_active && <span className="text-xs text-warning">ปิดใช้งาน</span>}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-admin-secondary text-sm" onClick={() => startEdit(acc)}>แก้ไข</button>
                  <button type="button" className="btn-admin-secondary text-sm text-error" onClick={() => handleDelete(acc.id)}>ลบ</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPageShell>
  );
}
