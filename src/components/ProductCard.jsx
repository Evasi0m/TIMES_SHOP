import { Link } from 'react-router-dom';
import { getProductDisplayLines, getProductImageAlt, isCasioBrandProduct } from '../lib/product-display.js';
import {
  getListingCardDisplayPrice,
  getListingCardImage,
  getListingCardTitle,
  getListingProductLink,
  isListingCard,
  normalizeListingItem,
} from '../lib/listing-display.js';
import { formatUnitsSold, shouldShowUnitsSold } from '../lib/units-sold.js';
import ProductImage from './ProductImage.jsx';
import BadgePill from './ui/BadgePill.jsx';
import PromoPriceDisplay from './PromoPriceDisplay.jsx';
import ProductImagePromos from './ProductImagePromos.jsx';
import { isNewProduct } from '../lib/is-new-product.js';

export default function ProductCard({ product }) {
  const item = normalizeListingItem(product);
  const listing = isListingCard(item);
  const inStock = item.in_stock ?? item.stock_available > 0;
  const title = listing ? getListingCardTitle(item) : getProductDisplayLines(item).title;
  const lowStock = !listing && inStock && item.stock_available <= 3;
  const link = getListingProductLink(item);
  const cardProduct = listing
    ? { ...item, image_url: getListingCardImage(item) }
    : item;
  const showNewBadge = isNewProduct(item);
  const showCasioBadge = isCasioBrandProduct(item);
  const displayPrice = listing ? getListingCardDisplayPrice(item) : item.unit_price;
  const unitsSold = item.units_sold;

  return (
    <Link to={link} className="product-card hover-lift flex cursor-pointer flex-col">
      <div className="product-card__media">
        <ProductImage
          product={cardProduct}
          alt={listing ? title : getProductImageAlt(product)}
          className="h-full w-full"
          imgClassName={`h-full w-full object-cover ${!inStock ? 'opacity-50' : ''}`}
        />
        {showNewBadge && (
          <BadgePill variant="new" className="product-card__new-badge w-fit">
            ใหม่
          </BadgePill>
        )}
        <ProductImagePromos />
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BadgePill variant="error" className="w-fit">
              สินค้าหมด
            </BadgePill>
          </div>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__title">
          {showCasioBadge && (
            <BadgePill variant="casio" className="product-card__title-badge badge-compact">
              CASIO
            </BadgePill>
          )}
          {title}
        </h3>

        <div className="product-card__price-row">
          <PromoPriceDisplay value={displayPrice} size="md" showStrike={false} />
          {shouldShowUnitsSold(unitsSold) && (
            <span className="product-card__sold">{formatUnitsSold(unitsSold)}</span>
          )}
        </div>

        {lowStock && (
          <p className="text-xs text-warning">เหลือ {product.stock_available} ชิ้น</p>
        )}
      </div>
    </Link>
  );
}
