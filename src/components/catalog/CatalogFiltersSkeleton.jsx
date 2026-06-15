import { Skeleton } from '../Skeleton.jsx';

export function SeriesChipBarSkeleton() {
  const widths = [72, 96, 80, 88, 104, 76];
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-2 h-3 w-20" />
      <div className="-mx-4 flex gap-2 overflow-hidden px-4 pb-1">
        {widths.map((w, i) => (
          <Skeleton key={i} className="h-11 shrink-0 rounded-[11px]" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export function CatalogControlsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3" aria-hidden="true">
      <Skeleton className="h-11 min-w-[200px] flex-1 rounded-[11px]" />
      <Skeleton className="h-11 w-[7.5rem] shrink-0 rounded-[11px]" />
    </div>
  );
}

export function CatalogResultCountSkeleton() {
  return <Skeleton className="h-4 w-44" aria-hidden="true" />;
}

/** Skeleton for chip bar + sort/filter row + result count line. */
export default function CatalogFiltersSkeleton() {
  return (
    <div className="space-y-5" aria-label="กำลังโหลดตัวกรอง" role="status">
      <SeriesChipBarSkeleton />
      <CatalogControlsSkeleton />
      <CatalogResultCountSkeleton />
    </div>
  );
}

export function CatalogFilterSheetSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4" aria-hidden="true">
      {[1, 2, 3].map((section) => (
        <div key={section} className="card-canvas space-y-3 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full max-w-[16rem]" />
          <div className="filter-chip-grid">
            <Skeleton className="h-11 rounded-[11px]" />
            <Skeleton className="h-11 rounded-[11px]" />
            <Skeleton className="h-11 rounded-[11px]" />
            <Skeleton className="h-11 rounded-[11px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
