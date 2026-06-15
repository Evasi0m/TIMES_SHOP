import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mapError } from '../../lib/error-map.js';
import GoogleButton from '../../components/GoogleButton.jsx';

function resolveRedirectPath(location, searchParams, fallback = '/account') {
  const fromState = location.state?.from?.pathname;
  if (fromState) return fromState;
  const fromQuery = searchParams.get('from');
  if (fromQuery && fromQuery.startsWith('/')) return fromQuery;
  return fallback;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = resolveRedirectPath(location, searchParams);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn({ email, password });
      toast.success('เข้าสู่ระบบสำเร็จ');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="card-canvas p-6 lg:p-8">
        <h1 className="font-display text-3xl text-ink">เข้าสู่ระบบ</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-body-strong">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-body-strong">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-muted">
          ยังไม่มีบัญชี?{' '}
          <Link to="/auth/register" className="link-btn">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
