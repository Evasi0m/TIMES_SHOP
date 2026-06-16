const VARIANT_CLASS = {
  default: 'badge-pill',
  success: 'badge-pill badge-pill--success',
  warning: 'badge-pill badge-pill--warning',
  error: 'badge-pill badge-pill--error',
  muted: 'badge-pill badge-pill--muted',
  coral: 'badge-coral',
  new: 'new-product-badge',
  freeShipping: 'badge-free-shipping',
  skuOptions: 'badge-units-sold',
  unitsSold: 'badge-units-sold',
  casio: 'badge-casio',
};

export default function BadgePill({ children, variant = 'default', className = '' }) {
  const cls = VARIANT_CLASS[variant] || VARIANT_CLASS.default;
  return <span className={`${cls} ${className}`.trim()}>{children}</span>;
}
