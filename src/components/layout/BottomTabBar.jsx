import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { HomeIcon, GridIcon, CartIcon, UserIcon } from '../icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'หน้าแรก', Icon: HomeIcon, end: true },
  { to: '/catalog', label: 'สินค้า', Icon: GridIcon },
  { to: '/cart', label: 'ตะกร้า', Icon: CartIcon, badge: true },
  { to: '/account', label: 'บัญชี', Icon: UserIcon },
];

export default function BottomTabBar() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();

  return (
    <nav className="bottom-tab-bar fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="เมนูหลัก">
      <ul className="mx-auto flex max-w-container">
        {NAV_ITEMS.map(({ to, label, Icon, badge, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              state={to === '/account' && !user ? { from: location } : undefined}
              className={({ isActive }) =>
                `shop-tab w-full ${isActive ? 'shop-tab--active' : ''}`
              }
            >
              <span className="relative">
                <Icon size={22} />
                {badge && count > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-on-primary">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
