import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin/promos', label: 'คลังโปรโมชั่น' },
  { to: '/admin/shipping', label: 'ค่าจัดส่ง' },
];

export default function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-hairline pb-4">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-sm font-medium transition min-h-[44px] inline-flex items-center ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-soft text-body hover:bg-surface-cream-strong'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
