import {
  formatCouponTicketSubtitle,
  formatPromoDiscount,
} from '../../lib/promo-display.js';

function CheckIcon() {
  return (
    <svg className="home-coupon-ticket__check" viewBox="0 0 12 12" aria-hidden>
      <path
        fill="currentColor"
        d="M4.5 8.2 2.3 6l-.7.7 2.9 2.9 6.3-6.3-.7-.7z"
      />
    </svg>
  );
}

function getTicketState({ isBroadcast, canCollect, collected, collecting, source }) {
  if (source === 'targeted' || (canCollect && collected)) return 'collected';
  if (canCollect) return 'collect';
  if (isBroadcast) return 'broadcast';
  return 'auto';
}

export default function HomeCouponTicket({ promo, collecting, collected, onCollect, compact = false, onDark = false }) {
  const isBroadcast = promo.source === 'broadcast';
  const canCollect = Boolean(promo.public_code && promo.code_entry_enabled);
  const value = formatPromoDiscount(promo);
  const subtitle = formatCouponTicketSubtitle(promo, value);
  const ticketState = getTicketState({
    isBroadcast,
    canCollect,
    collected,
    collecting,
    source: promo.source,
  });

  return (
    <div
      className={[
        'home-coupon-ticket',
        compact ? 'home-coupon-ticket--compact' : '',
        `home-coupon-ticket--${ticketState}`,
        ticketState === 'collect' ? 'hover-lift' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'home-coupon-ticket__body',
          onDark ? 'home-coupon-ticket__body--on-dark' : 'glass-surface-sm',
        ].join(' ')}
      >
        <div className="home-coupon-ticket__content">
          <div className="home-coupon-ticket__value">{value}</div>
          {subtitle ? <p className="home-coupon-ticket__subtitle">{subtitle}</p> : null}
        </div>

        {ticketState === 'collect' ? (
          <button
            type="button"
            className="home-coupon-ticket__btn"
            disabled={collecting}
            onClick={() => onCollect(promo)}
          >
            {collecting ? '...' : 'เก็บ'}
          </button>
        ) : ticketState === 'collected' ? (
          <span className="home-coupon-ticket__chip home-coupon-ticket__chip--saved">
            <CheckIcon />
            เก็บแล้ว
          </span>
        ) : ticketState === 'broadcast' ? (
          <span className="home-coupon-ticket__chip home-coupon-ticket__chip--ready">ใช้ได้ทันที</span>
        ) : (
          <span className="home-coupon-ticket__chip home-coupon-ticket__chip--muted">อัตโนมัติ</span>
        )}
      </div>
    </div>
  );
}
