import { useEffect, useState } from 'react';
import { getVariantAttributeName, getVariantLabel } from '../../lib/listing-display.js';
import { formatPriceParts } from '../../lib/money.js';
import { useShipping } from '../../context/ShippingContext.jsx';
import { usePromo } from '../../context/PromoContext.jsx';
import { getProductImageAlt } from '../../lib/product-display.js';
import ProductImage from '../ProductImage.jsx';
import PromoPriceDisplay from '../PromoPriceDisplay.jsx';
import ShippingBadge from '../ShippingBadge.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';

function VariantImageGrid({ skus, selectedSkuId, onSelect }) {
  if (!skus?.length || skus.length <= 1) return null;

  const attrName = getVariantAttributeName(skus);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-body-strong">
        {attrName} ({skus.length})
      </p>
      <div className="variant-grid">
        {skus.map((sku) => {
          const active = sku.tiktok_sku_id === selectedSkuId;
          const out = !(sku.in_stock ?? sku.stock_available > 0);
          return (
            <button
              key={sku.tiktok_sku_id}
              type="button"
              disabled={out}
              onClick={() => onSelect(sku.tiktok_sku_id)}
              className={`variant-grid-tile ${active ? 'variant-grid-tile--active' : ''} ${out ? 'variant-grid-tile--oos' : ''}`}
              aria-pressed={active}
              aria-disabled={out}
            >
              <div className="aspect-square overflow-hidden rounded-md bg-surface-soft">
                <ProductImage
                  product={sku}
                  alt={getProductImageAlt(sku)}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover"
                />
              </div>
              <span className="variant-grid-tile-label">{getVariantLabel(sku)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function VariantBuySheet({
  open,
  mode = 'buy',
  skus = [],
  selectedSku,
  qty = 1,
  onQtyChange,
  onSelectSku,
  onClose,
  onConfirm,
}) {
  const [localQty, setLocalQty] = useState(qty);
  const { shippingShortText } = useShipping();
  const { hasFreeShippingPromo, getDisplayPrice } = usePromo();

  useEffect(() => {
    if (!open) return;
    setLocalQty(qty);
  }, [open, qty]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !selectedSku) return null;

  const inStock = selectedSku.in_stock ?? selectedSku.stock_available > 0;
  const maxQty = Math.min(selectedSku.stock_available || 0, 10);
  const parts = formatPriceParts(getDisplayPrice(selectedSku.unit_price));
  const ctaLabel = mode === 'buy' ? 'ซื้อเลย' : 'เพิ่มลงตะกร้า';
  const shipText = hasFreeShippingPromo ? 'ส่งฟรี' : shippingShortText;
  const ctaSub = `${parts.symbol}${parts.amount} | ${shipText}`;

  function handleConfirm() {
    if (!inStock) return;
    onConfirm({ sku: selectedSku, qty: localQty, mode });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="ปิด"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-sheet-title"
        className="variant-sheet-panel relative z-10"
      >
        <div className="flex items-start gap-3 border-b border-hairline p-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-soft">
            <ProductImage
              product={selectedSku}
              alt={getProductImageAlt(selectedSku)}
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <PromoPriceDisplay value={selectedSku.unit_price} size="md" />
            <ShippingBadge />
            <p id="variant-sheet-title" className="truncate text-sm text-muted">
              {getVariantLabel(selectedSku)}
            </p>
          </div>

          <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="ปิด">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <VariantImageGrid
            skus={skus}
            selectedSkuId={selectedSku.tiktok_sku_id}
            onSelect={onSelectSku}
          />

          {inStock && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-body-strong">จำนวน</span>
              <QuantityStepper
                value={localQty}
                min={1}
                max={maxQty}
                onChange={(n) => {
                  setLocalQty(n);
                  onQtyChange?.(n);
                }}
              />
            </div>
          )}

          {!inStock && (
            <p className="text-sm font-medium text-error">ตัวเลือกนี้สินค้าหมด</p>
          )}
        </div>

        <div className="border-t border-hairline p-4">
          <button
            type="button"
            className="pdp-buy-btn w-full"
            disabled={!inStock}
            onClick={handleConfirm}
          >
            <span className="text-base">{inStock ? ctaLabel : 'สินค้าหมด'}</span>
            {inStock && <span className="pdp-buy-btn-sub">{ctaSub}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
