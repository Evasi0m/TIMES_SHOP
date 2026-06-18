// Minimal inline icon set (stroke = currentColor) to avoid an icon dependency.

function Icon({ children, size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Icon>
);

export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

export const CartIcon = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2.5 3h2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
  </Icon>
);

export const UserIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const ChevronLeftIcon = (p) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
  </Icon>
);

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const MinusIcon = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const MegaphoneIcon = (p) => (
  <Icon {...p}>
    <path d="M3 10v4h4l5 5V5L7 10H3z" />
    <path d="M16 8.82a4 4 0 0 1 0 6.36" />
    <path d="M19 6.5a7 7 0 0 1 0 11" />
  </Icon>
);

export function AnnouncementVisualizerIcon({ size = 20, ...props }) {
  const height = Math.round(size * 0.8);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 20 16"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect className="announcement-bar__viz-bar announcement-bar__viz-bar--1" x="1" y="4" width="3" height="12" rx="1.5" fill="currentColor" />
      <rect className="announcement-bar__viz-bar announcement-bar__viz-bar--2" x="6" y="2" width="3" height="14" rx="1.5" fill="currentColor" />
      <rect className="announcement-bar__viz-bar announcement-bar__viz-bar--3" x="11" y="5" width="3" height="11" rx="1.5" fill="currentColor" />
      <rect className="announcement-bar__viz-bar announcement-bar__viz-bar--4" x="16" y="3" width="3" height="13" rx="1.5" fill="currentColor" />
    </svg>
  );
}
