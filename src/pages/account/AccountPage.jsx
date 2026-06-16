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
      </section>

      {ADMIN_ROLES.has(role) && (
        <section className="admin-zone" aria-label="พื้นที่ผู้ดูแลร้าน">
          <div className="admin-zone__header">
            <h2 className="admin-zone__title">พื้นที่ผู้ดูแลร้าน</h2>
            <span className="admin-badge-staff">ผู้ดูแล</span>
          </div>
          <div className="admin-link-grid">
            <Link to="/admin/promos" className="admin-link-card">
              <span className="admin-link-card__icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
                  <path d="M12 3v9" />
                  <path d="m7 8 5-5 5 5" />
                </svg>
              </span>
              <span className="admin-link-card__body">
                <span className="admin-link-card__title">คลังโปรโมชั่น</span>
                <span className="admin-link-card__desc">สร้าง แก้ไข และแจก code ส่วนลด</span>
              </span>
              <span className="admin-link-card__arrow" aria-hidden="true">›</span>
            </Link>
            <Link to="/admin/shipping" className="admin-link-card">
              <span className="admin-link-card__icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                  <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
              </span>
              <span className="admin-link-card__body">
                <span className="admin-link-card__title">ตั้งค่าค่าจัดส่ง</span>
                <span className="admin-link-card__desc">ค่าจัดส่งเหมาจ่ายต่อคำสั่งซื้อ</span>
              </span>
              <span className="admin-link-card__arrow" aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
      )}

      <button type="button" onClick={handleSignOut} className="btn-ghost w-full text-error">
        ออกจากระบบ
      </button>
    </div>
  );
}
