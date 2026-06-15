import { PRICE_PRESETS } from '../../lib/catalog-filters.js';
import FilterChip from './FilterChip.jsx';

export default function PriceFilterChips({ min, max, onChange }) {
  const activeId = PRICE_PRESETS.find((p) => p.min === min && p.max === max)?.id;

  return (
    <div className="filter-chip-grid">
      {PRICE_PRESETS.map((preset) => (
        <FilterChip
          key={preset.id}
          label={preset.label}
          active={activeId === preset.id}
          onClick={() =>
            onChange(
              activeId === preset.id ? { min: 0, max: 0 } : { min: preset.min, max: preset.max },
            )
          }
        />
      ))}
    </div>
  );
}
