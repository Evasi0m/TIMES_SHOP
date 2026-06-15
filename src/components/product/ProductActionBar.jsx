import { Link } from 'react-router-dom';
import { formatPriceParts } from '../../lib/money.js';
import { useShipping } from '../../context/ShippingContext.jsx';
import { usePromo } from '../../context/PromoContext.jsx';
import { CartIcon, HomeIcon } from '../icons.jsx';

export default function ProductActionBar({
  price,
  inStock = true,
  onAddToCart,
  onBuyNow,
}) {
  const { shippingShortText } = useShipping();
  const { hasFreeShippingPromo, getDisplayPrice } = usePromo();
  const displayPrice = getDisplayPrice(price);
  const parts = formatPriceParts(displayPrice);
  const shipText = hasFreeShippingPromo ? 'ส่งฟรี' : shippingShortText;
  const subtext = `${parts.symbol}${parts.amount} | ${shipText}`;

  return (
    <div className="pdp-action-bar">
      <Link to="/" className="pdp-action-icon-btn" aria-label="ร้านค้า">
        <HomeIcon size={22} />
        <span>ร้านค้า</span>
      </Link>

      <button
        type="button"
        className="pdp-action-icon-btn"
        aria-label="เพิ่มลงตะกร้า"
        onClick={onAddToCart}
      >
        <span className="relative">
          <CartIcon size={22} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
            +
          </span>
        </span>
        <span>ตะกร้า</span>
      </button>

      <button
        type="button"
        className="pdp-buy-btn"
        disabled={!inStock}
        onClick={onBuyNow}
      >
        <span className="text-base">{inStock ? 'ซื้อเลย' : 'สินค้าหมด'}</span>
        {inStock && (
          <span className="pdp-buy-btn-sub">{subtext}</span>
        )}
      </button>
    </div>
  );
}
