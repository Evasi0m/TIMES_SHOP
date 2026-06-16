import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SHOP_NAME } from '../../lib/config.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import MiniCartDrawer from '../cart/MiniCartDrawer.jsx';
import { CartIcon, UserIcon } from '../icons.jsx';

export default function ShopHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline-soft bg-canvas/90 backdrop-blur-md">
        <div className="shop-header mx-auto flex w-full max-w-container items-center justify-between px-4 lg:px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink lg:text-2xl">
            {SHOP_NAME}
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="icon-btn relative text-ink"
              aria-label={count > 0 ? `ตะกร้า ${count} ชิ้น` : 'ตะกร้า'}
              onClick={() => setCartOpen(true)}
            >
              <CartIcon size={22} />
              {count > 0 && <CartBadge count={count} />}
            </button>
            <Link
              to={user ? '/account' : '/auth/login'}
              className="icon-btn text-ink"
              aria-label={user ? 'บัญชีของฉัน' : 'เข้าสู่ระบบ'}
            >
              <UserIcon size={22} />
            </Link>
          </div>
        </div>
      </header>
      <MiniCartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function CartBadge({ count }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
      {count > 99 ? '99+' : count}
    </span>
  );
}
