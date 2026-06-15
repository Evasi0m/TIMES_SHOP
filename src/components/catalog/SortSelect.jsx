import { SORT_OPTIONS } from '../../lib/catalog-filters.js';

export default function SortSelect({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="shrink-0">เรียง:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input min-h-[44px] flex-1 py-2 text-sm text-ink"
        aria-label="เรียงลำดับสินค้า"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
