import { getSeriesLabel } from '../../lib/catalog-filters.js';
import FilterChip from './FilterChip.jsx';

export default function SeriesChipBar({
  facets,
  facetsLoading = false,
  activeSeries,
  hasSearch,
  onSelect,
}) {
  const seriesFacets = facets?.series || [];

  return (
    <div className="relative -mx-4 px-4">
      <p className="mb-2 px-1 text-xs text-muted">
        {hasSearch ? 'กำลังค้นหาทั้งร้าน — ปิดคำค้นหาเพื่อกรองตามซีรีส์' : 'เลือกซีรีส์'}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterChip
          label={hasSearch ? 'ค้นหาอยู่' : 'ทั้งหมด'}
          active={!hasSearch && !activeSeries}
          disabled={hasSearch}
          onClick={() => onSelect('')}
          className="w-auto shrink-0 px-5"
        />

        {seriesFacets.map((s) => (
          <FilterChip
            key={s.id}
            label={s.label || getSeriesLabel(s.id)}
            count={facetsLoading ? null : s.count}
            active={!hasSearch && activeSeries === s.id}
            disabled={hasSearch}
            onClick={() => onSelect(s.id)}
            className="w-auto shrink-0 px-4"
          />
        ))}
      </div>
    </div>
  );
}
