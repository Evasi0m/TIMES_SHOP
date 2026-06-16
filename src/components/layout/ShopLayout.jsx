import { Outlet, useLocation } from 'react-router-dom';
import AppUpdateBanner from '../AppUpdateBanner.jsx';
import ShopHeader from './ShopHeader.jsx';
import BottomTabBar from './BottomTabBar.jsx';
import { useAppUpdateCheck } from '../../hooks/useAppUpdateCheck.js';

function shouldHideBottomNav(pathname) {
  if (pathname.startsWith('/checkout')) return true;
  if (pathname.startsWith('/product')) return true;
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

export default function ShopLayout() {
  const { pathname } = useLocation();
  const { updateAvailable, reload } = useAppUpdateCheck();
  const hideBottomNav = shouldHideBottomNav(pathname);
  const isAdminRoute = pathname.startsWith('/admin');
  const isProductPage = pathname.startsWith('/product');
  const mainClass = [
    hideBottomNav
      ? isProductPage
        ? 'mx-auto w-full max-w-container flex-1 px-4 py-2 lg:px-6 lg:py-8'
        : 'mx-auto w-full max-w-container flex-1 px-4 py-4 lg:px-6 lg:py-8'
      : 'main-mobile-pb mx-auto w-full max-w-container flex-1 px-4 py-4 lg:px-6 lg:py-8',
    isAdminRoute ? 'admin-route' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex min-h-full flex-col bg-canvas font-sans">
      <ShopHeader />
      <AppUpdateBanner visible={updateAvailable} onReload={reload} />
      <main className={mainClass}>
        <Outlet />
      </main>
      {!hideBottomNav && <BottomTabBar />}
    </div>
  );
}
