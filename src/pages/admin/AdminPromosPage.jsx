import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import PromoVaultStats from '../../components/admin/promo-vault/PromoVaultStats.jsx';
import {
  PromoVaultMobileFilters,
  PromoVaultSidebarFilters,
} from '../../components/admin/promo-vault/PromoVaultFilters.jsx';
import PromoVaultSearch from '../../components/admin/promo-vault/PromoVaultSearch.jsx';
import PromoVaultCard from '../../components/admin/promo-vault/PromoVaultCard.jsx';
import PromoVaultTable from '../../components/admin/promo-vault/PromoVaultTable.jsx';
import PromoVaultEmpty from '../../components/admin/promo-vault/PromoVaultEmpty.jsx';
import PromoVaultDistribute from '../../components/admin/promo-vault/PromoVaultDistribute.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usePromo } from '../../context/PromoContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import {
  filterPromos,
  sortPromos,
  VAULT_SORT_NEWEST,
  VAULT_STATUS_ALL,
  VAULT_TYPE_ALL,
} from '../../lib/promo-vault.js';

export default function AdminPromosPage() {
  const toast = useToast();
  const { refresh: refreshCustomerPromos } = usePromo();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(VAULT_STATUS_ALL);
  const [typeFilter, setTypeFilter] = useState(VAULT_TYPE_ALL);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(VAULT_SORT_NEWEST);
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
    const list = filterPromos(promos, {
      type: typeFilter,
      status: statusFilter,
      query,
    });
    return sortPromos(list, sort);
  }, [promos, typeFilter, statusFilter, query, sort]);

  const hasFilters =
    statusFilter !== VAULT_STATUS_ALL ||
    typeFilter !== VAULT_TYPE_ALL ||
    query.trim().length > 0;

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
        <Link to="/admin/promos/new" className="btn-admin-primary shrink-0 lg:hidden">
          + สร้างโปร
        </Link>
      }
    >
      <div className="promo-vault mt-6">
        {!loading && promos.length > 0 && <PromoVaultStats promos={promos} />}

        <PromoVaultMobileFilters
          promos={promos}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
        />

        <div className="promo-vault__layout">
          <PromoVaultSidebarFilters
            promos={promos}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
          />
          <div className="promo-vault__main">
            {!loading && promos.length > 0 && (
              <PromoVaultSearch
                value={query}
                onChange={setQuery}
                sort={sort}
                onSortChange={setSort}
              />
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="promo-vault-skeleton-card space-y-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <div className="hidden lg:block promo-vault-table-wrap p-4">
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <PromoVaultEmpty filtered={hasFilters || promos.length > 0} />
            ) : (
              <>
                <div className="promo-vault-mobile-list">
                  {filtered.map((promo) => (
                    <PromoVaultCard
                      key={promo.id}
                      promo={promo}
                      onDistribute={() => setDistributePromo(promo)}
                      onRevoke={() => handleRevoke(promo)}
                    />
                  ))}
                </div>
                <PromoVaultTable
                  promos={filtered}
                  onDistribute={setDistributePromo}
                  onRevoke={handleRevoke}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <PromoVaultDistribute
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
