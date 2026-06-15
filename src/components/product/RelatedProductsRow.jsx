import { Link } from 'react-router-dom';
import {
  formatListingPrice,
  getListingCardImage,
  getListingCardTitle,
  getListingProductLink,
} from '../../lib/listing-display.js';
import PriceDisplay from '../ui/PriceDisplay.jsx';

function RelatedCompactCard({ product }) {
  const title = getListingCardTitle(product);
  const image = getListingCardImage(product);
  const link = getListingProductLink(product);
  const min = Number(product?.price_min ?? product?.unit_price) || 0;
  const max = Number(product?.price_max ?? product?.unit_price) || 0;

  return (
    <Link to={link} className="related-compact-card card-canvas block p-2 hover-lift">
      <div className="aspect-square overflow-hidden rounded-lg bg-surface-soft">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">—</div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-semibold text-ink">{title}</p>
      <PriceDisplay min={min} max={max} size="sm" className="mt-1" />
    </Link>
  );
}

export default function RelatedProductsRow({ products = [] }) {
  if (!products.length) return null;

  return (
    <div className="related-scroll-row" aria-label="สินค้าแนะนำ">
      {products.map((p) => (
        <RelatedCompactCard key={p.tiktok_product_id || p.tiktok_sku_id} product={p} />
      ))}
    </div>
  );
}
