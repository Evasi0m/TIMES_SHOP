import { usePromo } from '../context/PromoContext.jsx';

export default function PromoLabels({ className = '' }) {
  const { promoLabels } = usePromo();
  if (!promoLabels.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      {promoLabels.map((label) => (
        <span key={label} className="badge-promo w-fit text-xs">
          {label}
        </span>
      ))}
    </div>
  );
}
