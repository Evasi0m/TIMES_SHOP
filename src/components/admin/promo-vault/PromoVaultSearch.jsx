export default function PromoVaultSearch({ value, onChange, sort, onSortChange, className = '' }) {
  return (
    <div className={`promo-vault-toolbar ${className}`.trim()}>
      <input
        type="search"
        className="input promo-vault-search"
        placeholder="ค้นหาชื่อหรือโค้ด"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="ค้นหาโปรโมชั่น"
      />
      <select
        className="input promo-vault-sort"
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="เรียงลำดับ"
      >
        <option value="newest">ล่าสุด</option>
        <option value="name">ชื่อ A–Z</option>
      </select>
    </div>
  );
}
