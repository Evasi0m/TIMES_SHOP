import PriceAmount from './ui/PriceAmount.jsx';
import { useDisplayPrice } from '../context/PromoContext.jsx';

export default function PromoPriceDisplay({
  value,
  min,
  max,
  size = 'md',
  className = '',
}) {
  const hasRange = min != null && max != null && Number(max) > Number(min);
  const lo = useDisplayPrice(min ?? value ?? 0);
  const hi = useDisplayPrice(max ?? value ?? 0);
  const single = useDisplayPrice(value ?? min ?? 0);

  if (hasRange) {
    const showStrike = lo.hasDiscount || hi.hasDiscount;
    return (
      <div className={`flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
        {showStrike && (
          <PriceAmount
            min={lo.basePrice}
            max={hi.basePrice}
            size="sm"
            muted
            strike
          />
        )}
        <PriceAmount min={lo.displayPrice} max={hi.displayPrice} size={size} />
      </div>
    );
  }

  const { basePrice, displayPrice, hasDiscount } = single;
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
      {hasDiscount && (
        <PriceAmount value={basePrice} size="sm" muted strike />
      )}
      <PriceAmount value={displayPrice} size={size} />
    </div>
  );
}
