import PriceAmount from './PriceAmount.jsx';

const DISPLAY_SIZE_MAP = {
  sm: 'sm',
  md: 'lg',
  lg: 'xl',
  xl: '2xl',
};

export default function PriceDisplay({
  value,
  min,
  max,
  size = 'lg',
  className = '',
}) {
  return (
    <PriceAmount
      value={value}
      min={min}
      max={max}
      size={DISPLAY_SIZE_MAP[size] || DISPLAY_SIZE_MAP.lg}
      className={className}
    />
  );
}
