import { NavLink } from 'react-router-dom';

const links = [
  {
    to: '/admin/dashboard',
    label: 'แดชบอร์ด',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/admin/products',
    label: 'สินค้า',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    to: '/admin/promos',
    label: 'คลังโปรโมชั่น',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
        <path d="M4 9l8-5 8 5" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    to: '/admin/slips',
    label: 'ตรวจสลิป',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 15h4M7 11h8" />
        <path d="M14 9l3 3-3 3" />
      </svg>
    ),
  },
  {
    to: '/admin/banks',
    label: 'บัญชีธนาคาร',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 10h18M5 10V20M9 10V20M15 10V20M19 10V20M2 20h20M12 4l9 6H3l9-6z" />
      </svg>
    ),
  },
  {
    to: '/admin/shipping',
    label: 'ค่าจัดส่ง',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  {
    to: '/admin/homepage',
    label: 'ออกแบบหน้าแรก',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/admin/announcement',
    label: 'ประกาศวิ่ง',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 11v2a4 4 0 0 0 4 4h10" />
        <path d="M7 9V7a4 4 0 0 1 4-4 4 4 0 0 1 4 4v2" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="เมนูผู้ดูแล">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`.trim()
          }
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
