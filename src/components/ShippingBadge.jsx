import { useShipping } from '../context/ShippingContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { fmtTHB } from '../lib/money.js';
import BadgePill from './ui/BadgePill.jsx';

export default function ShippingBadge({ className = '' }) {
  const { shippingFee, shippingLabel } = useShipping();
  const { hasFreeShippingPromo } = usePromo();

  const effectiveFree = hasFreeShippingPromo || shippingFee <= 0;
  const label = effectiveFree ? 'ส่งฟรี' : shippingLabel || fmtTHB(shippingFee);
  const variant = effectiveFree ? 'freeShipping' : 'default';

  return (
    <BadgePill variant={variant} className={`w-fit ${className}`.trim()}>
      {label}
    </BadgePill>
  );
}
