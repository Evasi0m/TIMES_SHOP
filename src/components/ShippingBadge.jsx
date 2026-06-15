import { useShipping } from '../context/ShippingContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { fmtTHB } from '../lib/money.js';

export default function ShippingBadge({ className = '' }) {
  const { shippingFee, shippingLabel } = useShipping();
  const { hasFreeShippingPromo } = usePromo();

  const effectiveFree = hasFreeShippingPromo || shippingFee <= 0;
  const label = effectiveFree ? 'ส่งฟรี' : shippingLabel || fmtTHB(shippingFee);
  const badgeClass = effectiveFree ? 'badge-promo w-fit' : 'badge-pill w-fit';

  return <span className={`${badgeClass} ${className}`.trim()}>{label}</span>;
}
