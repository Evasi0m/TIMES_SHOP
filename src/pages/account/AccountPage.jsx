import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mapError } from '../../lib/error-map.js';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export default function AccountPage() {
  const { user, updateProfile, signOut, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ displayName, phone });
      toast.success('บันทึกข้อมูลแล้ว');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.info('ออกจากระบบแล้ว');
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">บัญชีของฉัน</h1>

      <section className="card-canvas space-y-3 p-4 lg:p-6">
        <h2 className="font-display text-xl text-ink">ข้อมูลส่วนตัว</h2>
        <p className="text-sm text-muted">{user?.email}</p>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">ชื่อที่แสดง</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">เบอร์โทร (ค่าเริ่มต้น)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" type="tel" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </form>
      </section>

      <section className="card-canvas divide-y divide-hairline overflow-hidden">
        <Link
          to="/account/orders"
          className="flex min-h-[44px] items-center justify-between p-4 text-base text-ink transition hover:bg-surface-soft/50"
        >
          ประวัติการสั่งซื้อ <span className="text-muted">›</span>
        </Link>
        <Link
          to="/account/addresses"
          className="flex min-h-[44px] items-center justify-between p-4 text-base text-ink transition hover:bg-surface-soft/50"
        >
          ที่อยู่จัดส่ง <span className="text-muted">›</span>
        </Link>
        <Link
          to="/account/promos"
          className="flex min-h-[44px] items-center justify-between p-4 text-base text-ink transition hover:bg-surface-soft/50"
        >
          สิทธิ์ส่วนลดของฉัน <span className="text-muted">›</span>
        </Link>
        {ADMIN_ROLES.has(role) && (
          <>
            <Link
              to="/admin/promos"
              className="flex min-h-[44px] items-center justify-between p-4 text-base text-ink transition hover:bg-surface-soft/50"
            >
              คลังโปรโมชั่น (Admin) <span className="text-muted">›</span>
            </Link>
            <Link
              to="/admin/shipping"
              className="flex min-h-[44px] items-center justify-between p-4 text-base text-ink transition hover:bg-surface-soft/50"
            >
              ตั้งค่าค่าจัดส่ง (Admin) <span className="text-muted">›</span>
            </Link>
          </>
        )}
      </section>

      <button type="button" onClick={handleSignOut} className="btn-ghost w-full text-error">
        ออกจากระบบ
      </button>
    </div>
  );
}
