import { Link } from 'react-router-dom';
import {
  countPromosByStatus,
  countPromosByType,
  VAULT_STATUS_ALL,
  VAULT_TYPE_ALL,
} from '../../../lib/promo-vault.js';
import { PROMO_TYPE_LABELS, PROMO_TYPE_LIST } from '../../../lib/promo-types.js';

const STATUS_OPTIONS = [
  { id: VAULT_STATUS_ALL, label: 'ทั้งหมด' },
  { id: 'active', label: 'ใช้งาน' },
  { id: 'pending', label: 'แบบร่าง/รอ' },
  { id: 'closed', label: 'ปิดแล้ว' },
];

const TYPE_OPTIONS = [
  { id: VAULT_TYPE_ALL, label: 'ทั้งหมด' },
  ...PROMO_TYPE_LIST.map((t) => ({ id: t, label: PROMO_TYPE_LABELS[t] })),
];

function FilterChips({ options, active, onChange, promos, countFn }) {
  return (
    <div className="promo-vault-chip-row" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={active === opt.id}
          className={`promo-vault-chip${active === opt.id ? ' promo-vault-chip--active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label} ({countFn(promos, opt.id)})
        </button>
      ))}
    </div>
  );
}

function FilterList({ title, options, active, onChange, promos, countFn }) {
  return (
    <div>
      <p className="promo-vault-filter-group__title">{title}</p>
      <ul className="promo-vault-filter-list">
        {options.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              className={`promo-vault-filter-item${
                active === opt.id ? ' promo-vault-filter-item--active' : ''
              }`}
              onClick={() => onChange(opt.id)}
            >
              <span>{opt.label}</span>
              <span className="promo-vault-filter-item__count">{countFn(promos, opt.id)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PromoVaultMobileFilters({
  promos,
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
}) {
  return (
    <div className="promo-vault-mobile-filters">
      <FilterChips
        options={STATUS_OPTIONS}
        active={statusFilter}
        onChange={onStatusChange}
        promos={promos}
        countFn={countPromosByStatus}
      />
      <FilterChips
        options={TYPE_OPTIONS}
        active={typeFilter}
        onChange={onTypeChange}
        promos={promos}
        countFn={countPromosByType}
      />
    </div>
  );
}

export function PromoVaultSidebarFilters({
  promos,
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
}) {
  return (
    <aside className="promo-vault__sidebar">
      <FilterList
        title="สถานะ"
        options={STATUS_OPTIONS}
        active={statusFilter}
        onChange={onStatusChange}
        promos={promos}
        countFn={countPromosByStatus}
      />
      <FilterList
        title="ประเภท"
        options={TYPE_OPTIONS}
        active={typeFilter}
        onChange={onTypeChange}
        promos={promos}
        countFn={countPromosByType}
      />
      <Link to="/admin/promos/new" className="btn-admin-primary min-h-[44px] w-full text-center">
        + สร้างโปรใหม่
      </Link>
    </aside>
  );
}
