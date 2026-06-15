import { fmtTHB } from '../lib/money.js';
import { useDisplayPrice } from '../context/PromoContext.jsx';

const SIZE_CLASS = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

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
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  if (hasRange) {
    const showStrike = lo.hasDiscount || hi.hasDiscount;
    return (
      <div className={`flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
        {showStrike && (
          <span className="text-sm text-muted line-through">
            {fmtTHB(lo.basePrice)}-{fmtTHB(hi.basePrice)}
          </span>
        )}
        <span className={`font-bold text-primary ${sizeClass}`}>
          {fmtTHB(lo.displayPrice)}-{fmtTHB(hi.displayPrice)}
        </span>
      </div>
    );
  }

  const { basePrice, displayPrice, hasDiscount } = single;
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
      {hasDiscount && (
        <span className="text-sm text-muted line-through">{fmtTHB(basePrice)}</span>
      )}
      <span className={`font-bold text-primary ${sizeClass}`}>{fmtTHB(displayPrice)}</span>
    </div>
  );
}
