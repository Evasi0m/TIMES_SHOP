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

export default function RegisterPage() {
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = resolveRedirectPath(location, searchParams);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setBusy(true);
    try {
      const res = await signUp({ email, password, displayName });
      if (res?.session === null && res?.user && !res?.user?.app_metadata) {
        toast.info('สมัครสำเร็จ กรุณาเข้าสู่ระบบ');
        navigate('/auth/login', { replace: true });
        return;
      }
      toast.success('สมัครสมาชิกสำเร็จ');
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
        <h1 className="font-display text-3xl text-ink">สมัครสมาชิก</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-body-strong">
              ชื่อที่แสดง
            </label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-muted">อย่างน้อย 6 ตัวอักษร</p>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                กำลังสมัคร...
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-muted">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/auth/login" className="link-btn">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
