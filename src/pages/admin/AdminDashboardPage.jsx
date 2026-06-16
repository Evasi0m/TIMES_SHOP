import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { fmtTHB } from '../../lib/money.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi.adminDashboard().then((res) => {
      if (res.ok) setStats(res.stats);
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell title="แดชบอร์ด" subtitle="สรุปยอดขายออเดอร์เว็บ 30 วันล่าสุด">
      {loading ? (
        <div className="admin-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : stats ? (
        <div className="admin-stats-grid mt-6">
          <StatCard label="ออเดอร์ 30 วัน" value={stats.orders_30d} />
          <StatCard label="รอยืนยัน" value={stats.pending_orders} />
          <StatCard label="ยืนยันแล้ว" value={stats.active_orders} />
          <StatCard label="ยอดขาย 30 วัน" value={fmtTHB(stats.revenue_30d)} />
          <StatCard label="รอตรวจสลิป" value={stats.slips_pending} />
        </div>
      ) : (
        <p className="text-muted">โหลดข้อมูลไม่สำเร็จ</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/slips" className="btn-admin-secondary">ตรวจสลิป</Link>
        <Link to="/admin/promos" className="btn-admin-secondary">คลังโปร</Link>
        <Link to="/admin/products" className="btn-admin-secondary">จัดการสินค้า</Link>
        <Link to="/admin/banks" className="btn-admin-secondary">บัญชีธนาคาร</Link>
      </div>
    </AdminPageShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-card admin-card--pad">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
