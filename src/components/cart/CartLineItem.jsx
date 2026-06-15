import { Link } from 'react-router-dom';
import { getProductDisplayLines, getProductImageAlt } from '../../lib/product-display.js';
import ProductImage from '../ProductImage.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import PriceAmount from '../ui/PriceAmount.jsx';
import { TrashIcon } from '../icons.jsx';

export default function CartLineItem({ item, onQuantityChange, onRemove }) {
  const { title, subtitle } = getProductDisplayLines(item);
  const overStock = item.quantity > item.stock_available;

  return (
    <div className="card-canvas flex gap-3 p-3">
      <ProductImage
        product={item}
        alt={getProductImageAlt(item)}
        className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md"
        imgClassName="h-full w-full object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to={`/product/${item.tiktok_sku_id}`}
          className="line-clamp-2 text-base font-semibold text-ink"
        >
          {title}
        </Link>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        <PriceAmount value={item.unit_price} size="md" className="mt-1" />
        {overStock && (
          <p className="text-xs text-error">คงเหลือเพียง {item.stock_available} ชิ้น</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.stock_available, 1)}
            onChange={(n) => onQuantityChange(item.tiktok_sku_id, n)}
          />
          <button
            type="button"
            className="icon-btn text-muted hover:text-error"
            aria-label="ลบสินค้า"
            onClick={() => onRemove(item.tiktok_sku_id)}
          >
            <TrashIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
