import { Link } from 'react-router-dom';
import {
  formatPromoDiscount,
  formatPromoPeriod,
  getStatusLabel,
  statusBadgeClass,
} from '../../../lib/promo-display.js';
import { PROMO_TYPE_LABELS } from '../../../lib/promo-types.js';
import { PromoVaultChipPreview } from './PromoVaultCard.jsx';

function PromoVaultRow({ promo, onDistribute, onRevoke }) {
  const canRevoke = promo.status !== 'inactive';

  return (
    <tr>
      <td className="promo-vault-table__promo-cell">
        <div className="space-y-2">
          <PromoVaultChipPreview promo={promo} />
          <p className="promo-vault-table__name">{promo.display_name}</p>
        </div>
      </td>
      <td>{PROMO_TYPE_LABELS[promo.promo_type]}</td>
      <td className="font-semibold text-primary">{formatPromoDiscount(promo)}</td>
      <td>
        <span className={`${statusBadgeClass(promo.status)} text-xs`}>
          {getStatusLabel(promo.status)}
        </span>
      </td>
      <td>{promo.grant_count > 0 ? promo.grant_count : '—'}</td>
      <td className="text-muted text-xs whitespace-nowrap">{formatPromoPeriod(promo)}</td>
      <td>
        <div className="promo-vault-table__actions">
          {canRevoke && (
            <button
              type="button"
              className="promo-vault-icon-btn promo-vault-icon-btn--primary"
              onClick={onDistribute}
            >
              แจก
            </button>
          )}
          <Link
            to={`/admin/promos/${promo.id}/edit`}
            className="promo-vault-icon-btn"
          >
            แก้ไข
          </Link>
          {canRevoke && (
            <button
              type="button"
              className="promo-vault-icon-btn promo-vault-icon-btn--danger"
              onClick={onRevoke}
            >
              ปิด
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function PromoVaultTable({ promos, onDistribute, onRevoke }) {
  return (
    <div className="promo-vault-table-wrap">
      <table className="promo-vault-table">
        <thead>
          <tr>
            <th>โปร</th>
            <th>ประเภท</th>
            <th>ส่วนลด</th>
            <th>สถานะ</th>
            <th>แจกแล้ว</th>
            <th>ระยะเวลา</th>
            <th aria-label="การดำเนินการ" />
          </tr>
        </thead>
        <tbody>
          {promos.map((promo) => (
            <PromoVaultRow
              key={promo.id}
              promo={promo}
              onDistribute={() => onDistribute(promo)}
              onRevoke={() => onRevoke(promo)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
