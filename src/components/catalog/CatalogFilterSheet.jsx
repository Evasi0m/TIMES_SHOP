import { useEffect, useState } from 'react';
import SlideSheet from '../motion/SlideSheet.jsx';
import { SERIES_SUBS } from '../../lib/casio/sub-type-rules.js';
import { visibleMaterialFacets } from '../../lib/catalog-filters.js';
import FilterChip from './FilterChip.jsx';
import FilterSection from './FilterSection.jsx';
import PriceFilterChips from './PriceFilterChips.jsx';
import { CatalogFilterSheetSkeleton } from './CatalogFiltersSkeleton.jsx';

export default function CatalogFilterSheet({
  open,
  onClose,
  facets,
  filters,
  total,
  loading = false,
  onApply,
  onClear,
}) {
  const [temp, setTemp] = useState({
    series: '',
    sub: '',
    mat: '',
    color: '',
    min: 0,
    max: 0,
  });

  useEffect(() => {
    if (!open) return;
    setTemp({
      series: filters.series,
      sub: filters.sub,
      mat: filters.mat,
      color: filters.color,
      min: filters.min,
      max: filters.max,
    });
  }, [open, filters]);

  const seriesOptions = facets?.series || [];
  const subDefs = temp.series ? SERIES_SUBS[temp.series] : [];
  const subOptions = (facets?.sub_types || []).filter((s) =>
    subDefs.some((d) => d.id === s.id),
  );
  const matOptions = visibleMaterialFacets(facets?.materials);
  const colorOptions = facets?.colors || [];

  function pickSeries(series) {
    setTemp((prev) => ({
      ...prev,
      series: prev.series === series ? '' : series,
      sub: '',
      mat: '',
      color: '',
    }));
  }

  function pickSub(sub) {
    setTemp((prev) => ({
      ...prev,
      sub: prev.sub === sub ? '' : sub,
      mat: '',
      color: '',
    }));
  }

  function pickMat(mat) {
    setTemp((prev) => ({
      ...prev,
      mat: prev.mat === mat ? '' : mat,
      color: '',
    }));
  }

  function pickColor(color) {
    setTemp((prev) => ({ ...prev, color: prev.color === color ? '' : color }));
  }

  return (
    <SlideSheet
      open={open}
      onClose={onClose}
      side="bottom"
      ariaLabelledBy="catalog-filter-title"
      panelClassName="filter-sheet-panel flex max-h-[92vh] w-full max-w-lg flex-col lg:max-h-[85vh]"
      zIndex={70}
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <h2 id="catalog-filter-title" className="font-display text-xl text-ink">
            กรองสินค้า
          </h2>
          <p className="mt-0.5 text-xs text-muted">เลือกตามซีรีส์ สาย สี และราคา</p>
        </div>
        <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="ปิด">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {loading && !facets ? (
        <div className="flex-1 overflow-y-auto">
          <CatalogFilterSheetSkeleton />
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <FilterSection title="ซีรีส์" hint="เลือกแบรนด์หรือไลน์นาฬิกา">
            <div className="filter-chip-grid filter-chip-grid--series">
              {seriesOptions.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.label}
                  count={s.count}
                  active={temp.series === s.id}
                  onClick={() => pickSeries(s.id)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="ประเภทนาฬิกา"
            hint={temp.series ? 'เลือกรูปแบบภายในซีรีส์' : 'เลือกซีรีส์ก่อนเพื่อดูประเภทย่อย'}
            hidden={!temp.series || !subDefs.length || subOptions.length <= 0}
          >
            <div className="filter-chip-grid">
              {subOptions.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.label}
                  count={s.count}
                  active={temp.sub === s.id}
                  onClick={() => pickSub(s.id)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="วัสดุสายนาฬิกา"
            hint="เช่น สแตนเลส เรซิน หรือหนัง"
            hidden={matOptions.length <= 1}
          >
            <div className="filter-chip-grid">
              {matOptions.map((m) => (
                <FilterChip
                  key={m.id}
                  label={m.label}
                  count={m.count}
                  active={temp.mat === m.id}
                  onClick={() => pickMat(m.id)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="สี"
            hint="สีตามรหัสรุ่น Casio (1–9)"
            hidden={colorOptions.length <= 1}
          >
            <div className="filter-chip-grid">
              {colorOptions.map((c) => (
                <FilterChip
                  key={c.id}
                  active={temp.color === c.id}
                  onClick={() => pickColor(c.id)}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-hairline"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  <span>{c.label}</span>
                  <span className="filter-chip-count">{c.count.toLocaleString()}</span>
                </FilterChip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="ช่วงราคา" hint="เลือกช่วงราคาที่ต้องการ">
            <PriceFilterChips
              min={temp.min}
              max={temp.max}
              onChange={({ min, max }) => setTemp((prev) => ({ ...prev, min, max }))}
            />
          </FilterSection>
        </div>
      )}

      <div className="flex gap-3 border-t border-hairline bg-surface-strong/95 p-4 backdrop-blur">
        <button type="button" className="btn-ghost flex-1" onClick={onClear} disabled={loading && !facets}>
          ล้างทั้งหมด
        </button>
        <button
          type="button"
          className="btn-primary flex-[2]"
          disabled={loading && !facets}
          onClick={() => {
            onApply(temp);
            onClose();
          }}
        >
          {loading && !facets ? 'กำลังโหลด…' : `แสดง ${total.toLocaleString()} รายการ`}
        </button>
      </div>
    </SlideSheet>
  );
}
