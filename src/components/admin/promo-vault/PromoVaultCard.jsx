import { Link } from 'react-router-dom';
import {
  formatCouponTicketSubtitle,
  formatPromoDiscount,
  formatPromoPeriod,
  getStatusLabel,
  statusBadgeClass,
} from '../../../lib/promo-display.js';
import { PROMO_TYPE_LABELS } from '../../../lib/promo-types.js';

export function PromoVaultChipPreview({ promo }) {
  const value = formatPromoDiscount(promo);
  const subtitle = formatCouponTicketSubtitle(promo, value);
  return (
    <div className="promo-vault-chip-preview glass-surface-sm">
      <span className="promo-vault-chip-preview__value">{value}</span>
      {subtitle ? <span className="promo-vault-chip-preview__sub">{subtitle}</span> : null}
    </div>
  );
}

export default function PromoVaultCard({ promo, onDistribute, onRevoke }) {
  const canRevoke = promo.status !== 'inactive';

  return (
    <article className="promo-vault-card">
      <PromoVaultChipPreview promo={promo} />
      <div className="promo-vault-card__head">
        <div>
          <h3 className="promo-vault-card__title">{promo.display_name}</h3>
          <p className="promo-vault-card__meta">{formatPromoPeriod(promo)}</p>
        </div>
      </div>
      <div className="promo-vault-card__badges">
        <span className={`${statusBadgeClass(promo.status)} text-xs`}>
          {getStatusLabel(promo.status)}
        </span>
        <span className="badge-pill text-xs">{PROMO_TYPE_LABELS[promo.promo_type]}</span>
        {promo.grant_count > 0 && (
          <span className="badge-pill text-xs">แจกแล้ว {promo.grant_count}</span>
        )}
      </div>
      <div className="promo-vault-card__actions">
        {canRevoke && (
          <button type="button" className="btn-admin-primary min-h-[44px]" onClick={onDistribute}>
            แจกโปร
          </button>
        )}
        <Link to={`/admin/promos/${promo.id}/edit`} className="btn-secondary min-h-[44px] text-center">
          แก้ไข
        </Link>
        {canRevoke && (
          <button type="button" className="btn-admin-danger min-h-[44px]" onClick={onRevoke}>
            ปิด
          </button>
        )}
      </div>
    </article>
  );
}
