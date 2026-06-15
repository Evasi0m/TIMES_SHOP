import { formatPriceParts, formatPriceRangeParts } from '../../lib/money.js';

const SIZE_CLASS = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
};

export default function PriceAmount({
  value,
  min,
  max,
  size = 'lg',
  className = '',
  muted = false,
  strike = false,
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.lg;
  const parts =
    min != null && max != null
      ? formatPriceRangeParts(min, max)
      : formatPriceParts(value);

  const tone = muted || strike ? 'text-muted' : 'text-primary';

  return (
    <span
      className={`price-amount ${tone} ${sizeClass} ${strike ? 'line-through' : ''} ${className}`.trim()}
    >
      <span className="price-amount__symbol" aria-hidden="true">
        {parts.symbol}
      </span>
      <span className="price-amount__value">{parts.amount}</span>
    </span>
  );
}
