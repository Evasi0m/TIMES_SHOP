import { getVariantLabel } from '../../lib/listing-display.js';

export default function VariantPicker({ skus, selectedSkuId, onSelect }) {
  if (!skus?.length || skus.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-body-strong">ตัวเลือกสินค้า</p>
      <div className="flex flex-wrap gap-2">
        {skus.map((sku) => {
          const active = sku.tiktok_sku_id === selectedSkuId;
          const out = !(sku.in_stock ?? sku.stock_available > 0);
          return (
            <button
              key={sku.tiktok_sku_id}
              type="button"
              onClick={() => onSelect(sku.tiktok_sku_id)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-hairline bg-surface-card text-body hover:border-primary/40'
              } ${out ? 'opacity-50' : ''}`}
              aria-pressed={active}
            >
              {getVariantLabel(sku)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
