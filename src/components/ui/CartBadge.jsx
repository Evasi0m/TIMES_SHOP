export default function CartBadge({ count, className = '' }) {
  return (
    <span
      key={count}
      className={`badge-pop absolute flex items-center justify-center rounded-full bg-primary font-bold text-on-primary ${className}`.trim()}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
