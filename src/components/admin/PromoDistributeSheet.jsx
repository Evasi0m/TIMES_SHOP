import { useEffect, useState } from 'react';
import { shopApi } from '../../lib/shop-api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { mapError } from '../../lib/error-map.js';

export default function PromoDistributeSheet({ promo, open, onClose, onSuccess }) {
  const toast = useToast();
  const [mode, setMode] = useState('broadcast');
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [emailInput, setEmailInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    shopApi.adminListCustomers().then((res) => {
      if (res.ok) setCustomers(res.customers || []);
    });
    setMode('broadcast');
    setSelected(new Set());
    setEmailInput('');
  }, [open]);

  if (!open || !promo) return null;

  function toggleUser(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const emails = emailInput
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await shopApi.adminPromoDistribute({
        promo_id: promo.id,
        mode,
        user_ids: mode === 'targeted' ? [...selected] : [],
        emails: mode === 'targeted' ? emails : [],
      });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      toast.success(res.message || 'แจกโปรสำเร็จ');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="ปิด" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="admin-sheet-panel">
        <div className="admin-sheet-panel__header">
          <div>
            <h2 className="font-display text-xl text-ink">แจกโปร: {promo.display_name}</h2>
            <p className="mt-1 text-sm text-muted">ลูกค้าได้รับสิทธิ์ทันที — ไม่ต้องกดเก็บ code</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="admin-sheet-panel__body space-y-4">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-hairline p-3 transition hover:border-ink/20">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'broadcast'}
                  onChange={() => setMode('broadcast')}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-ink">แจกทั้งร้าน</span>
                  <span className="block text-sm text-muted">
                    ทุกคนรวม guest เห็นราคาหลังลดทันที
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-hairline p-3 transition hover:border-ink/20">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'targeted'}
                  onChange={() => setMode('targeted')}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-ink">เลือกลูกค้า</span>
                  <span className="block text-sm text-muted">เฉพาะบัญชีที่เลือกจะได้รับสิทธิ์</span>
                </span>
              </label>
            </div>

            {mode === 'targeted' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                    อีเมลลูกค้า (คั่นด้วย comma)
                  </label>
                  <input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="input"
                    placeholder="demo@times.store, vip@times.store"
                  />
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-hairline p-2">
                  {customers.map((c) => (
                    <label
                      key={c.id}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-surface-soft"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleUser(c.id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium text-ink">{c.display_name}</span>
                        <span className="text-muted"> · {c.email}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="admin-sheet-panel__footer flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost min-h-[44px] flex-1">
              ยกเลิก
            </button>
            <button type="submit" disabled={busy} className="btn-admin-primary min-h-[44px] flex-1">
              {busy ? 'กำลังแจก...' : 'ยืนยันแจกโปร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
