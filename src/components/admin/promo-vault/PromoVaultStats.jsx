import { buildVaultStats } from '../../../lib/promo-vault.js';

export default function PromoVaultStats({ promos }) {
  const stats = buildVaultStats(promos);

  const items = [
    { label: 'ทั้งหมด', value: stats.total },
    { label: 'ใช้งาน', value: stats.active },
    { label: 'แบบร่าง/รอ', value: stats.pending },
    { label: 'ปิดแล้ว', value: stats.closed },
  ];

  return (
    <div className="promo-vault-stats" aria-label="สรุปคลังโปร">
      {items.map((item) => (
        <div key={item.label} className="promo-vault-stat">
          <p className="promo-vault-stat__label">{item.label}</p>
          <p className="promo-vault-stat__value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
