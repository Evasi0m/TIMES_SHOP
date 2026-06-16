import { usePromo } from '../context/PromoContext.jsx';

function TruckIcon() {
  return (
    <svg
      className="product-image-promos__icon"
      viewBox="0 0 20 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h9A1.5 1.5 0 0 1 12 1.5V2h2.8a1.5 1.5 0 0 1 1.18.57l2.1 2.6A1.5 1.5 0 0 1 18.5 6.8V10a1.5 1.5 0 0 1-1.5 1.5h-1.1a2.5 2.5 0 1 1-5 0H5.6a2.5 2.5 0 1 1-5 0H1.5A1.5 1.5 0 0 1 0 10V1.5zm1.5-.5a.5.5 0 0 0-.5.5v8.5h.6a2.5 2.5 0 1 1 5 0h5.3a2.5 2.5 0 1 1 5 0h.6V7h-3A1.5 1.5 0 0 1 10 5.5V1H1.5zm10.5 0v4.5h3.4L14.5 3.1a.5.5 0 0 0-.4-.2H12z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      className="product-image-promos__icon"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h9A1.5 1.5 0 0 1 13 3.5v1.1a1.5 1.5 0 0 0 0 2.8V9.5A1.5 1.5 0 0 1 11.5 11h-9A1.5 1.5 0 0 1 1 9.5V8.4a1.5 1.5 0 0 0 0-2.8V3.5zm1.5-.5a.5.5 0 0 0-.5.5v1.05c1.05.25 1.05 1.65 0 1.9V9.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V8.05c-1.05-.25-1.05-1.65 0-1.9V3.5a.5.5 0 0 0-.5-.5h-9zM6.2 4.8l-.7.7 1 1-1 1 .7.7 1-1 1 1 .7-.7-1-1 1-1-.7-.7-1 1-1-1z" />
    </svg>
  );
}

export default function ProductImagePromos({ className = '' }) {
  const { hasFreeShippingPromo, hasProductDiscount } = usePromo();

  if (!hasFreeShippingPromo && !hasProductDiscount) return null;

  return (
    <div
      className={`product-image-promos ${className}`.trim()}
      aria-hidden="true"
    >
      {hasFreeShippingPromo && (
        <span className="product-image-promos__badge product-image-promos__badge--shipping">
          <TruckIcon />
          <span>ส่งฟรี</span>
        </span>
      )}
      {hasProductDiscount && (
        <span className="product-image-promos__badge product-image-promos__badge--discount">
          <TicketIcon />
          <span>ส่วนลด</span>
        </span>
      )}
    </div>
  );
}
