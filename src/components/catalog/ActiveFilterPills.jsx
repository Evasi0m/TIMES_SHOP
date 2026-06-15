import {
  formatPriceFilterLabel,
  getColorLabel,
  getMaterialLabel,
  getSeriesLabel,
  getSubTypeLabel,
} from '../../lib/catalog-filters.js';

export default function ActiveFilterPills({
  filters,
  hasPriceFilter,
  onRemove,
  onClearAll,
}) {
  const pills = [];

  if (filters.series) {
    pills.push({
      key: 'series',
      label: getSeriesLabel(filters.series),
      onRemove: () => onRemove({ series: null, sub: null, mat: null, color: null }),
    });
  }
  if (filters.sub) {
    pills.push({
      key: 'sub',
      label: getSubTypeLabel(filters.series || 'standard', filters.sub),
      onRemove: () => onRemove({ sub: null, mat: null, color: null }),
    });
  }
  if (filters.mat) {
    const matLabel = getMaterialLabel(filters.mat);
    if (matLabel) {
      pills.push({
        key: 'mat',
        label: matLabel,
        onRemove: () => onRemove({ mat: null, color: null }),
      });
    }
  }
  if (filters.color) {
    pills.push({
      key: 'color',
      label: `สี${getColorLabel(filters.color)}`,
      onRemove: () => onRemove({ color: null }),
    });
  }
  if (hasPriceFilter) {
    pills.push({
      key: 'price',
      label: formatPriceFilterLabel(filters.min, filters.max),
      onRemove: () => onRemove({ min: null, max: null }),
    });
  }

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">กำลังกรอง:</span>
      {pills.map((pill) => (
        <button
          key={pill.key}
          type="button"
          onClick={pill.onRemove}
          className="badge-pill inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 py-2 hover:bg-surface-soft"
        >
          {pill.label}
          <span className="text-muted" aria-hidden>
            ×
          </span>
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="btn-ghost px-2 text-sm text-primary">
        ล้างทั้งหมด
      </button>
    </div>
  );
}
