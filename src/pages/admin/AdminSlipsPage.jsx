import { useCallback, useEffect, useState } from 'react';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import { fmtTHB, fmtThaiDate } from '../../lib/money.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';

export default function AdminSlipsPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shopApi.adminSlipsQueue();
      if (!res.ok) {
        toast.error(mapError(res));
        setOrders([]);
        return;
      }
      setOrders(res.orders || []);
    } catch (err) {
      toast.error(mapError(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(orderId, action) {
    setBusyId(orderId);
    try {
      const res = await shopApi.adminSlipReview({
        order_id: orderId,
        action,
        note: notes[orderId]?.trim() || null,
      });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      toast.success(res.message || 'บันทึกแล้ว');
      await load();
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPageShell
      wide
      title="ตรวจสลิปโอนเงิน"
      subtitle="เปรียบเทียบยอดบนสลิปกับยอดออเดอร์ด้วยตา — ไม่มี OCR อัตโนมัติ"
      action={
        <button type="button" className="btn-secondary min-h-[44px]" onClick={load} disabled={loading}>
          รีเฟรช
        </button>
      }
    >
      <div className="mt-6 space-y-4">
        {loading && (
          <>
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
          </>
        )}

        {!loading && orders.length === 0 && (
          <div className="admin-card admin-card--pad text-center text-body">
            <p className="font-semibold text-ink">ไม่มีสลิปรอตรวจ</p>
            <p className="mt-1 text-sm text-muted">เมื่อลูกค้าโอนเงินและแนบสลิป รายการจะแสดงที่นี่</p>
          </div>
        )}

        {!loading && orders.map((o) => (
          <article key={o.order_id} className="admin-card admin-card--pad space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl text-ink">{o.web_order_number}</p>
                <p className="mt-1 text-sm text-muted">
                  {fmtThaiDate(o.sale_date)} · {o.recipient_name || '—'} · {o.phone || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{fmtTHB(o.grand_total)}</p>
                <StatusBadge status="pending_review" label="รอตรวจสลิป" />
              </div>
            </div>

            {o.slip_signed_url ? (
              <div className="overflow-hidden rounded-card border border-hairline bg-surface-soft">
                {o.slip_signed_url.toLowerCase().includes('.pdf') ? (
                  <a
                    href={o.slip_signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn block p-4 text-center"
                  >
                    เปิดไฟล์ PDF สลิป
                  </a>
                ) : (
                  <a href={o.slip_signed_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={o.slip_signed_url}
                      alt={`สลิป ${o.web_order_number}`}
                      className="mx-auto max-h-80 w-full object-contain bg-white"
                    />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">ไม่สามารถโหลดตัวอย่างสลิปได้ ({o.payment_slip_path || '—'})</p>
            )}

            <div>
              <label htmlFor={`note-${o.order_id}`} className="mb-1 block text-sm font-semibold text-body-strong">
                หมายเหตุ (ถ้ามี)
              </label>
              <input
                id={`note-${o.order_id}`}
                type="text"
                className="input"
                placeholder="เช่น ยอดไม่ตรง / สลิปไม่ชัด"
                value={notes[o.order_id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [o.order_id]: e.target.value }))}
                disabled={busyId === o.order_id}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-admin-primary min-h-[44px]"
                disabled={busyId === o.order_id}
                onClick={() => review(o.order_id, 'approve')}
              >
                อนุมัติสลิป
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[44px]"
                disabled={busyId === o.order_id}
                onClick={() => review(o.order_id, 'reject')}
              >
                ปฏิเสธ
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminPageShell>
  );
}
