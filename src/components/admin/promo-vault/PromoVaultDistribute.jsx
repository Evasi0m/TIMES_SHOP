import { useEffect, useState } from 'react';
import SlideSheet from '../../motion/SlideSheet.jsx';
import { shopApi } from '../../../lib/shop-api.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { mapError } from '../../../lib/error-map.js';
import { formatPromoDiscount } from '../../../lib/promo-display.js';
import { PromoVaultChipPreview } from './PromoVaultCard.jsx';

function DistributeForm({ promo, onClose, onSuccess }) {
  const toast = useToast();
  const [mode, setMode] = useState('broadcast');
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [emailInput, setEmailInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    shopApi.adminListCustomers().then((res) => {
      if (res.ok) setCustomers(res.customers || []);
    });
    setMode('broadcast');
    setSelected(new Set());
    setEmailInput('');
  }, [promo?.id]);

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

  if (!promo) return null;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="admin-sheet-panel__header">
        <div>
          <h2 className="font-display text-xl text-ink">แจกโปร</h2>
          <p className="mt-1 text-sm text-muted">ลูกค้าได้รับสิทธิ์ทันที — ไม่ต้องกดเก็บ code</p>
        </div>
      </div>

      <div className="admin-sheet-panel__body space-y-4">
        <div className="promo-vault-distribute__summary space-y-2">
          <PromoVaultChipPreview promo={promo} />
          <p className="text-sm font-semibold text-ink">{promo.display_name}</p>
          <p className="text-xs text-muted">{formatPromoDiscount(promo)}</p>
        </div>

        <div className="space-y-2">
          <label
            className={`promo-vault-distribute__mode${
              mode === 'broadcast' ? ' promo-vault-distribute__mode--active' : ''
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'broadcast'}
              onChange={() => setMode('broadcast')}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-ink">แจกทั้งร้าน</span>
              <span className="block text-sm text-muted">ทุกคนรวม guest เห็นราคาหลังลดทันที</span>
            </span>
          </label>
          <label
            className={`promo-vault-distribute__mode${
              mode === 'targeted' ? ' promo-vault-distribute__mode--active' : ''
            }`}
          >
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
        <button
          type="submit"
          disabled={busy}
          className={`btn-admin-primary min-h-[44px] flex-1${busy ? ' is-loading' : ''}`}
        >
          {busy ? 'กำลังแจก...' : 'ยืนยันแจกโปร'}
        </button>
      </div>
    </form>
  );
}

function DesktopModal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="promo-vault-modal hidden lg:flex" role="dialog" aria-modal="true">
      <button type="button" className="promo-vault-modal__backdrop" aria-label="ปิด" onClick={onClose} />
      <div className="promo-vault-modal__panel admin-sheet-panel">{children}</div>
    </div>
  );
}

export default function PromoVaultDistribute({ promo, open, onClose, onSuccess }) {
  const sheetOpen = open && !!promo;

  return (
    <>
      <div className="lg:hidden">
        <SlideSheet
          open={sheetOpen}
          onClose={onClose}
          side="bottom"
          ariaLabel="แจกโปรโมชั่น"
          panelClassName="admin-sheet-panel flex max-h-[92vh] w-full max-w-lg flex-col"
          zIndex={80}
        >
          {promo && <DistributeForm promo={promo} onClose={onClose} onSuccess={onSuccess} />}
        </SlideSheet>
      </div>

      <DesktopModal open={sheetOpen} onClose={onClose}>
        {promo && <DistributeForm promo={promo} onClose={onClose} onSuccess={onSuccess} />}
      </DesktopModal>
    </>
  );
}
