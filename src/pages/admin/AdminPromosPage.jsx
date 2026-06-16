import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import AdminStatGrid from '../../components/admin/AdminStatGrid.jsx';
import PromoDistributeSheet from '../../components/admin/PromoDistributeSheet.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
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

  const stats = useMemo(() => {
    const active = promos.filter((p) => p.status === 'active').length;
    const inactive = promos.filter((p) => p.status === 'inactive').length;
    return [
      { label: 'โปรทั้งหมด', value: promos.length },
      { label: 'ใช้งานอยู่', value: active, hint: active ? 'แสดงบนร้าน' : undefined },
      { label: 'ปิดแล้ว', value: inactive },
    ];
  }, [promos]);

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
    <AdminPageShell
      wide
      title="คลังโปรโมชั่น"
      subtitle="สร้างและแจก code ส่วนลด — ลูกค้าได้รับสิทธิ์ทันที ราคาบนเว็บหลังลดอัตโนมัติ"
      action={
        <Link to="/admin/promos/new" className="btn-admin-primary shrink-0">
          + สร้างโปรใหม่
        </Link>
      }
    >
      {!loading && promos.length > 0 && <AdminStatGrid stats={stats} />}

      <div className="admin-filter-bar mt-6">
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
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card admin-card--pad space-y-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card admin-card--pad py-10 text-center">
          <p className="text-body">ยังไม่มีโปรในคลัง</p>
          <Link to="/admin/promos/new" className="btn-admin-primary mt-4 inline-flex">
            สร้างโปรแรก
          </Link>
        </div>
      ) : filterType === 'all' ? (
        <div className="space-y-8">
          {PROMO_TYPE_LIST.map((type) =>
            grouped[type]?.length ? (
              <section key={type} className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                  {PROMO_TYPE_LABELS[type]}
                </h2>
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
    </AdminPageShell>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-filter-chip ${active ? 'admin-filter-chip--active' : ''}`.trim()}
    >
      {label}
    </button>
  );
}

function PromoCard({ promo, onDistribute, onRevoke }) {
  return (
    <article className="admin-card admin-card--pad flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${statusBadgeClass(promo.status)} text-xs`}>
            {getStatusLabel(promo.status)}
          </span>
          <span className="badge-pill text-xs">{PROMO_TYPE_LABELS[promo.promo_type]}</span>
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-ink">{promo.display_name}</h3>
        <p className="mt-1 text-base font-semibold text-primary">{formatPromoDiscount(promo)}</p>
      </div>

      <div className="space-y-1 text-xs text-muted">
        <p>{formatPromoPeriod(promo)}</p>
        {promo.grant_count > 0 && <p>แจกแล้ว {promo.grant_count} ราย</p>}
      </div>

      <div className="admin-promo-card__actions">
        <Link to={`/admin/promos/${promo.id}/edit`} className="btn-ghost min-h-[44px] text-sm">
          แก้ไข
        </Link>
        {promo.status !== 'inactive' && (
          <>
            <button type="button" onClick={onDistribute} className="btn-secondary min-h-[44px] text-sm">
              แจกโปร
            </button>
            <button type="button" onClick={onRevoke} className="btn-admin-danger min-h-[44px] text-sm">
              ปิดใช้งาน
            </button>
          </>
        )}
      </div>
    </article>
  );
}
