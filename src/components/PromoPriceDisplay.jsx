import PriceAmount from './ui/PriceAmount.jsx';
import { usePromo } from '../context/PromoContext.jsx';

export default function PromoPriceDisplay({
  value,
  min,
  max,
  size = 'md',
  className = '',
  showStrike = true,
}) {
  const { resolvePdpPrice } = usePromo();
  const hasRange = min != null && max != null && Number(max) > Number(min);

  if (hasRange) {
    const lo = resolvePdpPrice(min ?? value ?? 0);
    const hi = resolvePdpPrice(max ?? value ?? 0);
    const showStrikeLine = showStrike && (lo.hasDiscount || hi.hasDiscount);
    const hint = lo.minOrderHint || hi.minOrderHint;
    return (
      <div className={className.trim() || undefined}>
        <div className="flex flex-wrap items-baseline gap-2">
          {showStrikeLine && (
            <PriceAmount min={lo.basePrice} max={hi.basePrice} size="sm" muted strike />
          )}
          <PriceAmount min={lo.displayPrice} max={hi.displayPrice} size={size} />
        </div>
        {hint && <p className="mt-1 text-xs font-medium text-primary">{hint}</p>}
      </div>
    );
  }

  const price = resolvePdpPrice(value ?? min ?? 0);
  return (
    <div className={className.trim() || undefined}>
      <div className="flex flex-wrap items-baseline gap-2">
        {showStrike && price.hasDiscount && (
          <PriceAmount value={price.basePrice} size="sm" muted strike />
        )}
        <PriceAmount value={price.displayPrice} size={size} />
      </div>
      {price.minOrderHint && (
        <p className="mt-1 text-xs font-medium text-primary">{price.minOrderHint}</p>
      )}
    </div>
  );
}
