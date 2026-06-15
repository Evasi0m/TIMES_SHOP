import { Link } from 'react-router-dom';

export default function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {action && (
        <Link to={action.href} className="link-btn shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}
