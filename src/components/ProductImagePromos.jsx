import { usePromo } from '../context/PromoContext.jsx';
import freeDeliveryIconUrl from '../assets/free-delivery-icon.png';
import couponIconUrl from '../assets/coupon-icon.png';

function FreeDeliveryIcon() {
  return (
    <img
      className="product-image-promos__icon product-image-promos__icon--white"
      src={freeDeliveryIconUrl}
      alt=""
      width={14}
      height={14}
      decoding="async"
      aria-hidden
    />
  );
}

function CouponIcon() {
  return (
    <img
      className="product-image-promos__icon product-image-promos__icon--discount-tint"
      src={couponIconUrl}
      alt=""
      width={14}
      height={14}
      decoding="async"
      aria-hidden
    />
  );
}

export default function ProductImagePromos({ className = '' }) {
  const {
    hasFreeShippingPromo,
    hasProductDiscount,
    hasCodDiscountPromo,
    hasSpecialDiscountPromo,
  } = usePromo();

  if (
    !hasFreeShippingPromo &&
    !hasProductDiscount &&
    !hasCodDiscountPromo &&
    !hasSpecialDiscountPromo
  ) {
    return null;
  }

  return (
    <div
      className={`product-image-promos ${className}`.trim()}
      aria-hidden="true"
    >
      {hasFreeShippingPromo && (
        <span className="product-image-promos__badge product-image-promos__badge--shipping">
          <FreeDeliveryIcon />
          <span>ส่งฟรี</span>
        </span>
      )}
      {hasProductDiscount && (
        <span className="product-image-promos__badge product-image-promos__badge--discount">
          <CouponIcon />
          <span>ส่วนลด</span>
        </span>
      )}
      {hasSpecialDiscountPromo && (
        <span className="product-image-promos__badge product-image-promos__badge--discount">
          <CouponIcon />
          <span>พิเศษ</span>
        </span>
      )}
      {hasCodDiscountPromo && (
        <span className="product-image-promos__badge product-image-promos__badge--discount">
          <CouponIcon />
          <span>ลด COD</span>
        </span>
      )}
    </div>
  );
}
