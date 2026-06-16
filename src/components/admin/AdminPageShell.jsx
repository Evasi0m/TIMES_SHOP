import { Link } from 'react-router-dom';
import AdminNav from './AdminNav.jsx';

export default function AdminPageShell({
  title,
  subtitle,
  backTo = '/account',
  backLabel = '← กลับบัญชี',
  action,
  wide = false,
  children,
}) {
  return (
    <div className={`admin-page mx-auto ${wide ? 'max-w-5xl' : 'max-w-2xl'} space-y-0`}>
      <header className="admin-page__header">
        <div>
          <Link to={backTo} className="admin-page__back">
            {backLabel}
          </Link>
          <h1 className="admin-page__title">{title}</h1>
          {subtitle && <p className="admin-page__subtitle">{subtitle}</p>}
        </div>
        {action && <div className="admin-page__action">{action}</div>}
      </header>

      <AdminNav />

      {children}
    </div>
  );
}
