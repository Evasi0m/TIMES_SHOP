import { formatPriceParts, formatPriceRangeParts } from '../../lib/money.js';

const SIZE_CLASS = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export default function PriceDisplay({
  value,
  min,
  max,
  size = 'lg',
  className = '',
  symbolClassName = 'text-[0.72em] align-top font-bold',
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.lg;
  const parts =
    min != null && max != null
      ? formatPriceRangeParts(min, max)
      : formatPriceParts(value);

  return (
    <span className={`inline-flex items-baseline font-bold text-primary ${sizeClass} ${className}`.trim()}>
      <span className={symbolClassName} aria-hidden="true">
        {parts.symbol}
      </span>
      <span>{parts.amount}</span>
    </span>
  );
}
