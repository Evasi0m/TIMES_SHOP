import { useEffect, useState } from 'react';
import { shopApi } from '../lib/shop-api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/Skeleton.jsx';
import StaggerGrid from '../components/motion/StaggerGrid.jsx';
import CatalogFiltersSkeleton, {
  SeriesChipBarSkeleton,
} from '../components/catalog/CatalogFiltersSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import { SearchIcon } from '../components/icons.jsx';
import SeriesChipBar from '../components/catalog/SeriesChipBar.jsx';
import SortSelect from '../components/catalog/SortSelect.jsx';
import ActiveFilterPills from '../components/catalog/ActiveFilterPills.jsx';
import CatalogFilterSheet from '../components/catalog/CatalogFilterSheet.jsx';
import { CATALOG_PAGE_SIZE, useCatalogFilters } from '../hooks/useCatalogFilters.js';
import { normalizeListingItems } from '../lib/listing-display.js';

export default function CatalogPage() {
  const {
    filters,
    apiParams,
    facetApiParams,
    filterBadgeCount,
    hasPriceFilter,
    hasAnyFilter,
    setSearch,
    setSeries,
    setSort,
    setPage,
    applySheetFilters,
    clearAllFilters,
    clearSheetFilters,
  } = useCatalogFilters();

  const [term, setTerm] = useState(filters.q);
  const [data, setData] = useState({ items: [], total: 0 });
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facetsLoading, setFacetsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setTerm(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (term !== filters.q) setSearch(term);
    }, 300);
    return () => clearTimeout(handle);
  }, [term, filters.q, setSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    shopApi.getCatalog(apiParams).then((res) => {
      if (!active) return;
      if (res.ok) {
        setData({ items: normalizeListingItems(res.items), total: res.total });
        setError(null);
      } else {
        setError(res.message || res.error || 'โหลดสินค้าไม่สำเร็จ');
        setData({ items: [], total: 0 });
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError('โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่');
      setData({ items: [], total: 0 });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [apiParams]);

  useEffect(() => {
    let active = true;
    setFacetsLoading(true);
    shopApi.getCatalog(facetApiParams).then((res) => {
      if (!active) return;
      if (res.ok) setFacets(res.facets || null);
      else setFacets(null);
      setFacetsLoading(false);
    }).catch(() => {
      if (!active) return;
      setFacets(null);
      setFacetsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [facetApiParams]);

  function goToPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function patchFilters(patch) {
    applySheetFilters({
      series: patch.series !== undefined ? patch.series : filters.series,
      sub: patch.sub !== undefined ? patch.sub : filters.sub,
      mat: patch.mat !== undefined ? patch.mat : filters.mat,
      color: patch.color !== undefined ? patch.color : filters.color,
      min: patch.min !== undefined ? patch.min : filters.min,
      max: patch.max !== undefined ? patch.max : filters.max,
    });
  }

  const totalPages = Math.max(1, Math.ceil(data.total / CATALOG_PAGE_SIZE));
  const showingFrom = data.total === 0 ? 0 : (filters.page - 1) * CATALOG_PAGE_SIZE + 1;
  const showingTo = Math.min(filters.page * CATALOG_PAGE_SIZE, data.total);
  const showFilterControls = !loading || data.items.length > 0;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">สินค้าทั้งหมด</h1>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon size={20} />
        </span>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ค้นหารุ่น เช่น W-219HC..."
          className="input pl-10"
          aria-label="ค้นหาสินค้า"
        />
      </div>

      {!showFilterControls ? (
        <CatalogFiltersSkeleton />
      ) : (
        <>
          {facetsLoading && !facets ? (
            <SeriesChipBarSkeleton />
          ) : (
            <SeriesChipBar
              facets={facets}
              facetsLoading={facetsLoading}
              activeSeries={filters.q ? '' : filters.series}
              hasSearch={Boolean(filters.q)}
              onSelect={setSeries}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <SortSelect value={filters.sort} onChange={setSort} />
            </div>
            <button
              type="button"
              className="btn-secondary relative shrink-0"
              onClick={() => setSheetOpen(true)}
            >
              กรองสินค้า
              {filterBadgeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-on-dark">
                  {filterBadgeCount}
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {showFilterControls && (
        <ActiveFilterPills
          filters={filters}
          hasPriceFilter={hasPriceFilter}
          onRemove={patchFilters}
          onClearAll={clearAllFilters}
        />
      )}

      {showFilterControls && !error && data.total > 0 && (
        <p className="text-sm text-muted">
          แสดง {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} จาก{' '}
          {data.total.toLocaleString()} รายการ
        </p>
      )}

      <div aria-busy={loading} aria-live="polite">
        {loading ? (
          <ProductGridSkeleton count={CATALOG_PAGE_SIZE} />
        ) : error ? (
          <BannerAlert variant="error">{error}</BannerAlert>
        ) : data.items.length === 0 ? (
          <EmptyState
            title={hasAnyFilter ? 'ไม่พบสินค้าตามตัวกรอง' : 'ไม่พบสินค้า'}
            description={
              filters.q
                ? `ไม่พบ "${filters.q}" — ลองค้นหารหัสรุ่น เช่น GA-2100 หรือ MTP-1302`
                : hasAnyFilter
                  ? 'ลองปรับตัวกรองหรือล้างตัวกรองแล้วลองใหม่'
                  : 'ยังไม่มีสินค้าในขณะนี้'
            }
            actionLabel={hasAnyFilter ? 'ล้างตัวกรอง' : 'ดูสินค้าทั้งหมด'}
            actionTo="/catalog"
            onAction={hasAnyFilter ? clearAllFilters : undefined}
          />
        ) : (
          <>
            <StaggerGrid className="product-grid">
              {data.items.map((p) => (
                <ProductCard key={p.tiktok_product_id || p.tiktok_sku_id} product={p} />
              ))}
            </StaggerGrid>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  className="btn-outline px-4"
                  disabled={filters.page <= 1}
                  onClick={() => goToPage(filters.page - 1)}
                >
                  ก่อนหน้า
                </button>
                <span className="text-sm text-muted">
                  หน้า {filters.page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-outline px-4"
                  disabled={filters.page >= totalPages}
                  onClick={() => goToPage(filters.page + 1)}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CatalogFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        facets={facets}
        filters={filters}
        total={data.total}
        loading={facetsLoading}
        onApply={applySheetFilters}
        onClear={() => {
          clearSheetFilters();
          setSheetOpen(false);
        }}
      />
    </div>
  );
}
