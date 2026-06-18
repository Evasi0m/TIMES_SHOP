import { Link } from 'react-router-dom';
import {
  getListingCardDisplayPrice,
  getListingCardImage,
  getListingCardTitle,
  getListingProductLink,
  normalizeListingItem,
} from '../../lib/listing-display.js';
import { formatUnitsSold, shouldShowUnitsSold } from '../../lib/units-sold.js';
import BadgePill from '../ui/BadgePill.jsx';
import PromoPriceDisplay from '../PromoPriceDisplay.jsx';
import ProductImagePromos from '../ProductImagePromos.jsx';

export default function HomeProductCard({ product, rank }) {
  const item = normalizeListingItem(product);
  const title = getListingCardTitle(item);
  const image = getListingCardImage(item);
  const link = getListingProductLink(item);
  const displayPrice = getListingCardDisplayPrice(item);
  const unitsSold = item.units_sold;
  const inStock = item.in_stock ?? item.stock_available > 0;
  const rankClass =
    rank != null && rank <= 3 ? ` home-product-card__rank--${rank}` : '';

  return (
    <Link to={link} className="home-product-card hover-lift">
      <div className="home-product-card__media">
        {rank != null && (
          <span className={`home-product-card__rank${rankClass}`}>{rank}</span>
        )}
        {image ? (
          <img
            src={image}
            alt={title}
            className={`home-product-card__img ${!inStock ? 'opacity-50' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="home-product-card__placeholder">—</div>
        )}
        <ProductImagePromos className="product-image-promos--home" />
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BadgePill variant="error" className="w-fit">
              สินค้าหมด
            </BadgePill>
          </div>
        )}
      </div>
      <div className="home-product-card__body">
        <p className="home-product-card__title">{title}</p>
        <div className="home-product-card__price-row">
          <PromoPriceDisplay value={displayPrice} size="sm" showStrike={false} />
          {shouldShowUnitsSold(unitsSold) && (
            <span className="home-product-card__sold">{formatUnitsSold(unitsSold)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
