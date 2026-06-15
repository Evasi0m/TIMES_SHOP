export default function BannerAlert({ variant = 'warning', children, className = '' }) {
  const styles =
    variant === 'error'
      ? 'border-error/40 bg-error/10 text-body-strong'
      : variant === 'info'
        ? 'border-primary/30 bg-primary/5 text-body-strong'
        : 'border-accent-amber/40 bg-accent-amber/10 text-body-strong';

  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 text-sm ${styles} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
