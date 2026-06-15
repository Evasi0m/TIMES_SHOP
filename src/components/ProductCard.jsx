import { Link } from 'react-router-dom';
import { getProductDisplayLines, getProductImageAlt } from '../lib/product-display.js';
import {
  getListingCardImage,
  getListingCardSubtitle,
  getListingCardTitle,
  getListingProductLink,
  isListingCard,
} from '../lib/listing-display.js';
import { formatUnitsSold, shouldShowUnitsSold } from '../lib/units-sold.js';
import ProductImage from './ProductImage.jsx';
import BadgePill from './ui/BadgePill.jsx';
import ShippingBadge from './ShippingBadge.jsx';
import PromoPriceDisplay from './PromoPriceDisplay.jsx';
import PromoLabels from './PromoLabels.jsx';

export default function ProductCard({ product }) {
  const listing = isListingCard(product);
  const inStock = product.in_stock ?? product.stock_available > 0;
  const title = listing ? getListingCardTitle(product) : getProductDisplayLines(product).title;
  const subtitle = listing ? getListingCardSubtitle(product) : getProductDisplayLines(product).subtitle;
  const lowStock = !listing && inStock && product.stock_available <= 3;
  const link = getListingProductLink(product);
  const cardProduct = listing
    ? { ...product, image_url: getListingCardImage(product) }
    : product;

  return (
    <Link
      to={link}
      className="card-canvas hover-lift flex cursor-pointer flex-col gap-2 p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
        <ProductImage
          product={cardProduct}
          alt={listing ? title : getProductImageAlt(product)}
          className="h-full w-full"
          imgClassName={`h-full w-full object-cover ${!inStock ? 'opacity-50' : ''}`}
        />
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="badge-pill bg-nightshade/80 text-on-dark">สินค้าหมด</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ShippingBadge />
        <PromoLabels />
        {!listing && shouldShowUnitsSold(product.units_sold) && (
          <BadgePill className="w-fit">{formatUnitsSold(product.units_sold)}</BadgePill>
        )}
        {listing && Number(product.sku_count) > 1 && (
          <BadgePill className="w-fit">{Number(product.sku_count).toLocaleString('th-TH')} ตัวเลือก</BadgePill>
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-semibold text-ink">{title}</h3>
      {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}

      <div className="mt-auto flex items-end justify-between gap-2">
        <PromoPriceDisplay
          value={listing ? undefined : product.unit_price}
          min={listing ? product.price_min ?? product.unit_price : undefined}
          max={listing ? product.price_max ?? product.unit_price : undefined}
          size="lg"
        />
      </div>

      {lowStock && (
        <p className="text-xs text-warning">เหลือ {product.stock_available} ชิ้น</p>
      )}
    </Link>
  );
}
