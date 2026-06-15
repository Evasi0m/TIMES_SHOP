import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export default function AdminRoute() {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        กำลังโหลด...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!ADMIN_ROLES.has(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
