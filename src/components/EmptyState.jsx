import { Link } from 'react-router-dom';
import ShopButton from './ui/ShopButton.jsx';

export default function EmptyState({ title, description, actionLabel, actionTo, onAction, icon }) {
  return (
    <div className="motion-slide-up flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon ? (
        <div className="text-muted">{icon}</div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-muted">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
          </svg>
        </div>
      )}
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {description && <p className="max-w-sm text-base text-muted">{description}</p>}
      {actionLabel && onAction && (
        <ShopButton type="button" variant="primary" className="mt-2" onClick={onAction}>
          {actionLabel}
        </ShopButton>
      )}
      {actionLabel && actionTo && !onAction && (
        <Link to={actionTo} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
