import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav.jsx';
import PromoDistributeSheet from '../../components/admin/PromoDistributeSheet.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usePromo } from '../../context/PromoContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import {
  formatPromoDiscount,
  formatPromoPeriod,
  getStatusLabel,
  statusBadgeClass,
} from '../../lib/promo-display.js';
import { PROMO_TYPE_LABELS, PROMO_TYPE_LIST } from '../../lib/promo-types.js';

export default function AdminPromosPage() {
  const toast = useToast();
  const { refresh: refreshCustomerPromos } = usePromo();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [distributePromo, setDistributePromo] = useState(null);

  const load = useCallback(async () => {
    const res = await shopApi.adminPromoList();
    if (res.ok) setPromos(res.promos || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return promos;
    return promos.filter((p) => p.promo_type === filterType);
  }, [promos, filterType]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(PROMO_TYPE_LIST.map((t) => [t, []]));
    for (const p of filtered) {
      if (map[p.promo_type]) map[p.promo_type].push(p);
    }
    return map;
  }, [filtered]);

  async function handleRevoke(promo) {
    if (!window.confirm(`ปิดใช้งาน "${promo.display_name}"?`)) return;
    const res = await shopApi.adminPromoRevoke({ promo_id: promo.id });
    if (!res.ok) {
      toast.error(mapError(res));
      return;
    }
    toast.success(res.message || 'ปิดใช้งานแล้ว');
    load();
    refreshCustomerPromos();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/account" className="text-sm text-muted transition hover:text-primary">
            ← กลับบัญชี
          </Link>
          <h1 className="mt-2 font-display text-3xl text-ink lg:text-4xl">คลังโปรโมชั่น</h1>
          <p className="mt-2 text-sm text-body">
            สร้างและแจก code ส่วนลด — ลูกค้าได้รับสิทธิ์ทันที ราคาบนเว็บหลังลดอัตโนมัติ
          </p>
        </div>
        <Link to="/admin/promos/new" className="btn-primary shrink-0">
          + สร้างโปรใหม่
        </Link>
      </div>

      <AdminNav />

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filterType === 'all'} onClick={() => setFilterType('all')} label="ทั้งหมด" />
        {PROMO_TYPE_LIST.map((type) => (
          <FilterChip
            key={type}
            active={filterType === type}
            onClick={() => setFilterType(type)}
            label={PROMO_TYPE_LABELS[type]}
          />
        ))}
      </div>

      {loading ? (
        <p className="text-muted">กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <div className="card-canvas p-8 text-center">
          <p className="text-body">ยังไม่มีโปรในคลัง</p>
          <Link to="/admin/promos/new" className="btn-primary mt-4 inline-flex">
            สร้างโปรแรก
          </Link>
        </div>
      ) : filterType === 'all' ? (
        <div className="space-y-8">
          {PROMO_TYPE_LIST.map((type) =>
            grouped[type]?.length ? (
              <section key={type} className="space-y-3">
                <h2 className="font-display text-lg text-ink">{PROMO_TYPE_LABELS[type]}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {grouped[type].map((promo) => (
                    <PromoCard
                      key={promo.id}
                      promo={promo}
                      onDistribute={() => setDistributePromo(promo)}
                      onRevoke={() => handleRevoke(promo)}
                    />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onDistribute={() => setDistributePromo(promo)}
              onRevoke={() => handleRevoke(promo)}
            />
          ))}
        </div>
      )}

      <PromoDistributeSheet
        promo={distributePromo}
        open={Boolean(distributePromo)}
        onClose={() => setDistributePromo(null)}
        onSuccess={() => {
          load();
          refreshCustomerPromos();
        }}
      />
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition min-h-[44px] ${
        active ? 'bg-primary text-on-primary' : 'bg-surface-soft text-body hover:bg-surface-cream-strong'
      }`}
    >
      {label}
    </button>
  );
}

function PromoCard({ promo, onDistribute, onRevoke }) {
  return (
    <article className="card-canvas flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`${statusBadgeClass(promo.status)} text-xs`}>
            {getStatusLabel(promo.status)}
          </span>
          <h3 className="mt-2 font-display text-lg text-ink">{promo.display_name}</h3>
          <p className="text-sm font-semibold text-primary">{formatPromoDiscount(promo)}</p>
        </div>
        <span className="badge-pill text-xs">{PROMO_TYPE_LABELS[promo.promo_type]}</span>
      </div>
      <p className="text-xs text-muted">{formatPromoPeriod(promo)}</p>
      {promo.grant_count > 0 && (
        <p className="text-xs text-body">แจกแล้ว {promo.grant_count} ราย</p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <Link to={`/admin/promos/${promo.id}/edit`} className="btn-ghost text-sm">
          แก้ไข
        </Link>
        {promo.status !== 'inactive' && (
          <>
            <button type="button" onClick={onDistribute} className="btn-secondary text-sm">
              แจกโปร
            </button>
            <button type="button" onClick={onRevoke} className="btn-ghost text-sm text-error">
              ปิดใช้งาน
            </button>
          </>
        )}
      </div>
    </article>
  );
}
