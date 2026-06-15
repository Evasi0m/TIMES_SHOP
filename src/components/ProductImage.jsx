import { getProductImageAlt } from '../lib/product-display.js';

function WatchPlaceholder({ className = '' }) {
  return (
    <div
      className={`flex items-center justify-center bg-canvas text-muted ${className}`}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 1" />
        <path d="M9 2h6M9 22h6" />
      </svg>
    </div>
  );
}

export default function ProductImage({ product, alt, className = '', imgClassName = '' }) {
  const label = alt || getProductImageAlt(product);
  const src = product?.image_url;

  if (!src) {
    return <WatchPlaceholder className={className} />;
  }

  return (
    <div className={className}>
      <img src={src} alt={label} loading="lazy" className={imgClassName} />
    </div>
  );
}
